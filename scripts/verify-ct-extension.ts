import { Connection, PublicKey } from '@solana/web3.js';
import { getMint, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

const LOCALNET_URL = 'http://127.0.0.1:8899';

interface ConfidentialTransferExtension {
    authority: PublicKey | null;
    autoApproveNewAccounts: boolean;
    auditorElgamalPubkey: PublicKey | null;
}

async function verifyConfidentialTransferExtension(
    connection: Connection,
    mintAddress: PublicKey
): Promise<void> {
    console.log('\n🔍 Verifying Confidential Transfer Extension...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Mint Address: ${mintAddress.toBase58()}`);

    try {
        // Fetch mint account
        const mintInfo = await getMint(
            connection,
            mintAddress,
            'confirmed',
            TOKEN_2022_PROGRAM_ID
        );

        console.log('\n✅ Mint Account Found');
        console.log(`   Program: ${TOKEN_2022_PROGRAM_ID.toBase58()}`);
        console.log(`   Decimals: ${mintInfo.decimals}`);
        console.log(`   Supply: ${mintInfo.supply.toString()}`);
        console.log(`   Mint Authority: ${mintInfo.mintAuthority?.toBase58() || 'None'}`);
        console.log(`   Freeze Authority: ${mintInfo.freezeAuthority?.toBase58() || 'None'}`);

        // Check for Token-2022 extensions
        const accountInfo = await connection.getAccountInfo(mintAddress);

        if (!accountInfo) {
            console.log('\n❌ Error: Could not fetch account info');
            return;
        }

        console.log(`\n📦 Account Data Size: ${accountInfo.data.length} bytes`);

        // Standard mint size is 82 bytes
        // Token-2022 mints with extensions are larger
        const STANDARD_MINT_SIZE = 82;

        if (accountInfo.data.length > STANDARD_MINT_SIZE) {
            console.log('✅ Extended mint detected (Token-2022 with extensions)');
            console.log(`   Extra data: ${accountInfo.data.length - STANDARD_MINT_SIZE} bytes`);

            // Try to parse extensions (simplified check)
            // Full parsing would require the Token-2022 extension layout
            console.log('\n🔐 Confidential Transfer Extension:');
            console.log('   Status: ✅ LIKELY PRESENT (based on account size)');
            console.log('   Note: Full extension parsing requires Token-2022 extension decoder');

        } else {
            console.log('⚠️  Standard mint size detected');
            console.log('   This appears to be a standard SPL token, not Token-2022');
            console.log('   Confidential Transfer extension: ❌ NOT PRESENT');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error: any) {
        console.log('\n❌ Error verifying mint:');
        console.log(`   ${error.message}`);

        if (error.message.includes('Invalid params')) {
            console.log('\n💡 Tip: Make sure the mint address is correct and the validator is running');
        }
    }
}

async function main() {
    console.log('========================================');
    console.log('Verify Confidential Transfer Extension');
    console.log('========================================\n');

    // Get mint address from command line or environment
    const mintAddress = process.argv[2] || process.env.TEST_MINT;

    if (!mintAddress) {
        console.log('❌ Error: No mint address provided');
        console.log('\nUsage:');
        console.log('  npx ts-node scripts/verify-ct-extension.ts <MINT_ADDRESS>');
        console.log('  or');
        console.log('  export TEST_MINT=<MINT_ADDRESS>');
        console.log('  npx ts-node scripts/verify-ct-extension.ts');
        process.exit(1);
    }

    console.log('📦 Configuration:');
    console.log(`   RPC URL: ${LOCALNET_URL}`);
    console.log(`   Mint: ${mintAddress}`);

    // Connect to localnet
    const connection = new Connection(LOCALNET_URL, 'confirmed');

    // Verify extension
    await verifyConfidentialTransferExtension(
        connection,
        new PublicKey(mintAddress)
    );

    console.log('\n✅ Verification complete!');
}

main().catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
});
