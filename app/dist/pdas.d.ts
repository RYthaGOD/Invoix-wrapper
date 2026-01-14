import { PublicKey } from "@solana/web3.js";
/**
 * Derives the Wrapper Config PDA
 * Seeds: ["config", originalMint]
 */
export declare function findWrapperConfigPda(originalMint: PublicKey, programId: PublicKey): [PublicKey, number];
/**
 * Derives the Wrapper Stats PDA
 * Seeds: ["stats", originalMint]
 */
export declare function findWrapperStatsPda(originalMint: PublicKey, programId: PublicKey): [PublicKey, number];
/**
 * Derives the Vault PDA (stores original tokens)
 * Seeds: ["vault", originalMint]
 */
export declare function findVaultPda(originalMint: PublicKey, programId: PublicKey): [PublicKey, number];
/**
 * Derives the Wrapped Mint PDA
 * Seeds: ["mint", originalMint]
 */
export declare function findWrappedMintPda(originalMint: PublicKey, programId: PublicKey): [PublicKey, number];
