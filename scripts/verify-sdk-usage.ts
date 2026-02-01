
import {
    getWrapInstructionAsync
} from '../app/src/generated/instructions/wrap';
import {
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
    compileTransactionMessage,
    getBase64EncodedWireTransaction,
    address,
    pipe,
    generateKeyPairSigner,
    getSignatureFromTransaction
} from '@solana/kit';

async function main() {
    console.log("Verifying SDK imports and Type definitions...");

    try {
        const mockUser = await generateKeyPairSigner();
        const mockMint = address("So11111111111111111111111111111111111111112");
        const mockATA = address("So11111111111111111111111111111111111111112");

        console.log("Creating Instruction...");
        const ix = await getWrapInstructionAsync({
            user: mockUser,
            originalMint: mockMint,
            userOriginalAccount: mockATA,
            amount: 100n
        });

        console.log("Instruction created successfully.");

        console.log("Compiling Mock Transaction...");
        const message = pipe(
            createTransactionMessage({ version: 0 }),
            (m) => setTransactionMessageFeePayer(mockUser.address, m),
            (m) => setTransactionMessageLifetimeUsingBlockhash({ blockhash: '1'.repeat(32), lastValidBlockHeight: 0n }, m),
            (m) => appendTransactionMessageInstruction(ix, m)
        );

        const compiledMessage = compileTransactionMessage(message);

        console.log("Compiled Accounts:", compiledMessage.staticAccounts.map(a => a.toString()));
        console.log("Signer Count:", compiledMessage.header.numRequiredSignatures);

        // Construct Transaction object with placeholder signature for payer
        const transaction = {
            message: compiledMessage,
            signatures: {
                [mockUser.address]: new Uint8Array(64) as any
            }
        };

        console.log("Provided Signatures for:", Object.keys(transaction.signatures));

        const wireBytes = getBase64EncodedWireTransaction(transaction as any);

        console.log("Transaction Compiled. Wire length (base64 chars):", wireBytes.length);
        console.log("✅ SDK Verification Passed");

    } catch (e: any) {
        console.error("❌ SDK Verification Failed:", e);
        process.exit(1);
    }
}

main();
