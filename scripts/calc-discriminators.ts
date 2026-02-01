import { sha256 } from "@noble/hashes/sha256";

function getDiscriminator(name: string): number[] {
    const hash = sha256(`global:${name}`);
    return Array.from(hash.slice(0, 8));
}

console.log("configure_confidential_account:", getDiscriminator("configure_confidential_account"));
console.log("apply_pending_balance:", getDiscriminator("apply_pending_balance"));
