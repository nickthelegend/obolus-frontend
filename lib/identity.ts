import { hash } from "starknet";

/**
 * Derives a deterministic Tongo private key (felt252) from a Starknet signature.
 * This allows the user to have a stable private identity without managing extra keys.
 */
export async function deriveTongoPrivateKey(starknetAddress: string, signature: string[]): Promise<string> {
    // Combine address and signature components
    const combined = signature.join("") + starknetAddress;

    // Hash the combination using Poseidon (Starknet-native hash)
    const derivedHash = hash.computePoseidonHashOnElements([
        BigInt(starknetAddress),
        ...signature.map(s => BigInt(s))
    ]);

    return derivedHash;
}

/**
 * Hook-ready function to prompt user for a signature to "Unlock Private Trading"
 */
export const DERIVATION_MESSAGE = "Unlock Obolus Identity";
