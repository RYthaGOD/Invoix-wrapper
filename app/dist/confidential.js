"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConfidentialTransferSupported = exports.decryptBalance = exports.encryptAmount = exports.generateElGamalKeypair = void 0;
/**
 * Generate ElGamal keypair for confidential transfers
 *
 * @throws Error - Not yet implemented in pure TypeScript
 * @see Use Solana CLI: `spl-token configure-confidential-transfer-account`
 */
const generateElGamalKeypair = () => {
    throw new Error("ElGamal keypair generation requires Rust/WASM. " +
        "Use Solana CLI: spl-token configure-confidential-transfer-account");
};
exports.generateElGamalKeypair = generateElGamalKeypair;
/**
 * Encrypt an amount for confidential transfer
 *
 * @throws Error - Not yet implemented in pure TypeScript
 */
const encryptAmount = (amount, pubkey) => {
    throw new Error("Encryption requires Rust/WASM ZK support. " +
        "Use Solana CLI for confidential transfers.");
};
exports.encryptAmount = encryptAmount;
/**
 * Decrypt a confidential balance
 *
 * @throws Error - Not yet implemented in pure TypeScript
 */
const decryptBalance = (encrypted, secretKey) => {
    throw new Error("Decryption requires Rust/WASM ZK support. " +
        "Use Solana CLI for confidential balance viewing.");
};
exports.decryptBalance = decryptBalance;
/**
 * Check if confidential transfer is supported
 * Returns false until WASM implementation is available
 */
const isConfidentialTransferSupported = () => {
    return false;
};
exports.isConfidentialTransferSupported = isConfidentialTransferSupported;
