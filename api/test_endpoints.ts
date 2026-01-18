
import { PublicKey, Keypair } from "@solana/web3.js";

const BASE_URL = "http://localhost:3001/v1";

async function testWrap() {
    console.log("Testing POST /wrap ...");

    const payer = Keypair.generate().publicKey.toBase58();
    const originalMint = "So11111111111111111111111111111111111111112"; // Wrapped SOL
    const amount = 1000000;

    try {
        const response = await fetch(`${BASE_URL}/wrap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                payer,
                originalMint,
                amount
            })
        });

        const data = await response.json();

        if (response.ok && data.transaction) {
            console.log("✅ Wrap Success: Got transaction string.");
            // console.log("Tx:", data.transaction.substring(0, 50) + "...");
        } else {
            console.error("❌ Wrap Failed:", data);
        }

    } catch (err) {
        console.error("❌ Wrap Network/Server Error:", err);
    }
}

async function testUnwrap() {
    console.log("Testing POST /unwrap ...");

    const payer = Keypair.generate().publicKey.toBase58();
    const originalMint = "So11111111111111111111111111111111111111112";
    const amount = 500000;

    try {
        const response = await fetch(`${BASE_URL}/unwrap`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                payer,
                originalMint,
                amount
            })
        });

        const data = await response.json();

        if (response.ok && data.transaction) {
            console.log("✅ Unwrap Success: Got transaction string.");
            // console.log("Tx:", data.transaction.substring(0, 50) + "...");
        } else {
            console.error("❌ Unwrap Failed:", data);
        }

    } catch (err) {
        console.error("❌ Unwrap Network/Server Error:", err);
    }
}

async function main() {
    await testWrap();
    await testUnwrap();
}

main();
