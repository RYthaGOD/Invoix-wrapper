
import { createSolanaRpc, Rpc } from '@solana/kit';
import { createContext, useContext, ReactNode, useMemo } from 'react';

const SolanaContext = createContext<Rpc<any> | null>(null);

interface SolanaProviderProps {
    children: ReactNode;
    endpoint: string;
}

export function SolanaProvider({ children, endpoint }: SolanaProviderProps) {
    const rpc = useMemo(() => createSolanaRpc(endpoint), [endpoint]);

    return (
        <SolanaContext.Provider value={rpc}>
            {children}
        </SolanaContext.Provider>
    );
}

export function useSolanaRpc() {
    const context = useContext(SolanaContext);
    if (!context) {
        throw new Error("useSolanaRpc must be used within a SolanaProvider");
    }
    return context;
}
