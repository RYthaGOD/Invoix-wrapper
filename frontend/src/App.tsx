
import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import WrapForm from './components/WrapForm'
import { SolanaProvider } from './providers/SolanaProvider'
import '@solana/wallet-adapter-react-ui/styles.css'

function App() {
    const endpoint = useMemo(() => clusterApiUrl('devnet'), [])

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    )

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <SolanaProvider endpoint={endpoint}>
                        <div className="app">
                            <header className="header">
                                <h1>c-SPL Token Wrapper</h1>
                                <p>Wrap SPL tokens to Token-2022 Confidential Transfer tokens</p>
                            </header>

                            <div className="wallet-section">
                                <WalletMultiButton />
                            </div>

                            <WrapForm />

                            <div className="card">
                                <div className="card-title">ℹ️ About</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                                    This wrapper converts standard SPL tokens into Token-2022 tokens with
                                    Confidential Transfer extension enabled. Your wrapped tokens can participate
                                    in privacy-preserving transfers on Solana.
                                </p>
                                <div style={{ marginTop: '1rem' }}>
                                    <a
                                        href="https://explorer.solana.com/address/D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY?cluster=devnet"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link"
                                    >
                                        View Program on Solana Explorer →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </SolanaProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    )
}

export default App
