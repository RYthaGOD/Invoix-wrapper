import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CSplWrapper } from "../target/types/c_spl_wrapper"; // This won't exist yet but it's correct for manual setup
import { 
    TOKEN_PROGRAM_ID, 
    TOKEN_2022_PROGRAM_ID, 
    createMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo, 
    getAccount,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { assert } from "chai";

describe("c-spl-wrapper", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CSplWrapper as Program<any>; // Cast to any as types aren't generated

  let originalMint: anchor.web3.PublicKey;
  let wrappedMint: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  
  const user = (provider.wallet as anchor.Wallet).payer;
  let userOriginalAccount: anchor.web3.PublicKey;
  let userWrappedAccount: anchor.web3.PublicKey;

  const decimals = 6;
  const wrapAmount = new anchor.BN(1_000_000); // 1.0
  const unwrapAmount = new anchor.BN(500_000); // 0.5

  it("Initialized environment", async () => {
    // 1. Create Original Mint (Standard SPL)
    originalMint = await createMint(
        provider.connection,
        user,
        user.publicKey,
        null,
        decimals,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
    );

    // 2. Mint tokens to User
    userOriginalAccount = (await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        originalMint,
        user.publicKey
    )).address;

    await mintTo(
        provider.connection,
        user,
        originalMint,
        userOriginalAccount,
        user.publicKey,
        2_000_000 // 2.0
    );

    console.log("Original Mint:", originalMint.toBase58());
  });

  it("Initializes the Wrapper", async () => {
    const [mintPda, mintBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), originalMint.toBuffer()],
        program.programId
    );
    wrappedMint = mintPda;

    await program.methods.initialize()
    .accounts({
        user: user.publicKey,
        originalMint: originalMint,
        wrappedMint: wrappedMint,
        systemProgram: anchor.web3.SystemProgram.programId,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

    // Verify Wrapped Mint Exists and is Token-2022
    const mintInfo = await getAccount(provider.connection, wrappedMint, undefined, TOKEN_2022_PROGRAM_ID);
    console.log("Wrapped Mint initialized:", wrappedMint.toBase58());
    assert.ok(mintInfo.isInitialized);
  });

  it("Wraps Tokens", async () => {
    // Derive Vault PDA
    const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), originalMint.toBuffer()],
        program.programId
    );
    vault = vaultPda;

    // Get/Create User Wrapped Check (ATA)
    // Note: ATAs for Token-2022 need the programId param
    userWrappedAccount = (await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        wrappedMint,
        user.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
    )).address;

    await program.methods.wrap(wrapAmount)
    .accounts({
        user: user.publicKey,
        originalMint: originalMint,
        wrappedMint: wrappedMint,
        userOriginalAccount: userOriginalAccount,
        vault: vault,
        userWrappedAccount: userWrappedAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .rpc();

    const userWrappedInfo = await getAccount(provider.connection, userWrappedAccount, undefined, TOKEN_2022_PROGRAM_ID);
    assert.equal(userWrappedInfo.amount.toString(), wrapAmount.toString(), "User received wrapped tokens");

    const vaultInfo = await getAccount(provider.connection, vault);
    assert.equal(vaultInfo.amount.toString(), wrapAmount.toString(), "Vault received original tokens");
  });

  it("Unwraps Tokens", async () => {
    await program.methods.unwrap(unwrapAmount)
    .accounts({
        user: user.publicKey,
        originalMint: originalMint,
        wrappedMint: wrappedMint,
        userOriginalAccount: userOriginalAccount,
        vault: vault,
        userWrappedAccount: userWrappedAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .rpc();

    const userWrappedInfo = await getAccount(provider.connection, userWrappedAccount, undefined, TOKEN_2022_PROGRAM_ID);
    // Started with 1_000_000, unwrapped 500_000 -> rem 500_000
    assert.equal(userWrappedInfo.amount.toString(), new anchor.BN(500_000).toString(), "User burned wrapped tokens");

    const vaultInfo = await getAccount(provider.connection, vault);
    // Started with 1_000_000, sent back 500_000 -> rem 500_000
    assert.equal(vaultInfo.amount.toString(), new anchor.BN(500_000).toString(), "Vault released original tokens");
  });
});
