import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { findWrapperConfigPda, findWrapperStatsPda, findWrappedMintPda, findVaultPda } from "./pdas";

export const createInitializeInstruction = async (
    program: any,
    payer: PublicKey,
    originalMint: PublicKey,
    wrapFeeBps: number,
    unwrapFeeBps: number,
    auditor: PublicKey | null = null
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);
    const [wrapperStats] = findWrapperStatsPda(originalMint, program.programId);
    const [wrappedMint] = findWrappedMintPda(originalMint, program.programId);
    const [vault] = findVaultPda(originalMint, program.programId);

    return await program.methods
        .initialize(wrapFeeBps, unwrapFeeBps, auditor)
        .accounts({
            user: payer,
            originalMint,
            wrapperConfig,
            wrapperStats,
            wrappedMint,
            vault,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            token2022Program: TOKEN_2022_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction();
};

export const createWrapInstruction = async (
    program: any,
    payer: PublicKey,
    originalMint: PublicKey,
    userOriginalAccount: PublicKey,
    userWrappedAccount: PublicKey,
    amount: BN
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);
    const [wrapperStats] = findWrapperStatsPda(originalMint, program.programId);
    const [wrappedMint] = findWrappedMintPda(originalMint, program.programId);
    const [vault] = findVaultPda(originalMint, program.programId);

    return await program.methods
        .wrap(amount)
        .accounts({
            user: payer,
            originalMint,
            wrapperConfig,
            wrapperStats,
            wrappedMint,
            userOriginalAccount,
            vault,
            userWrappedAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            token2022Program: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();
};

export const createUnwrapInstruction = async (
    program: any,
    payer: PublicKey,
    originalMint: PublicKey,
    userOriginalAccount: PublicKey,
    userWrappedAccount: PublicKey,
    amount: BN
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);
    const [wrapperStats] = findWrapperStatsPda(originalMint, program.programId);
    const [wrappedMint] = findWrappedMintPda(originalMint, program.programId);
    const [vault] = findVaultPda(originalMint, program.programId);

    return await program.methods
        .unwrap(amount)
        .accounts({
            user: payer,
            originalMint,
            wrapperConfig,
            wrapperStats,
            wrappedMint,
            userOriginalAccount,
            vault,
            userWrappedAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            token2022Program: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();
};

// Admin Instructions

export const createPauseInstruction = async (
    program: any,
    authority: PublicKey,
    originalMint: PublicKey
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);

    return await program.methods
        .pause()
        .accounts({
            wrapperConfig,
            authority,
        })
        .instruction();
};

export const createUnpauseInstruction = async (
    program: any,
    authority: PublicKey,
    originalMint: PublicKey
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);

    return await program.methods
        .unpause()
        .accounts({
            wrapperConfig,
            authority,
        })
        .instruction();
};

export const createSetFeesInstruction = async (
    program: any,
    authority: PublicKey,
    originalMint: PublicKey,
    wrapFeeBps: number,
    unwrapFeeBps: number
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);

    return await program.methods
        .setFees(wrapFeeBps, unwrapFeeBps)
        .accounts({
            wrapperConfig,
            authority,
        })
        .instruction();
};

export const createSetAuthorityInstruction = async (
    program: any,
    authority: PublicKey,
    originalMint: PublicKey,
    newAuthority: PublicKey
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);

    return await program.methods
        .setAuthority(newAuthority)
        .accounts({
            wrapperConfig,
            authority,
        })
        .instruction();
};

export const createWithdrawFeesInstruction = async (
    program: any,
    authority: PublicKey,
    originalMint: PublicKey,
    authorityTokenAccount: PublicKey
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);
    const [wrapperStats] = findWrapperStatsPda(originalMint, program.programId);
    const [vault] = findVaultPda(originalMint, program.programId);

    return await program.methods
        .withdrawFees()
        .accounts({
            originalMint,
            wrapperConfig,
            wrapperStats,
            vault,
            authority,
            authorityTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
};

export const createFreezeAccountInstruction = async (
    program: any,
    authority: PublicKey,
    originalMint: PublicKey,
    targetAccount: PublicKey
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);
    const [wrappedMint] = findWrappedMintPda(originalMint, program.programId);

    return await program.methods
        .freezeAccount()
        .accounts({
            originalMint,
            wrapperConfig,
            wrappedMint,
            targetAccount,
            authority,
            token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();
};

export const createThawAccountInstruction = async (
    program: any,
    authority: PublicKey,
    originalMint: PublicKey,
    targetAccount: PublicKey
): Promise<TransactionInstruction> => {
    const [wrapperConfig] = findWrapperConfigPda(originalMint, program.programId);
    const [wrappedMint] = findWrappedMintPda(originalMint, program.programId);

    return await program.methods
        .thawAccount()
        .accounts({
            originalMint,
            wrapperConfig,
            wrappedMint,
            targetAccount,
            authority,
            token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .instruction();
};
