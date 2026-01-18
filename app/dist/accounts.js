"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGRAM_ID = void 0;
exports.fetchWrapperConfig = fetchWrapperConfig;
exports.fetchWrapperStats = fetchWrapperStats;
exports.getWrapperPdas = getWrapperPdas;
exports.wrapperExists = wrapperExists;
const web3_js_1 = require("@solana/web3.js");
const pdas_1 = require("./pdas");
// Program ID - deployed to devnet
exports.PROGRAM_ID = new web3_js_1.PublicKey("D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY");
/**
 * Fetch Wrapper Config for a given original mint
 */
async function fetchWrapperConfig(program, originalMint) {
    const [configPda] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
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
    }
    catch {
        return null;
    }
}
/**
 * Fetch Wrapper Stats for a given original mint
 */
async function fetchWrapperStats(program, originalMint) {
    const [statsPda] = (0, pdas_1.findWrapperStatsPda)(originalMint, program.programId);
    try {
        const account = await program.account.wrapperStats.fetch(statsPda);
        return {
            totalWrapped: BigInt(account.totalWrapped.toString()),
            totalUnwrapped: BigInt(account.totalUnwrapped.toString()),
            totalDeposited: BigInt(account.totalDeposited.toString()),
            totalFeesCollected: BigInt(account.totalFeesCollected.toString()),
            bump: account.bump,
        };
    }
    catch {
        return null;
    }
}
/**
 * Get all PDAs for a wrapper instance
 */
function getWrapperPdas(originalMint, programId = exports.PROGRAM_ID) {
    const [wrapperConfig, configBump] = (0, pdas_1.findWrapperConfigPda)(originalMint, programId);
    const [wrapperStats, statsBump] = (0, pdas_1.findWrapperStatsPda)(originalMint, programId);
    const [wrappedMint, mintBump] = (0, pdas_1.findWrappedMintPda)(originalMint, programId);
    const [vault, vaultBump] = (0, pdas_1.findVaultPda)(originalMint, programId);
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
async function wrapperExists(connection, originalMint, programId = exports.PROGRAM_ID) {
    const [configPda] = (0, pdas_1.findWrapperConfigPda)(originalMint, programId);
    const accountInfo = await connection.getAccountInfo(configPda);
    return accountInfo !== null;
}
