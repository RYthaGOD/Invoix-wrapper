import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, mintTo, createAccount, getAccount } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import { Program, AnchorProvider, Wallet, BN } from '@project-serum/anchor';

const LOCALNET_URL = 'http://127.0.0.1:8899';
const PROGRAM_ID = new PublicKey('D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY');

async function loadWallet(): Promise<Keypair> {
    const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json');

    if (!fs.existsSync(walletPath)) {
        console.log('⚠️  Wallet not found, generating new keypair...');
        return Keypair.generate();
    }

    const secretKey = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function airdropIfNeeded(connection: Connection, publicKey: PublicKey) {
    const balance = await connection.getBalance(publicKey);
    if (balance < 2e9) {
        console.log('💰 Requesting airdrop...');
        const sig = await connection.requestAirdrop(publicKey, 2e9);
        await connection.confirmTransaction(sig);
        console.log('✅ Airdrop confirmed');
    }
}

async function main() {
    console.log('========================================');
    console.log('c-SPL Wrapper - Localnet E2E Test');
    console.log('========================================\n');

    const connection = new Connection(LOCALNET_URL, 'confirmed');
    const payer = await loadWallet();

    console.log('📦 Configuration:');
    console.log(`   RPC: ${LOCALNET_URL}`);
    console.log(`   Wallet: ${payer.publicKey.toBase58()}`);
    console.log(`   Program: ${PROGRAM_ID.toBase58()}`);
    console.log('');

    await airdropIfNeeded(connection, payer.publicKey);

    // Step 1: Create test mint
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 1: Creating Test SPL Token Mint');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        payer.publicKey,
        6
    );
    console.log(`✅ Mint created: ${mint.toBase58()}`);

    const tokenAccount = await createAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    );
    console.log(`✅ Token account: ${tokenAccount.toBase58()}`);

    const mintAmount = 1000 * 1e6; // 1000 tokens
    await mintTo(
        connection,
        payer,
        mint,
        tokenAccount,
        payer,
        mintAmount
    );
    console.log(`✅ Minted 1000 tokens`);

    // Step 2: Initialize wrapper
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 2: Initializing Wrapper');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('⚠️  Note: Initialize instruction requires SDK integration');
    console.log('   This would call the wrapper program\'s initialize instruction');
    console.log('   Creating wrapper config, stats, wrapped mint, and vault PDAs');

    // Step 3: Wrap tokens
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 3: Wrapping Tokens');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('⚠️  Note: Wrap instruction requires SDK integration');
    console.log('   This would:');
    console.log('   1. Transfer SPL tokens to vault');
    console.log('   2. Mint c-SPL tokens (Token-2022 with CT extension)');
    console.log('   3. Update wrapper stats');

    // Step 4: Verify CT extension
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 4: Verifying Confidential Transfer Extension');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('💡 Run: npx ts-node scripts/verify-ct-extension.ts <WRAPPED_MINT>');

    // Step 5: Unwrap tokens
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 5: Unwrapping Tokens');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('⚠️  Note: Unwrap instruction requires SDK integration');
    console.log('   This would:');
    console.log('   1. Burn c-SPL tokens');
    console.log('   2. Transfer SPL tokens from vault back to user');
    console.log('   3. Deduct unwrap fees');
    console.log('   4. Update wrapper stats');

    // Summary
    console.log('\n========================================');
    console.log('✅ Test Setup Complete!');
    console.log('========================================\n');

    console.log('📊 Test Mint Details:');
    console.log(`   Mint: ${mint.toBase58()}`);
    console.log(`   Token Account: ${tokenAccount.toBase58()}`);
    console.log(`   Balance: 1000 tokens`);
    console.log('');

    console.log('🔧 Next Steps:');
    console.log('   1. Integrate wrapper SDK for initialize/wrap/unwrap');
    console.log('   2. Test via frontend: cd frontend && npm run dev');
    console.log('   3. Test via API: cd api && npx ts-node src/index.ts');
    console.log('   4. Record demo videos');
    console.log('');

    console.log('💾 Save this mint for testing:');
    console.log(`   export TEST_MINT=${mint.toBase58()}`);
    console.log('');
}

main().catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
});
