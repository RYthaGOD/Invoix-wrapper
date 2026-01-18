import { useState, useCallback, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor'
import {
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getMint,
    getAccount
} from '@solana/spl-token'
import idl from '../c_spl_wrapper.json'

// Program ID - deployed on devnet
const PROGRAM_ID = new PublicKey('D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY')

// Token-2022 constants
const TOKEN_2022_PID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')

function WrapForm() {
    const { connection } = useConnection()
    const { publicKey, signTransaction } = useWallet()

    const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap'>('wrap')
    const [amount, setAmount] = useState('')
    const [mintAddress, setMintAddress] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string; txSignature?: string } | null>(null)

    // Mint info state
    const [decimals, setDecimals] = useState<number | null>(null)
    const [userBalance, setUserBalance] = useState<number | null>(null)

    // Fetch mint info and user balance
    useEffect(() => {
        if (!mintAddress || !publicKey) return

        // Simple validation before fetching
        try {
            new PublicKey(mintAddress)
        } catch {
            return
        }

        const fetchInfo = async () => {
            try {
                const mintPubkey = new PublicKey(mintAddress)
                const mintInfo = await getMint(connection, mintPubkey, "confirmed", TOKEN_PROGRAM_ID)
                setDecimals(mintInfo.decimals)

                // Get user ATA
                const ata = await getAssociatedTokenAddress(mintPubkey, publicKey)
                try {
                    const account = await getAccount(connection, ata, "confirmed", TOKEN_PROGRAM_ID)
                    setUserBalance(Number(account.amount) / Math.pow(10, mintInfo.decimals))
                } catch (e) {
                    setUserBalance(0) // ATA doesn't exist
                }

            } catch (err) {
                // Try Token-2022 if standard fails
                try {
                    const mintPubkey = new PublicKey(mintAddress)
                    const mintInfo = await getMint(connection, mintPubkey, "confirmed", TOKEN_2022_PID)
                    setDecimals(mintInfo.decimals)

                    // For unwrap, we might be checking the wrapped token which is Token-2022
                    // Logic needs to be specific to what we are wrapping/unwrapping
                } catch {
                    setDecimals(null)
                }
            }
        }

        fetchInfo()
    }, [mintAddress, publicKey, connection])


    const handleAction = useCallback(async () => {
        if (!publicKey || !signTransaction) {
            setStatus({ type: 'error', message: 'Please connect your wallet first' })
            return
        }

        if (!amount || parseFloat(amount) <= 0) {
            setStatus({ type: 'error', message: 'Please enter a valid amount' })
            return
        }

        if (!mintAddress) {
            setStatus({ type: 'error', message: 'Please enter the original mint address' })
            return
        }

        // Network Check (Simple heuristic)
        if (connection.rpcEndpoint.includes("mainnet")) {
            // Ideally checking genesis hash is better, but this is a simple guard
            if (!window.confirm("You appear to be on Mainnet. This program is deployed on Devnet. Proceed anyway?")) {
                return;
            }
        }

        setLoading(true)
        setStatus({ type: 'info', message: `Preparing to ${activeTab}...` })

        try {
            const provider = new AnchorProvider(connection, {
                publicKey,
                signTransaction,
                signAllTransactions: async (txs) => txs,
            }, { commitment: 'confirmed' })

            const program = new Program(idl as Idl, provider)

            const originalMint = new PublicKey(mintAddress)

            // Dynamic Decimals
            let mintDecimals = decimals;
            if (mintDecimals === null) {
                // Fallback fetch
                const mintInfo = await getMint(connection, originalMint, "confirmed", TOKEN_PROGRAM_ID);
                mintDecimals = mintInfo.decimals;
            }

            const amountBN = new BN(parseFloat(amount) * Math.pow(10, mintDecimals))

            // Derive PDAs
            const [wrapperConfig] = PublicKey.findProgramAddressSync(
                [Buffer.from('config'), originalMint.toBuffer()],
                PROGRAM_ID
            )
            const [wrapperStats] = PublicKey.findProgramAddressSync(
                [Buffer.from('stats'), originalMint.toBuffer()],
                PROGRAM_ID
            )
            const [wrappedMint] = PublicKey.findProgramAddressSync(
                [Buffer.from('mint'), originalMint.toBuffer()],
                PROGRAM_ID
            )
            const [vault] = PublicKey.findProgramAddressSync(
                [Buffer.from('vault'), originalMint.toBuffer()],
                PROGRAM_ID
            )

            // Get token accounts
            const userOriginalAccount = await getAssociatedTokenAddress(
                originalMint,
                publicKey
            )

            const userWrappedAccount = await getAssociatedTokenAddress(
                wrappedMint,
                publicKey,
                false,
                TOKEN_2022_PROGRAM_ID
            )

            let txSignature: string;

            if (activeTab === 'wrap') {
                setStatus({ type: 'info', message: 'Sending Wrap transaction...' })

                // Check balance
                if (userBalance !== null && parseFloat(amount) > userBalance) {
                    throw new Error(`Insufficient balance. You have ${userBalance} tokens.`);
                }

                // Call wrap instruction
                txSignature = await program.methods
                    .wrap(amountBN)
                    .accounts({
                        user: publicKey,
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
                    .rpc()

            } else {
                setStatus({ type: 'info', message: 'Sending Unwrap transaction...' })

                // Call unwrap instruction
                txSignature = await program.methods
                    .unwrap(amountBN)
                    .accounts({
                        user: publicKey,
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
                    .rpc()
            }

            // console.log('Transaction signature', txSignature)

            setStatus({
                type: 'success',
                message: `Successfully ${activeTab === 'wrap' ? 'wrapped' : 'unwrapped'} tokens!`,
                txSignature
            })

            // Refund balance update after short delay
            setTimeout(() => {
                // Re-trigger balance fetch logic (could be improved with robust state mgmt)
                setMintAddress(prev => prev)
            }, 2000)

        } catch (err: any) {
            console.error(err)
            const cleanMsg = err.message?.replace("AnchorError occurred. Error Code: ", "") || 'Transaction failed'
            setStatus({ type: 'error', message: cleanMsg })
        } finally {
            setLoading(false)
        }
    }, [publicKey, signTransaction, connection, amount, mintAddress, activeTab, decimals, userBalance])

    if (!publicKey) {
        return (
            <div className="card">
                <div className="card-title">🔗 Connect Wallet</div>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                    Please connect your wallet to wrap or unwrap tokens
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="card">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'wrap' ? 'active' : ''}`}
                        onClick={() => setActiveTab('wrap')}
                    >
                        📦 Wrap
                    </button>
                    <button
                        className={`tab ${activeTab === 'unwrap' ? 'active' : ''}`}
                        onClick={() => setActiveTab('unwrap')}
                    >
                        📤 Unwrap
                    </button>
                </div>

                <div className="form-group">
                    <label>Original Token Mint Address</label>
                    <input
                        type="text"
                        placeholder="Enter mint address..."
                        value={mintAddress}
                        onChange={(e) => setMintAddress(e.target.value)}
                    />
                    {decimals !== null && (
                        <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                            Decimals: {decimals}
                        </small>
                    )}
                </div>

                <div className="form-group">
                    <label>Amount</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0"
                            step="any"
                            style={{ flex: 1 }}
                        />
                        {userBalance !== null && activeTab === 'wrap' && (
                            <button
                                className="btn btn-secondary"
                                style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => setAmount(userBalance.toString())}
                            >
                                Max: {userBalance.toLocaleString()}
                            </button>
                        )}
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleAction}
                    disabled={loading || !amount || !mintAddress}
                >
                    {loading ? 'Processing...' : activeTab === 'wrap' ? '📦 Wrap Tokens' : '📤 Unwrap Tokens'}
                </button>

                {status && (
                    <div
                        className={`status ${status.type === 'success' ? 'status-success' : status.type === 'error' ? '' : 'status-warning'}`}
                        style={{
                            marginTop: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            background: status.type === 'error' ? 'rgba(248, 113, 113, 0.1)' : undefined,
                            color: status.type === 'error' ? 'var(--error)' : undefined
                        }}
                    >
                        <span>{status.message}</span>
                        {status.txSignature && (
                            <a
                                href={`https://explorer.solana.com/tx/${status.txSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'inherit', opacity: 0.8 }}
                            >
                                View Transaction ↗
                            </a>
                        )}
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-title">📊 Program Info</div>
                <div className="info-row">
                    <span className="info-label">Program ID</span>
                    <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {PROGRAM_ID.toBase58().slice(0, 8)}...{PROGRAM_ID.toBase58().slice(-8)}
                    </span>
                </div>
                <div className="info-row">
                    <span className="info-label">Network</span>
                    <span className="info-value">Devnet</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Status</span>
                    <span className="status status-success">● Live</span>
                </div>
            </div>
        </>
    )
}

export default WrapForm
