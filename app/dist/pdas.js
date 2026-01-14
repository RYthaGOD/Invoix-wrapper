"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findWrapperConfigPda = findWrapperConfigPda;
exports.findWrapperStatsPda = findWrapperStatsPda;
exports.findVaultPda = findVaultPda;
exports.findWrappedMintPda = findWrappedMintPda;
const web3_js_1 = require("@solana/web3.js");
/**
 * Derives the Wrapper Config PDA
 * Seeds: ["config", originalMint]
 */
function findWrapperConfigPda(originalMint, programId) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("config"), originalMint.toBuffer()], programId);
}
/**
 * Derives the Wrapper Stats PDA
 * Seeds: ["stats", originalMint]
 */
function findWrapperStatsPda(originalMint, programId) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("stats"), originalMint.toBuffer()], programId);
}
/**
 * Derives the Vault PDA (stores original tokens)
 * Seeds: ["vault", originalMint]
 */
function findVaultPda(originalMint, programId) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("vault"), originalMint.toBuffer()], programId);
}
/**
 * Derives the Wrapped Mint PDA
 * Seeds: ["mint", originalMint]
 */
function findWrappedMintPda(originalMint, programId) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("mint"), originalMint.toBuffer()], programId);
}
