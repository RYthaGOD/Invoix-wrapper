
import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// API Endpoint
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

export default function WrapForm() {
    const { publicKey, sendTransaction } = useWallet()
    const { connection } = useConnection() // Keep legacy connection for sendTransaction
    // const rpc = useSolanaRpc() // Modern RPC for reads
    const queryClient = useQueryClient()

    const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap'>('wrap')
    const [amount, setAmount] = useState('')
    const [mintAddress, setMintAddress] = useState('')
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string; txSignature?: string } | null>(null)
    const [privacyEnabled, setPrivacyEnabled] = useState(false)
    const [isConfiguringPrivacy, setIsConfiguringPrivacy] = useState(false)

    // Query: Fetch Mint Info & Balance
    const { data: mintData } = useQuery({
        queryKey: ['mint', mintAddress, publicKey?.toBase58()],
        queryFn: async () => {
            if (!mintAddress) return null;
            // Here we could use the SDK to fetch mint info precisely
            // For now, using RPC directly to get basic info
            // Modern RPC usage:
            // const mintPubkey = address(mintAddress);
            // ... parsing logic would go here. 
            // To save time and complexity in this refactor step, we'll assume standard SPL layout or use a helper.
            // But since we want "No Mistakes", let's use the legacy connection for strict ABI decoding if we don't have a parser ready.
            // implementation_plan said "Replace useEffect data fetching with useQuery".

            // Let's use legacy connection for read just to be safe on decoding for now, 
            // but invoked via useQuery.
            // TODO: Migrate to modern parsers from @solana/kit
            const { getMint, getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token');
            const { PublicKey } = await import('@solana/web3.js');

            const mintPk = new PublicKey(mintAddress);
            const mintInfo = await getMint(connection, mintPk);

            let balance = 0;
            if (publicKey) {
                const ata = await getAssociatedTokenAddress(mintPk, publicKey);
                try {
                    const account = await getAccount(connection, ata);
                    balance = Number(account.amount);
                } catch { }
            }

            return { decimals: mintInfo.decimals, balance: balance / Math.pow(10, mintInfo.decimals) };
        },
        enabled: !!mintAddress && !!publicKey,
        retry: false
    });

    // Mutation: Wrap/Unwrap
    const mutation = useMutation({
        mutationFn: async () => {
            setStatus({ type: 'info', message: `Preparing to ${activeTab}...` });

            const endpoint = activeTab === 'wrap' ? '/wrap' : '/unwrap';
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payer: publicKey?.toBase58(),
                    originalMint: mintAddress,
                    amount: Math.floor(parseFloat(amount) * Math.pow(10, mintData?.decimals || 0)).toString(),
                    // userOriginalAccount derived by API
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'API Request Failed');
            }

            const { transaction } = await res.json();

            // transaction is base64 encoded wire bytes
            const txBytes = Uint8Array.from(atob(transaction), c => c.charCodeAt(0));
            const tx = VersionedTransaction.deserialize(txBytes);

            setStatus({ type: 'info', message: 'Please sign in your wallet...' });

            const signature = await sendTransaction(tx, connection);
            await connection.confirmTransaction(signature, 'confirmed');

            return signature;
        },
        onSuccess: (signature) => {
            setStatus({
                type: 'success',
                message: `Successfully ${activeTab === 'wrap' ? 'wrapped' : 'unwrapped'} tokens!`,
                txSignature: signature
            });
            queryClient.invalidateQueries({ queryKey: ['mint'] });
            setAmount('');
        },
        onError: (error: any) => {
            console.error(error);
            setStatus({ type: 'error', message: error.message });
        }
    });

    return (
        <div className="card">
            <div className="tabs">
                <button className={`tab ${activeTab === 'wrap' ? 'active' : ''}`} onClick={() => setActiveTab('wrap')}>📦 Wrap</button>
                <button className={`tab ${activeTab === 'unwrap' ? 'active' : ''}`} onClick={() => setActiveTab('unwrap')}>📤 Unwrap</button>
            </div>

            {/* Form Inputs */}
            <div className="form-group">
                <label>Original Token Mint Address</label>
                <input
                    type="text"
                    placeholder="Enter mint address..."
                    value={mintAddress}
                    onChange={(e) => setMintAddress(e.target.value)}
                />
                {mintData && <small>Decimals: {mintData.decimals}</small>}
            </div>

            <div className="form-group">
                <label>Amount</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                {mintData && (
                    <button onClick={() => setAmount(mintData.balance.toString())}>
                        Max: {mintData.balance}
                    </button>
                )}
            </div>

            {/* Privacy Mode Toggle */}
            <div className="form-group privacy-toggle">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={privacyEnabled}
                        onChange={(e) => setPrivacyEnabled(e.target.checked)}
                    />
                    <span className="font-semibold">Privacy Mode (Confidential Transfer)</span>
                </label>
                {privacyEnabled && (
                    <div className="privacy-info mt-2 text-sm p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <p>🛡️ Confidential Transfer enabled. Your balances will be encrypted on-chain.</p>
                        <button
                            className="btn btn-secondary btn-sm mt-2"
                            onClick={async () => {
                                try {
                                    setIsConfiguringPrivacy(true);
                                    setStatus({ type: 'info', message: 'Configuring confidential account...' });

                                    const res = await fetch(`${API_URL}/configure-confidential`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            payer: publicKey?.toBase58(),
                                            originalMint: mintAddress,
                                        })
                                    });

                                    if (!res.ok) throw new Error('Failed to configure privacy');

                                    const { transaction } = await res.json();
                                    const txBytes = Uint8Array.from(atob(transaction), c => c.charCodeAt(0));
                                    const tx = VersionedTransaction.deserialize(txBytes);

                                    const signature = await sendTransaction(tx, connection);
                                    await connection.confirmTransaction(signature, 'confirmed');

                                    setStatus({ type: 'success', message: 'Confidential account configured!', txSignature: signature });
                                } catch (err: any) {
                                    setStatus({ type: 'error', message: err.message });
                                } finally {
                                    setIsConfiguringPrivacy(false);
                                }
                            }}
                            disabled={isConfiguringPrivacy || !publicKey || !mintAddress}
                        >
                            {isConfiguringPrivacy ? 'Configuring...' : 'Initialize Privacy Account'}
                        </button>
                    </div>
                )}
            </div>

            <button
                className="btn btn-primary"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !publicKey || !amount}
            >
                {mutation.isPending ? 'Processing...' : activeTab === 'wrap' ? 'Wrap' : 'Unwrap'}
            </button>

            {/* Status Display */}
            {status && (
                <div className={`status status-${status.type}`}>
                    {status.message}
                    {status.txSignature && (
                        <a href={`https://explorer.solana.com/tx/${status.txSignature}?cluster=devnet`} target="_blank" rel="noreferrer">View TX</a>
                    )}
                </div>
            )}
        </div>
    );
}
