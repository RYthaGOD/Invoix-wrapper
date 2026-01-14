export interface ElGamalKeypair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}
export declare const generateElGamalKeypair: () => ElGamalKeypair;
export declare const encryptAmount: (amount: bigint, pubkey: Uint8Array) => Uint8Array;
export declare const decryptBalance: (encrypted: Uint8Array, secretKey: Uint8Array) => bigint;
