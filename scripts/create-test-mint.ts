import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import {
    createInitializeMintInstruction,
    createMint,
    getMinimumBalanceForRentExemptMint,
    TOKEN_2022_PROGRAM_ID,
    MINT_SIZE,
    mintTo,
    createAccount,
    getAccount,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

const LOCALNET_URL = 'http://127.0.0.1:8899';

interface MintConfig {
    decimals: number;
    initialSupply?: number;
}

async function loadWallet(): Promise<Keypair> {
    const walletPath = path.join(process.env.HOME || '', '.config/solana/id.json');

    if (!fs.existsSync(walletPath)) {
        console.log('❌ Wallet not found at', walletPath);
        console.log('💡 Creating new keypair for testing...');
        return Keypair.generate();
    }

    const secretKey = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function airdropIfNeeded(connection: Connection, publicKey: PublicKey, minBalance: number = 2) {
    const balance = await connection.getBalance(publicKey);
    const minBalanceLamports = minBalance * 1e9;

    if (balance < minBalanceLamports) {
        console.log(`💰 Requesting airdrop of ${minBalance} SOL...`);
        const signature = await connection.requestAirdrop(publicKey, minBalanceLamports);
        await connection.confirmTransaction(signature);
        console.log('✅ Airdrop confirmed');
    } else {
        console.log(`✅ Sufficient balance: ${(balance / 1e9).toFixed(4)} SOL`);
    }
}

async function createTestMint(
    connection: Connection,
    payer: Keypair,
    config: MintConfig
): Promise<{ mint: PublicKey; tokenAccount: PublicKey }> {
    console.log('\n🏭 Creating test SPL token mint...');
    console.log(`   Decimals: ${config.decimals}`);

    // Create mint
    const mint = await createMint(
        connection,
        payer,
        payer.publicKey,
        payer.publicKey,
        config.decimals
    );

    console.log('✅ Mint created:', mint.toBase58());

    // Create token account
    const tokenAccount = await createAccount(
        connection,
        payer,
        mint,
        payer.publicKey
    );

    console.log('✅ Token account created:', tokenAccount.toBase58());

    // Mint initial supply if specified
    if (config.initialSupply && config.initialSupply > 0) {
        const amount = BigInt(config.initialSupply) * BigInt(10 ** config.decimals);
        await mintTo(
            connection,
            payer,
            mint,
            tokenAccount,
            payer,
            amount
        );

        const accountInfo = await getAccount(connection, tokenAccount);
        console.log(`✅ Minted ${config.initialSupply} tokens (${accountInfo.amount.toString()} lamports)`);
    }

    return { mint, tokenAccount };
}

async function displayMintInfo(connection: Connection, mint: PublicKey, tokenAccount: PublicKey) {
    console.log('\n📊 Mint Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Mint Address:    ${mint.toBase58()}`);
    console.log(`Token Account:   ${tokenAccount.toBase58()}`);

    const accountInfo = await getAccount(connection, tokenAccount);
    console.log(`Balance:         ${accountInfo.amount.toString()} lamports`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n💡 Usage:');
    console.log('   Use this mint address in the wrapper frontend or API');
    console.log('   Example:');
    console.log(`   export TEST_MINT=${mint.toBase58()}`);
    console.log(`   npx ts-node scripts/test-localnet.ts`);
}

async function main() {
    console.log('========================================');
    console.log('Create Test Mint (Localnet)');
    console.log('========================================\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const decimals = args[0] ? parseInt(args[0]) : 6;
    const initialSupply = args[1] ? parseInt(args[1]) : 1000;

    console.log('📦 Configuration:');
    console.log(`   RPC URL: ${LOCALNET_URL}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Initial Supply: ${initialSupply}`);

    // Connect to localnet
    const connection = new Connection(LOCALNET_URL, 'confirmed');

    // Load wallet
    console.log('\n🔑 Loading wallet...');
    const payer = await loadWallet();
    console.log('   Wallet:', payer.publicKey.toBase58());

    // Ensure sufficient balance
    await airdropIfNeeded(connection, payer.publicKey);

    // Create mint
    const { mint, tokenAccount } = await createTestMint(connection, payer, {
        decimals,
        initialSupply,
    });

    // Display info
    await displayMintInfo(connection, mint, tokenAccount);

    console.log('\n✅ Test mint created successfully!');
}

main().catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
});
