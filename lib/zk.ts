/**
 * Tongo SDK Integration & ZK Payload Generator
 */

import { getTongoSdk } from './tongo';
import { buildPoseidon } from 'circomlibjs';
// Dynamic import for snarkjs to avoid SSR issues
const snarkjs = typeof window !== 'undefined' ? (window as any).snarkjs || require('snarkjs') : null;

// The types of data a user might encrypt
export async function encryptOrderData(
    tongoPrivateKey: string,
    amount: number | bigint
) {
    const mod = await getTongoSdk();
    const { derivePublicKey, starkPointToProjectivePoint, createCipherBalance, projectivePointToStarkPoint } = mod;

    const privKeyBigInt = BigInt(tongoPrivateKey);
    const pubKey = derivePublicKey(privKeyBigInt);
    const pubKeyProj = starkPointToProjectivePoint(pubKey);

    // Generate a secure random scalar for the ElGamal encryption random factor
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    let randomHex = '0x';
    for (let i = 0; i < array.length; i++) {
        randomHex += array[i].toString(16).padStart(2, '0');
    }
    // Approximate curve order modulo
    const randomBigInt = BigInt(randomHex) % BigInt("3618502788666131213697322783095070105623107215331596699973092056135872020481");

    const amountBigInt = BigInt(Math.floor(Number(amount)));
    const cipher = createCipherBalance(pubKeyProj, amountBigInt, randomBigInt);

    const L = projectivePointToStarkPoint(cipher.L);
    const R = projectivePointToStarkPoint(cipher.R);

    return {
        ct_L: '0x' + L.x.toString(16),
        ct_R: '0x' + R.x.toString(16)
    };
}

/**
 * Generate a Zero Knowledge Proof that the specified trade logic is valid
 * using the ZKPay shielded pool circom architecture.
 */
export async function generateTradeProof(
    secretString: string,
    amount: string | number,
    recipient: string
) {
    if (!snarkjs) {
        console.warn("snarkjs not loaded, skipping actual ZK proof generation.");
        return null;
    }

    try {
        console.log("Generating Zero-Knowledge Proof...");

        const poseidon = await buildPoseidon();
        const F = poseidon.F;

        // Compute Circom/Iden3 Poseidon Hashes over BN254
        const secretBN = BigInt(secretString || "0");
        const amountBN = BigInt(amount.toString());

        // Poseidon(secret, amount, 0, 0, 0)
        const commitment = F.toString(poseidon([secretBN, amountBN, 0n, 0n, 0n]));
        // Poseidon(secret, commitment)
        const nullifier = F.toString(poseidon([secretBN, BigInt(commitment)]));

        // Format inputs precisely to match circom expectations
        const inputs = {
            secret: secretBN.toString(),
            amount: amountBN.toString(),
            recipient: BigInt(recipient).toString(),
            commitment: commitment,
            nullifier: nullifier,
            callbackTarget: "0",
            callbackSelector: "0",
            callbackArgsHash: "0"
        };

        console.time("ZK-Prover");
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            inputs,
            "/zk/shielded_pool.wasm",
            "/zk/shielded_pool.zkey"
        );
        console.timeEnd("ZK-Prover");

        console.log("Fetching remote Garaga hints...");
        const vkUrl = typeof window !== 'undefined' ? `${window.location.origin}/zk/verification_key.json` : '';
        const vkRes = await fetch(vkUrl);
        const vk = await vkRes.json();

        const garagaRes = await fetch("http://127.0.0.1:8000/generate_calldata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                proof,
                public_inputs: publicSignals,
                vk
            })
        });

        const garagaData = await garagaRes.json();

        if (garagaData.error) {
            console.error("Garaga server error:", garagaData.error);
            throw new Error(`Garaga error: ${garagaData.error}`);
        }

        if (!garagaData.calldata || !Array.isArray(garagaData.calldata)) {
            console.error("Invalid calldata from Garaga:", garagaData);
            throw new Error("Invalid calldata received from Garaga server");
        }

        // Format for Garaga / Cairo Verification
        return {
            proof,
            publicSignals,
            commitment,
            nullifier,
            calldata: garagaData.calldata
        };

    } catch (e) {
        console.error("Failed to generate ZK Proof:", e);
        throw e;
    }
}

/**
 * Create a dummy proof payload for use with the Mock Verifier.
 * This satisfies the contract's amount and recipient checks if a real ZK proof isn't needed.
 */
export function generateMockProof(amount: bigint | string | number, recipient: string, commitment: string = "0", nullifier: string = "0"): string[] {
    const amountBN = BigInt(amount);
    const recipientBN = BigInt(recipient);
    const commitmentBN = BigInt(commitment);
    const nullifierBN = BigInt(nullifier);

    const mask128 = (1n << 128n) - 1n;

    return [
        '0x' + (amountBN & mask128).toString(16),
        '0x' + (amountBN >> 128n).toString(16),
        '0x' + (recipientBN & mask128).toString(16),
        '0x' + (recipientBN >> 128n).toString(16),
        '0x' + (commitmentBN & mask128).toString(16),
        '0x' + (commitmentBN >> 128n).toString(16),
        '0x' + (nullifierBN & mask128).toString(16),
        '0x' + (nullifierBN >> 128n).toString(16)
    ];
}


