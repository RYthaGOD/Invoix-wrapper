
import { Request, Response } from "express";
import {
    createSolanaRpc,
    address,
    createTransactionMessage,
    pipe,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
    compileTransactionMessage,
    getProgramDerivedAddress,
    type TransactionSigner,
    type Address,
    AccountRole,
} from "@solana/kit";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, VersionedTransaction, MessageV0 } from "@solana/web3.js";
import { getInitializeInstructionAsync } from "../../app/src/generated/instructions/initialize";
import { getWrapInstructionAsync } from "../../app/src/generated/instructions/wrap";
import { getUnwrapInstructionAsync } from "../../app/src/generated/instructions/unwrap";
import {
    createConfigureConfidentialInstruction,
    createApplyPendingBalanceInstruction
} from "../../app/src/confidential";

// Initialize RPC
const CONNECTION_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const rpc = createSolanaRpc(CONNECTION_URL);

// Program ID
const PROGRAM_ID = address("D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY");

// Helper to create a Noop Signer
const createNoopSigner = (addr: Address): TransactionSigner => ({
    address: addr,
    signTransactions: async (txs: any) => txs,
} as any);

// Helper to derive vault PDA
const deriveVaultPda = async (originalMint: Address): Promise<Address> => {
    const [vaultPda] = await getProgramDerivedAddress({
        programAddress: PROGRAM_ID,
        seeds: [
            new TextEncoder().encode("vault"),
            new PublicKey(originalMint).toBytes()
        ]
    });
    return vaultPda;
};

// Input validation helpers
const isValidSolanaAddress = (addr: string): boolean => {
    try {
        address(addr);
        return true;
    } catch {
        return false;
    }
};

const isValidAmount = (amount: string): boolean => {
    try {
        const amt = BigInt(amount);
        return amt > 0n;
    } catch {
        return false;
    }
};


// Helper to convert @solana/kit CompiledTransactionMessage to @solana/web3.js v1 MessageV0
const toWeb3JsMessageV0 = (compiledMessage: any): MessageV0 => {
    // Audit: Validate input presence
    if (!compiledMessage || !compiledMessage.instructions || !compiledMessage.header) {
        throw new Error("Invalid compiled message provided for conversion");
    }

    const instructions = compiledMessage.instructions.map((ix: any) => {
        const mapped = {
            programIdIndex: ix.programAddressIndex ?? ix.programIdIndex,
            accountKeyIndexes: ix.accountIndices ?? ix.accountKeyIndexes,
            data: new Uint8Array(ix.data)
        };
        return mapped;
    });

    return new MessageV0({
        header: {
            numRequiredSignatures: compiledMessage.header.numSignerAccounts,
            numReadonlySignedAccounts: compiledMessage.header.numReadonlySignerAccounts,
            numReadonlyUnsignedAccounts: compiledMessage.header.numReadonlyNonSignerAccounts,
        },
        staticAccountKeys: compiledMessage.staticAccounts.map((k: string) => new PublicKey(k)),
        recentBlockhash: compiledMessage.lifetimeToken,
        compiledInstructions: instructions,
        addressTableLookups: compiledMessage.addressTableLookups || []
    });
};

export const initializeController = async (req: Request, res: Response) => {
    console.log("Initialize controller called");
    try {
        const { payer, originalMint, wrapFeeBps, unwrapFeeBps, auditorElgamalPubkey } = req.body;
        console.log("Request body:", req.body);

        if (!payer || !originalMint) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["payer", "originalMint"]
            });
        }

        const payerAddress = address(payer);
        const originalMintAddress = address(originalMint);

        const ix = await getInitializeInstructionAsync({
            user: createNoopSigner(payerAddress),
            originalMint: originalMintAddress,
            wrapFeeBps: wrapFeeBps || 0,
            unwrapFeeBps: unwrapFeeBps || 0,
            auditorElgamalPubkey: auditorElgamalPubkey ? new Uint8Array(Buffer.from(auditorElgamalPubkey, 'base64')) : null,
        });

        console.log("Getting latest blockhash for initialize...");
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
        console.log("Blockhash received:", latestBlockhash.blockhash);

        const message = pipe(
            createTransactionMessage({ version: 0 }),
            (m) => setTransactionMessageFeePayer(payerAddress, m),
            (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
            (m) => appendTransactionMessageInstruction(ix, m)
        );

        const compiledMessage = compileTransactionMessage(message);
        const v0Message = toWeb3JsMessageV0(compiledMessage);

        const tx = new VersionedTransaction(v0Message);
        const base64Transaction = Buffer.from(tx.serialize()).toString('base64');

        res.json({
            transaction: base64Transaction,
            message: "Initialization transaction created successfully"
        });

    } catch (error: any) {
        console.error("Error in initializeController:", error);
        res.status(500).json({ error: error.message });
    }
};

export const wrapController = async (req: Request, res: Response) => {
    try {
        const { payer, originalMint, amount, userOriginalAccount } = req.body; // Logs removed for brevity but logic remains same
        console.log("Wrap controller called");
        console.log("Request body:", req.body);

        // Validate required fields
        if (!payer || !originalMint || !amount) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["payer", "originalMint", "amount"]
            });
        }

        // Validate address formats
        if (!isValidSolanaAddress(payer)) return res.status(400).json({ error: "Invalid payer address format" });
        if (!isValidSolanaAddress(originalMint)) return res.status(400).json({ error: "Invalid originalMint address format" });
        if (userOriginalAccount && !isValidSolanaAddress(userOriginalAccount)) return res.status(400).json({ error: "Invalid userOriginalAccount address format" });
        if (!isValidAmount(amount)) return res.status(400).json({ error: "Invalid amount: must be a positive integer" });

        const payerAddress = address(payer);
        const originalMintAddress = address(originalMint);
        const amountBigInt = BigInt(amount);

        // Derive userOriginalAccount if not provided
        let userOriginalAccountAddress: Address;
        if (userOriginalAccount) {
            userOriginalAccountAddress = address(userOriginalAccount);
        } else {
            const ata = getAssociatedTokenAddressSync(
                new PublicKey(originalMintAddress),
                new PublicKey(payerAddress)
            );
            userOriginalAccountAddress = address(ata.toBase58());
        }

        // Derive vault PDA
        console.log("Deriving vault PDA...");
        const vaultPda = await deriveVaultPda(originalMintAddress);
        console.log("Vault PDA derived:", vaultPda);

        const ix = await getWrapInstructionAsync({
            user: createNoopSigner(payerAddress),
            originalMint: originalMintAddress,
            amount: amountBigInt,
            userOriginalAccount: userOriginalAccountAddress,
            vault: vaultPda,
        });

        console.log("Getting latest blockhash for wrap...");
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
        console.log("Blockhash received:", latestBlockhash.blockhash);

        const message = pipe(
            createTransactionMessage({ version: 0 }),
            (m) => setTransactionMessageFeePayer(payerAddress, m),
            (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
            (m) => appendTransactionMessageInstruction(ix, m)
        );

        const compiledMessage = compileTransactionMessage(message);
        const v0Message = toWeb3JsMessageV0(compiledMessage);

        // Use VersionedTransaction for serialization
        const tx = new VersionedTransaction(v0Message);
        const serialized = tx.serialize();
        const base64Transaction = Buffer.from(serialized).toString('base64');
        console.log("Wrap transaction created.");

        res.json({
            transaction: base64Transaction,
            message: "Transaction created successfully"
        });

    } catch (error: any) {
        console.error("Error in wrapController:", error);
        res.status(500).json({ error: error.message });
    }
};

export const unwrapController = async (req: Request, res: Response) => {
    try {
        const { payer, originalMint, amount, userOriginalAccount } = req.body;

        // Validate required fields
        if (!payer || !originalMint || !amount) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["payer", "originalMint", "amount"]
            });
        }
        if (!isValidSolanaAddress(payer)) return res.status(400).json({ error: "Invalid payer address format" });
        if (!isValidSolanaAddress(originalMint)) return res.status(400).json({ error: "Invalid originalMint address format" });
        if (userOriginalAccount && !isValidSolanaAddress(userOriginalAccount)) return res.status(400).json({ error: "Invalid userOriginalAccount address format" });
        if (!isValidAmount(amount)) return res.status(400).json({ error: "Invalid amount: must be a positive integer" });

        const payerAddress = address(payer);
        const originalMintAddress = address(originalMint);
        const amountBigInt = BigInt(amount);

        let userOriginalAccountAddress: Address;
        if (userOriginalAccount) {
            userOriginalAccountAddress = address(userOriginalAccount);
        } else {
            const ata = getAssociatedTokenAddressSync(
                new PublicKey(originalMintAddress),
                new PublicKey(payerAddress)
            );
            userOriginalAccountAddress = address(ata.toBase58());
        }

        // Derive userWrappedAccount (Token-2022 ATA)
        const wrappedMintSeeds = [
            new TextEncoder().encode("mint"),
            new PublicKey(originalMintAddress).toBytes()
        ];
        const [wrappedMintPda] = await getProgramDerivedAddress({
            programAddress: PROGRAM_ID,
            seeds: wrappedMintSeeds
        });

        const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
        const userWrappedAccountAddress = getAssociatedTokenAddressSync(
            new PublicKey(wrappedMintPda),
            new PublicKey(payerAddress),
            false,
            TOKEN_2022_PROGRAM_ID
        );

        // Derive vault PDA
        const vaultPda = await deriveVaultPda(originalMintAddress);

        const ix = await getUnwrapInstructionAsync({
            user: createNoopSigner(payerAddress),
            originalMint: originalMintAddress,
            amount: amountBigInt,
            userOriginalAccount: userOriginalAccountAddress,
            userWrappedAccount: address(userWrappedAccountAddress.toBase58()),
            vault: vaultPda,
        });

        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

        const message = pipe(
            createTransactionMessage({ version: 0 }),
            (m) => setTransactionMessageFeePayer(payerAddress, m),
            (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
            (m) => appendTransactionMessageInstruction(ix, m)
        );

        const compiledMessage = compileTransactionMessage(message);
        const v0Message = toWeb3JsMessageV0(compiledMessage);

        // Use VersionedTransaction for serialization
        const tx = new VersionedTransaction(v0Message);
        const serialized = tx.serialize();
        const base64Transaction = Buffer.from(serialized).toString('base64');

        res.json({
            transaction: base64Transaction,
            message: "Transaction created successfully"
        });

    } catch (error: any) {
        console.error("Error in unwrapController:", error);
        res.status(500).json({ error: error.message });
    }
};

export const configureConfidentialController = async (req: Request, res: Response) => {
    console.log("Configure confidential controller called");
    try {
        const { payer, originalMint } = req.body;
        console.log("Request body:", req.body);

        if (!payer || !originalMint) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["payer", "originalMint"]
            });
        }

        const payerAddress = address(payer);
        const originalMintAddress = address(originalMint);
        console.log("Payer address:", payerAddress);
        console.log("Original mint address:", originalMintAddress);

        // Derive wrappedMint PDA
        console.log("Deriving wrapped mint PDA...");
        const [wrappedMintPda] = await getProgramDerivedAddress({
            programAddress: PROGRAM_ID,
            seeds: [
                new TextEncoder().encode("mint"),
                new PublicKey(originalMintAddress).toBytes()
            ]
        });
        console.log("Wrapped mint PDA:", wrappedMintPda);

        const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
        console.log("Deriving user wrapped account address...");
        const userWrappedAccountAddress = getAssociatedTokenAddressSync(
            new PublicKey(wrappedMintPda),
            new PublicKey(payerAddress),
            false,
            TOKEN_2022_PROGRAM_ID
        );
        console.log("User wrapped account address:", userWrappedAccountAddress.toBase58());

        console.log("Creating configure confidential instruction...");
        const ixRaw = createConfigureConfidentialInstruction(
            PROGRAM_ID.toString(),
            payerAddress.toString(),
            wrappedMintPda.toString(),
            originalMintAddress.toString(),
            userWrappedAccountAddress.toString()
        );
        console.log("Configure confidential instruction created.");

        // Convert raw instruction to @solana/kit format
        const ix = {
            programAddress: address(ixRaw.programId),
            accounts: ixRaw.keys.map(k => ({
                address: address(k.pubkey),
                role: k.isWritable
                    ? (k.isSigner ? AccountRole.WRITABLE_SIGNER : AccountRole.WRITABLE)
                    : (k.isSigner ? AccountRole.READONLY_SIGNER : AccountRole.READONLY)
            })),
            data: ixRaw.data
        };
        console.log("Instruction Accounts (Config):", JSON.stringify(ix.accounts, null, 2));

        console.log("Getting latest blockhash for config...");
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
        console.log("Blockhash received:", latestBlockhash.blockhash);

        const message = pipe(
            createTransactionMessage({ version: 0 }),
            (m) => setTransactionMessageFeePayer(payerAddress as Address, m),
            (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
            (m) => appendTransactionMessageInstruction(ix as any, m)
        );

        console.log("Instruction (Config):", JSON.stringify(ix, (key, value) =>
            typeof value === 'bigint' ? value.toString() :
                value instanceof Uint8Array ? Array.from(value) : value
            , 2));
        const compiledMessage = compileTransactionMessage(message);
        console.log("Compiled Message (Config):", JSON.stringify(compiledMessage, (key, value) =>
            typeof value === 'bigint' ? value.toString() :
                value instanceof Uint8Array ? Array.from(value) : value
            , 2));
        const v0Message = toWeb3JsMessageV0(compiledMessage);

        const tx = new VersionedTransaction(v0Message);
        const base64Transaction = Buffer.from(tx.serialize()).toString('base64');

        res.json({
            transaction: base64Transaction,
            message: "Configuration transaction created successfully"
        });

    } catch (error: any) {
        console.error("Error in configureConfidentialController:", error);
        res.status(500).json({ error: error.message });
    }
};

export const applyPendingBalanceController = async (req: Request, res: Response) => {
    try {
        const { payer, originalMint, expectedCounter, newDecryptableBalance } = req.body;

        if (!payer || !originalMint || expectedCounter === undefined || !newDecryptableBalance) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["payer", "originalMint", "expectedCounter", "newDecryptableBalance"]
            });
        }

        const payerAddress = address(payer);
        const originalMintAddress = address(originalMint);

        // Derive wrappedMint
        const [wrappedMintPda] = await getProgramDerivedAddress({
            programAddress: PROGRAM_ID,
            seeds: [
                new TextEncoder().encode("mint"),
                new PublicKey(originalMintAddress).toBytes()
            ]
        });

        const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
        const userWrappedAccountAddress = getAssociatedTokenAddressSync(
            new PublicKey(wrappedMintPda),
            new PublicKey(payerAddress),
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const ixRaw = createApplyPendingBalanceInstruction(
            PROGRAM_ID.toString(),
            payerAddress.toString(),
            userWrappedAccountAddress.toString(),
            BigInt(expectedCounter),
            Buffer.from(newDecryptableBalance, 'base64')
        );

        const ix = {
            programAddress: address(ixRaw.programId),
            accounts: ixRaw.keys.map(k => ({
                address: address(k.pubkey),
                role: k.isWritable
                    ? (k.isSigner ? AccountRole.WRITABLE_SIGNER : AccountRole.WRITABLE)
                    : (k.isSigner ? AccountRole.READONLY_SIGNER : AccountRole.READONLY)
            })),
            data: ixRaw.data
        };

        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

        const message = pipe(
            createTransactionMessage({ version: 0 }),
            (m) => setTransactionMessageFeePayer(payerAddress, m),
            (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
            (m) => appendTransactionMessageInstruction(ix as any, m)
        );

        const compiledMessage = compileTransactionMessage(message);
        const v0Message = toWeb3JsMessageV0(compiledMessage);

        const tx = new VersionedTransaction(v0Message);
        const base64Transaction = Buffer.from(tx.serialize()).toString('base64');

        res.json({
            transaction: base64Transaction,
            message: "Apply pending balance transaction created successfully"
        });

    } catch (error: any) {
        console.error("Error in applyPendingBalanceController:", error);
        res.status(500).json({ error: error.message });
    }
};
