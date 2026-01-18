import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import {
    createMint,
    getAssociatedTokenAddress,
    createAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";
import fs from "fs";
import os from "os";
import path from "path";
import { CSplWrapper } from "./types";

// Load IDL manually to avoid resolveJsonModule issues in ts-node
const idlPath = path.resolve(__dirname, "../../target/idl/c_spl_wrapper.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

// Devnet Program ID
const PROGRAM_ID = new PublicKey("D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY");

async function main() {
    // 1. Setup Connection and Wallet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    const homeDir = os.homedir();
    const keypairPath = path.join(homeDir, ".config", "solana", "id.json");
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
    const wallet = Keypair.fromSecretKey(secretKey);
    const provider = new AnchorProvider(connection, new Wallet(wallet), { commitment: "confirmed" });

    // Force casting IDL
    const program = new Program(idl as any, provider) as unknown as Program<CSplWrapper>;

    console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
    console.log("Creating test assets...");

    // 2. Create a fresh Test Mint (Mock USDC)
    const testMint = await createMint(
        connection,
        wallet,
        wallet.publicKey,
        wallet.publicKey,
        6 // 6 decimals
    );
    console.log(`Test Mint: ${testMint.toBase58()}`);

    // 3. Create ATA and Mint some tokens
    const userAta = await createAssociatedTokenAccount(
        connection,
        wallet,
        testMint,
        wallet.publicKey
    );
    await mintTo(connection, wallet, testMint, userAta, wallet.publicKey, 1000_000000); // 1000 tokens
    console.log("Minted 1000 test tokens");

    // 4. Initialize Wrapper
    console.log("Initializing Wrapper...");
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config"), testMint.toBuffer()],
        PROGRAM_ID
    );
    const [statsPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("stats"), testMint.toBuffer()],
        PROGRAM_ID
    );
    const [wrappedMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), testMint.toBuffer()],
        PROGRAM_ID
    );
    const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), testMint.toBuffer()],
        PROGRAM_ID
    );

    try {
        await program.methods
            .initialize(100, 100, null) // 1% fee
            .accounts({
                user: wallet.publicKey,
                originalMint: testMint,
                // PDAs are derived in macro but passing explicit for clarity sometimes needed if IDL is old
                // But Anchor 0.29+ usually handles it. Let's rely on auto-derivation if possible, 
                // but for safety in scripts I prefer explicit if needed.
                // Actually the IDL has them as `seeds` so we don't need to pass them explicitly usually.
                // Let's pass the ones required by IDL logic.
                wrapperConfig: configPda,
                wrapperStats: statsPda,
                wrappedMint: wrappedMintPda,
                vault: vaultPda,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                token2022Program: TOKEN_2022_PROGRAM_ID,
            } as any)
            .rpc();
        console.log("Wrapper Initialized!");
    } catch (e) {
        console.log("Wrapper might already exist or failed:", e);
        throw e;
    }

    // 5. Wrap Tokens
    console.log("Wrapping 100 tokens...");
    const userWrappedAta = await getAssociatedTokenAddress(
        wrappedMintPda,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
    );

    await program.methods
        .wrap(new BN(100_000000))
        .accounts({
            user: wallet.publicKey,
            originalMint: testMint,
            wrapperConfig: configPda,
            wrapperStats: statsPda,
            wrappedMint: wrappedMintPda,
            userOriginalAccount: userAta,
            vault: vaultPda,
            userWrappedAccount: userWrappedAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            token2022Program: TOKEN_2022_PROGRAM_ID,
            // associatedTokenProgram will be auto-resolved usually
        } as any)
        .rpc();
    console.log("Wrapped 100 tokens!");

    // 6. Unwrap Tokens
    console.log("Unwrapping 50 tokens...");
    await program.methods
        .unwrap(new BN(50_000000))
        .accounts({
            user: wallet.publicKey,
            originalMint: testMint,
            wrapperConfig: configPda,
            wrapperStats: statsPda,
            wrappedMint: wrappedMintPda,
            userOriginalAccount: userAta,
            vault: vaultPda,
            userWrappedAccount: userWrappedAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            token2022Program: TOKEN_2022_PROGRAM_ID,
        } as any)
        .rpc();
    console.log("Unwrapped 50 tokens!");

    console.log("✅ E2E Verification Complete Success!");
}

import * as web3 from "@solana/web3.js";
main().catch(err => {
    console.error(err);
    process.exit(1);
});
