import { Connection, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { CSplWrapper } from "./types";
export declare const PROGRAM_ID: PublicKey;
/**
 * Wrapper Config account data
 */
export interface WrapperConfigData {
    authority: PublicKey;
    originalMint: PublicKey;
    wrappedMint: PublicKey;
    vault: PublicKey;
    auditor: PublicKey | null;
    wrapFeeBps: number;
    unwrapFeeBps: number;
    isPaused: boolean;
    bump: number;
}
/**
 * Wrapper Stats account data
 */
export interface WrapperStatsData {
    totalWrapped: bigint;
    totalUnwrapped: bigint;
    totalDeposited: bigint;
    totalFeesCollected: bigint;
    bump: number;
}
/**
 * Fetch Wrapper Config for a given original mint
 */
export declare function fetchWrapperConfig(program: Program<CSplWrapper>, originalMint: PublicKey): Promise<WrapperConfigData | null>;
/**
 * Fetch Wrapper Stats for a given original mint
 */
export declare function fetchWrapperStats(program: Program<CSplWrapper>, originalMint: PublicKey): Promise<WrapperStatsData | null>;
/**
 * Get all PDAs for a wrapper instance
 */
export declare function getWrapperPdas(originalMint: PublicKey, programId?: PublicKey): {
    wrapperConfig: PublicKey;
    wrapperStats: PublicKey;
    wrappedMint: PublicKey;
    vault: PublicKey;
    bumps: {
        configBump: number;
        statsBump: number;
        mintBump: number;
        vaultBump: number;
    };
};
/**
 * Check if a wrapper exists for a given mint
 */
export declare function wrapperExists(connection: Connection, originalMint: PublicKey, programId?: PublicKey): Promise<boolean>;
