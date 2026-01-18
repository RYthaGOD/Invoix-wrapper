
import { Request, Response } from "express";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, Connection, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { createWrapInstruction, createUnwrapInstruction } from "../../app/src/instructions";
// @ts-ignore
import * as idl from "../../app/src/c_spl_wrapper.json";

// Initialize Connection and Program
const CONNECTION_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const connection = new Connection(CONNECTION_URL, "confirmed");

// Dummy wallet for Anchor Provider (ReadOnly context)
const mockWallet = {
    publicKey: Keypair.generate().publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
};

const provider = new anchor.AnchorProvider(connection, mockWallet as any, {
    preflightCommitment: "confirmed",
});

// @ts-ignore
const program = new anchor.Program(idl as any, provider);

export const wrapController = async (req: Request, res: Response) => {
    try {
        const { payer, originalMint, amount, userOriginalAccount, userWrappedAccount } = req.body;

        if (!payer || !originalMint || !amount) {
            return res.status(400).json({ error: "Missing required fields: payer, originalMint, amount" });
        }

        const payerPubkey = new PublicKey(payer);
        const originalMintPubkey = new PublicKey(originalMint);
        const amountBn = new anchor.BN(amount);

        // Derive accounts if not provided
        let userOriginalAccountPubkey = userOriginalAccount ? new PublicKey(userOriginalAccount) : null;
        let userWrappedAccountPubkey = userWrappedAccount ? new PublicKey(userWrappedAccount) : null;

        if (!userOriginalAccountPubkey) {
            userOriginalAccountPubkey = await getAssociatedTokenAddress(
                originalMintPubkey,
                payerPubkey
            );
        }

        // For wrapped account, we need to know the wrapped mint. 
        // Ideally the SDK helps here, but we can also use the program's derive logic if exposed or replicate it.
        // Assuming we need to calculate it if not passed.
        // However, `createWrapInstruction` takes `userWrappedAccount`.
        // We know the wrappedMint derived address is needed to find the ATA.

        // Replicating PDAs logic from SDK (since we can't easily import internal helpers from here without full build)
        // OR we just import them if we update tsconfig path mapping.
        // For now, let's assume the user passes it or we implement a helper.

        // Actually, we can import `findWrappedMintPda` from `../../app/src/pdas` if we fix imports.
        // Let's rely on the user passing it for V1 OR derive it if we can fix the imports.
        // Given verify_sdk_headless worked with relative path, we can import safely.

        if (!userWrappedAccountPubkey) {
            // We need wrapped mint address first. 
            const [wrappedMint] = PublicKey.findProgramAddressSync(
                [Buffer.from("mint"), originalMintPubkey.toBuffer()],
                program.programId
            );

            userWrappedAccountPubkey = await getAssociatedTokenAddress(
                wrappedMint,
                payerPubkey
            );
        }

        const ix = await createWrapInstruction(
            program,
            payerPubkey,
            originalMintPubkey,
            userOriginalAccountPubkey,
            userWrappedAccountPubkey,
            amountBn
        );

        const tx = new Transaction();
        tx.add(ix);
        tx.feePayer = payerPubkey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

        res.json({
            transaction: serialized.toString("base64"),
            message: "Transaction created successfully"
        });

    } catch (error: any) {
        console.error("Error in wrapController:", error);
        res.status(500).json({ error: error.message });
    }
};


export const unwrapController = async (req: Request, res: Response) => {
    try {
        const { payer, originalMint, amount, userOriginalAccount, userWrappedAccount } = req.body;

        if (!payer || !originalMint || !amount) {
            return res.status(400).json({ error: "Missing required fields: payer, originalMint, amount" });
        }

        const payerPubkey = new PublicKey(payer);
        const originalMintPubkey = new PublicKey(originalMint);
        const amountBn = new anchor.BN(amount);

        // Derive accounts logic (similar to wrap)
        let userOriginalAccountPubkey = userOriginalAccount ? new PublicKey(userOriginalAccount) : null;
        let userWrappedAccountPubkey = userWrappedAccount ? new PublicKey(userWrappedAccount) : null;

        if (!userOriginalAccountPubkey) {
            userOriginalAccountPubkey = await getAssociatedTokenAddress(
                originalMintPubkey,
                payerPubkey
            );
        }

        if (!userWrappedAccountPubkey) {
            const [wrappedMint] = PublicKey.findProgramAddressSync(
                [Buffer.from("mint"), originalMintPubkey.toBuffer()],
                program.programId
            );
            userWrappedAccountPubkey = await getAssociatedTokenAddress(
                wrappedMint,
                payerPubkey
            );
        }

        const ix = await createUnwrapInstruction(
            program,
            payerPubkey,
            originalMintPubkey,
            userOriginalAccountPubkey,
            userWrappedAccountPubkey,
            amountBn
        );

        const tx = new Transaction();
        tx.add(ix);
        tx.feePayer = payerPubkey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

        res.json({
            transaction: serialized.toString("base64"),
            message: "Transaction created successfully"
        });

    } catch (error: any) {
        console.error("Error in unwrapController:", error);
        res.status(500).json({ error: error.message });
    }
};
