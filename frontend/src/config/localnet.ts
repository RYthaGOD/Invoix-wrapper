import { PublicKey } from '@solana/web3.js';

export interface NetworkConfig {
    rpcUrl: string;
    wsUrl: string;
    programId: PublicKey;
    network: 'localnet' | 'devnet' | 'mainnet-beta';
}

export const LOCALNET_CONFIG: NetworkConfig = {
    rpcUrl: 'http://127.0.0.1:8899',
    wsUrl: 'ws://127.0.0.1:8900',
    programId: new PublicKey('D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY'),
    network: 'localnet',
};

export const DEVNET_CONFIG: NetworkConfig = {
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com',
    programId: new PublicKey('D3FaNQVD8NZC6CFT1AS8Rq2G26iAGZ19CgLJXNMfGAjY'),
    network: 'devnet',
};

export function getNetworkConfig(): NetworkConfig {
    const network = import.meta.env.VITE_NETWORK || 'devnet';

    switch (network) {
        case 'localnet':
            return LOCALNET_CONFIG;
        case 'devnet':
            return DEVNET_CONFIG;
        default:
            console.warn(`Unknown network: ${network}, defaulting to devnet`);
            return DEVNET_CONFIG;
    }
}

export function isLocalnet(): boolean {
    return import.meta.env.VITE_NETWORK === 'localnet';
}
