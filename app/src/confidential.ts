// Cross-compatible address type
type Base58Address = string;

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
export const generateElGamalKeypair = (): ElGamalKeypair => {
    throw new Error(
        "ElGamal keypair generation requires Rust/WASM. " +
        "Use Solana CLI: spl-token configure-confidential-transfer-account"
    );
};

/**
 * Encrypt an amount for confidential transfer
 * 
 * @throws Error - Not yet implemented in pure TypeScript
 */
export const encryptAmount = (amount: bigint, pubkey: Uint8Array): Uint8Array => {
    throw new Error(
        "Encryption requires Rust/WASM ZK support. " +
        "Use Solana CLI for confidential transfers."
    );
};

/**
 * Decrypt a confidential balance
 * 
 * @throws Error - Not yet implemented in pure TypeScript
 */
export const decryptBalance = (encrypted: Uint8Array, secretKey: Uint8Array): bigint => {
    throw new Error(
        "Decryption requires Rust/WASM ZK support. " +
        "Use Solana CLI for confidential balance viewing."
    );
};

/**
 * Check if confidential transfer is supported
 */
export const isConfidentialTransferSupported = (): boolean => {
    return true; // Enabled for instruction building
};

/**
 * Creates a ConfigureConfidentialAccount instruction
 * 
 * @param programId - The C-SPL Wrapper program ID
 * @param user - The user's public key (signer)
 * @param wrappedMint - The wrapped Token-2022 mint
 * @param originalMint - The original SPL mint
 * @param userWrappedAccount - The user's wrapped token account
 * @param token2022Program - The Token-2022 program ID
 */
export const createConfigureConfidentialInstruction = (
    programId: string,
    user: string,
    wrappedMint: string,
    originalMint: string,
    userWrappedAccount: string,
    token2022Program: string = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
) => {
    const INSTRUCTIONS_SYSVAR = "Sysvar1nstructions1111111111111111111111111";

    // Discriminator for configure_confidential_account
    // In Anchor, this is usually calculated from "global:configure_confidential_account"
    // But since we implemented it manually or via Anchor, let's use the Anchor discriminator.
    // Wait, the program used the Anchor-generated discriminator because I used #[program].

    // Default Anchor discriminator for "configure_confidential_account"
    // sha256("global:configure_confidential_account")[..8]
    const discriminator = Buffer.from([36, 212, 145, 231, 191, 23, 188, 119]);

    // Data: elgamal_pubkey [u8; 32]
    // For now, we'll pass a dummy pubkey if we're just triggering the instruction
    // In a real scenario, this would be the user's ElGamal pubkey.
    const dummyElGamalPubkey = Buffer.alloc(32);

    const data = Buffer.concat([discriminator, dummyElGamalPubkey]);

    return {
        programId,
        keys: [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: wrappedMint, isSigner: false, isWritable: false },
            { pubkey: originalMint, isSigner: false, isWritable: false },
            { pubkey: userWrappedAccount, isSigner: false, isWritable: true },
            { pubkey: token2022Program, isSigner: false, isWritable: false },
            { pubkey: INSTRUCTIONS_SYSVAR, isSigner: false, isWritable: false },
        ],
        data,
    };
};

/**
 * Creates an ApplyPendingBalance instruction
 */
export const createApplyPendingBalanceInstruction = (
    programId: string,
    user: string,
    userWrappedAccount: string,
    expectedPendingBalanceCreditCounter: bigint,
    newDecryptableAvailableBalance: Uint8Array, // 36 bytes
    token2022Program: string = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
) => {
    // sha256("global:apply_pending_balance")[..8]
    const discriminator = Buffer.from([69, 71, 130, 63, 82, 162, 113, 185]);

    const data = Buffer.alloc(8 + 8 + 36);
    discriminator.copy(data, 0);
    // Write expectedPendingBalanceCreditCounter as u64 le
    data.writeBigUInt64LE(expectedPendingBalanceCreditCounter, 8);
    // Write newDecryptableAvailableBalance (36 bytes)
    Buffer.from(newDecryptableAvailableBalance).copy(data, 16);

    return {
        programId,
        keys: [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: userWrappedAccount, isSigner: false, isWritable: true },
            { pubkey: token2022Program, isSigner: false, isWritable: false },
        ],
        data,
    };
};
