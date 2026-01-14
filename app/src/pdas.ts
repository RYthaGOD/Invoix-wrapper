import { PublicKey } from "@solana/web3.js";

/**
 * Derives the Wrapper Config PDA
 * Seeds: ["config", originalMint]
 */
export function findWrapperConfigPda(
    originalMint: PublicKey,
    programId: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("config"), originalMint.toBuffer()],
        programId
    );
}

/**
 * Derives the Wrapper Stats PDA
 * Seeds: ["stats", originalMint]
 */
export function findWrapperStatsPda(
    originalMint: PublicKey,
    programId: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("stats"), originalMint.toBuffer()],
        programId
    );
}

/**
 * Derives the Vault PDA (stores original tokens)
 * Seeds: ["vault", originalMint]
 */
export function findVaultPda(
    originalMint: PublicKey,
    programId: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), originalMint.toBuffer()],
        programId
    );
}

/**
 * Derives the Wrapped Mint PDA
 * Seeds: ["mint", originalMint]
 */
export function findWrappedMintPda(
    originalMint: PublicKey,
    programId: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), originalMint.toBuffer()],
        programId
    );
}
