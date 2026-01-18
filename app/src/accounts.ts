import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { findWrapperConfigPda, findWrapperStatsPda, findWrappedMintPda, findVaultPda } from "./pdas";
import { CSplWrapper } from "./types";

// Program ID - deployed to devnet
export const PROGRAM_ID = new PublicKey("D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY");

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
export async function fetchWrapperConfig(
    program: Program<CSplWrapper>,
    originalMint: PublicKey
): Promise<WrapperConfigData | null> {
    const [configPda] = findWrapperConfigPda(originalMint, program.programId);

    try {
        const account = await program.account.wrapperConfig.fetch(configPda);
        return {
            authority: account.authority,
            originalMint: account.originalMint,
            wrappedMint: account.wrappedMint,
            vault: account.vault,
            auditor: account.auditor,
            wrapFeeBps: account.wrapFeeBps,
            unwrapFeeBps: account.unwrapFeeBps,
            isPaused: account.isPaused,
            bump: account.bump,
        };
    } catch {
        return null;
    }
}

/**
 * Fetch Wrapper Stats for a given original mint
 */
export async function fetchWrapperStats(
    program: Program<CSplWrapper>,
    originalMint: PublicKey
): Promise<WrapperStatsData | null> {
    const [statsPda] = findWrapperStatsPda(originalMint, program.programId);

    try {
        const account = await program.account.wrapperStats.fetch(statsPda);
        return {
            totalWrapped: BigInt(account.totalWrapped.toString()),
            totalUnwrapped: BigInt(account.totalUnwrapped.toString()),
            totalDeposited: BigInt(account.totalDeposited.toString()),
            totalFeesCollected: BigInt(account.totalFeesCollected.toString()),
            bump: account.bump,
        };
    } catch {
        return null;
    }
}

/**
 * Get all PDAs for a wrapper instance
 */
export function getWrapperPdas(originalMint: PublicKey, programId: PublicKey = PROGRAM_ID) {
    const [wrapperConfig, configBump] = findWrapperConfigPda(originalMint, programId);
    const [wrapperStats, statsBump] = findWrapperStatsPda(originalMint, programId);
    const [wrappedMint, mintBump] = findWrappedMintPda(originalMint, programId);
    const [vault, vaultBump] = findVaultPda(originalMint, programId);

    return {
        wrapperConfig,
        wrapperStats,
        wrappedMint,
        vault,
        bumps: { configBump, statsBump, mintBump, vaultBump }
    };
}

/**
 * Check if a wrapper exists for a given mint
 */
export async function wrapperExists(
    connection: Connection,
    originalMint: PublicKey,
    programId: PublicKey = PROGRAM_ID
): Promise<boolean> {
    const [configPda] = findWrapperConfigPda(originalMint, programId);
    const accountInfo = await connection.getAccountInfo(configPda);
    return accountInfo !== null;
}
