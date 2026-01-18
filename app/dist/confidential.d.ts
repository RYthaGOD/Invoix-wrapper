/**
 * Confidential Transfer Helpers
 *
 * NOTE: Full client-side confidential transfer operations (ElGamal encryption,
 * ZK proof generation) require a Rust/WASM hybrid approach. Pure TypeScript
 * implementation is not currently feasible due to the cryptographic complexity.
 *
 * Current Status:
 * - Wrap/Unwrap with PUBLIC balances: ✅ Fully working
 * - Confidential balance transfers: 🚧 Requires additional tooling
 *
 * For confidential operations, use:
 * 1. Solana CLI with spl-token-2022 extension
 * 2. A Rust client with spl-token-confidential-transfer-proof crate
 * 3. Future: JavaScript WASM libraries when available
 *
 * Resources:
 * - https://spl.solana.com/confidential-token/quickstart
 * - https://github.com/solana-labs/solana-program-library/tree/master/token/confidential-transfer
 */
export interface ElGamalKeypair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}
/**
 * Generate ElGamal keypair for confidential transfers
 *
 * @throws Error - Not yet implemented in pure TypeScript
 * @see Use Solana CLI: `spl-token configure-confidential-transfer-account`
 */
export declare const generateElGamalKeypair: () => ElGamalKeypair;
/**
 * Encrypt an amount for confidential transfer
 *
 * @throws Error - Not yet implemented in pure TypeScript
 */
export declare const encryptAmount: (amount: bigint, pubkey: Uint8Array) => Uint8Array;
/**
 * Decrypt a confidential balance
 *
 * @throws Error - Not yet implemented in pure TypeScript
 */
export declare const decryptBalance: (encrypted: Uint8Array, secretKey: Uint8Array) => bigint;
/**
 * Check if confidential transfer is supported
 * Returns false until WASM implementation is available
 */
export declare const isConfidentialTransferSupported: () => boolean;
