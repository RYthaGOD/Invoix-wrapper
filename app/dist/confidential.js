"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptBalance = exports.encryptAmount = exports.generateElGamalKeypair = void 0;
const generateElGamalKeypair = () => {
    throw new Error("ElGamal Keypair generation requires ZK support lib");
};
exports.generateElGamalKeypair = generateElGamalKeypair;
const encryptAmount = (amount, pubkey) => {
    throw new Error("Encryption requires ZK support lib");
};
exports.encryptAmount = encryptAmount;
const decryptBalance = (encrypted, secretKey) => {
    throw new Error("Decryption requires ZK support lib");
};
exports.decryptBalance = decryptBalance;
