"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createThawAccountInstruction = exports.createFreezeAccountInstruction = exports.createWithdrawFeesInstruction = exports.createSetAuthorityInstruction = exports.createSetFeesInstruction = exports.createUnpauseInstruction = exports.createPauseInstruction = exports.createUnwrapInstruction = exports.createWrapInstruction = exports.createInitializeInstruction = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const pdas_1 = require("./pdas");
const createInitializeInstruction = async (program, payer, originalMint, wrapFeeBps, unwrapFeeBps, auditor = null) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    const [wrapperStats] = (0, pdas_1.findWrapperStatsPda)(originalMint, program.programId);
    const [wrappedMint] = (0, pdas_1.findWrappedMintPda)(originalMint, program.programId);
    const [vault] = (0, pdas_1.findVaultPda)(originalMint, program.programId);
    return await program.methods
        .initialize(wrapFeeBps, unwrapFeeBps, auditor)
        .accounts({
        user: payer,
        originalMint,
        wrapperConfig,
        wrapperStats,
        wrappedMint,
        vault,
        systemProgram: web3_js_1.SystemProgram.programId,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        token2022Program: spl_token_1.TOKEN_2022_PROGRAM_ID,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
    })
        .instruction();
};
exports.createInitializeInstruction = createInitializeInstruction;
const createWrapInstruction = async (program, payer, originalMint, userOriginalAccount, userWrappedAccount, amount) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    const [wrapperStats] = (0, pdas_1.findWrapperStatsPda)(originalMint, program.programId);
    const [wrappedMint] = (0, pdas_1.findWrappedMintPda)(originalMint, program.programId);
    const [vault] = (0, pdas_1.findVaultPda)(originalMint, program.programId);
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
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        token2022Program: spl_token_1.TOKEN_2022_PROGRAM_ID,
        systemProgram: web3_js_1.SystemProgram.programId,
        associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
    })
        .instruction();
};
exports.createWrapInstruction = createWrapInstruction;
const createUnwrapInstruction = async (program, payer, originalMint, userOriginalAccount, userWrappedAccount, amount) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    const [wrapperStats] = (0, pdas_1.findWrapperStatsPda)(originalMint, program.programId);
    const [wrappedMint] = (0, pdas_1.findWrappedMintPda)(originalMint, program.programId);
    const [vault] = (0, pdas_1.findVaultPda)(originalMint, program.programId);
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
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        token2022Program: spl_token_1.TOKEN_2022_PROGRAM_ID,
        systemProgram: web3_js_1.SystemProgram.programId,
        associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
    })
        .instruction();
};
exports.createUnwrapInstruction = createUnwrapInstruction;
// Admin Instructions
const createPauseInstruction = async (program, authority, originalMint) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    return await program.methods
        .pause()
        .accounts({
        wrapperConfig,
        authority,
    })
        .instruction();
};
exports.createPauseInstruction = createPauseInstruction;
const createUnpauseInstruction = async (program, authority, originalMint) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    return await program.methods
        .unpause()
        .accounts({
        wrapperConfig,
        authority,
    })
        .instruction();
};
exports.createUnpauseInstruction = createUnpauseInstruction;
const createSetFeesInstruction = async (program, authority, originalMint, wrapFeeBps, unwrapFeeBps) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    return await program.methods
        .setFees(wrapFeeBps, unwrapFeeBps)
        .accounts({
        wrapperConfig,
        authority,
    })
        .instruction();
};
exports.createSetFeesInstruction = createSetFeesInstruction;
const createSetAuthorityInstruction = async (program, authority, originalMint, newAuthority) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    return await program.methods
        .setAuthority(newAuthority)
        .accounts({
        wrapperConfig,
        authority,
    })
        .instruction();
};
exports.createSetAuthorityInstruction = createSetAuthorityInstruction;
const createWithdrawFeesInstruction = async (program, authority, originalMint, authorityTokenAccount) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    const [wrapperStats] = (0, pdas_1.findWrapperStatsPda)(originalMint, program.programId);
    const [vault] = (0, pdas_1.findVaultPda)(originalMint, program.programId);
    return await program.methods
        .withdrawFees()
        .accounts({
        originalMint,
        wrapperConfig,
        wrapperStats,
        vault,
        authority,
        authorityTokenAccount,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
    })
        .instruction();
};
exports.createWithdrawFeesInstruction = createWithdrawFeesInstruction;
const createFreezeAccountInstruction = async (program, authority, originalMint, targetAccount) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    const [wrappedMint] = (0, pdas_1.findWrappedMintPda)(originalMint, program.programId);
    return await program.methods
        .freezeAccount()
        .accounts({
        originalMint,
        wrapperConfig,
        wrappedMint,
        targetAccount,
        authority,
        token2022Program: spl_token_1.TOKEN_2022_PROGRAM_ID,
    })
        .instruction();
};
exports.createFreezeAccountInstruction = createFreezeAccountInstruction;
const createThawAccountInstruction = async (program, authority, originalMint, targetAccount) => {
    const [wrapperConfig] = (0, pdas_1.findWrapperConfigPda)(originalMint, program.programId);
    const [wrappedMint] = (0, pdas_1.findWrappedMintPda)(originalMint, program.programId);
    return await program.methods
        .thawAccount()
        .accounts({
        originalMint,
        wrapperConfig,
        wrappedMint,
        targetAccount,
        authority,
        token2022Program: spl_token_1.TOKEN_2022_PROGRAM_ID,
    })
        .instruction();
};
exports.createThawAccountInstruction = createThawAccountInstruction;
