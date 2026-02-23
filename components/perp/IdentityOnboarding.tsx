'use client';

import React, { useState } from 'react';
import { useAccount, useSignTypedData } from '@starknet-react/core';
import { deriveTongoPrivateKey, DERIVATION_MESSAGE } from '@/lib/identity';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';

export function IdentityOnboarding({ onDerived }: { onDerived: (privKey: string) => void }) {
    const { address, status } = useAccount();
    const [isDeriving, setIsDeriving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sign a simple message to derive the key
    const { signTypedDataAsync } = useSignTypedData({});

    const handleUnlock = async () => {
        if (!address) return;

        setIsDeriving(true);
        setError(null);

        try {
            // In a real hackathon demo, we check if they have a key in localStorage first
            const stored = localStorage.getItem(`tongo_priv_${address}`);
            if (stored) {
                onDerived(stored);
                return;
            }

            // 1. Sign message to prove ownership and get deterministic entropy
            const message = {
                types: {
                    StarkNetDomain: [
                        { name: "name", type: "felt" },
                        { name: "version", type: "felt" },
                        { name: "chainId", type: "felt" },
                    ],
                    Message: [{ name: "contents", type: "string" }],
                },
                primaryType: "Message",
                domain: {
                    name: "Obolus Private identity",
                    version: "1",
                    chainId: "SN_SEPOLIA",
                },
                message: {
                    contents: DERIVATION_MESSAGE,
                },
            };

            const signature = await signTypedDataAsync(message);

            // 2. Derive the Tongo key
            const privKey = await deriveTongoPrivateKey(address, Array.isArray(signature) ? signature : [signature]);

            // 3. Store locally
            localStorage.setItem(`tongo_priv_${address}`, privKey);

            onDerived(privKey);
        } catch (e: any) {
            setError(e?.message || "User rejected signature");
        } finally {
            setIsDeriving(false);
        }
    };

    if (status !== 'connected') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-card rounded-2xl border border-border/50 text-center">
                <ShieldAlert className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
                <p className="text-muted-foreground max-w-xs">Connecting your Starknet wallet is required to derive your private Obolus identity.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12 bg-card/50 backdrop-blur-xl rounded-3xl border border-primary/20 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10"
            >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-primary/20">
                    <Shield className="w-10 h-10 text-primary" />
                </div>

                <h3 className="text-2xl font-bold mb-3 tracking-tight">Unlock Private Trading</h3>
                <p className="text-muted-foreground max-w-sm mb-8">
                    Sign a message to derive your **ElGamal encryption key**. This key stays on your device and enables sub-second sealed trades.
                </p>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleUnlock}
                    disabled={isDeriving}
                    className="w-full py-4 px-8 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
                >
                    {isDeriving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Deriving Protected Identity...
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5" />
                            Sign to Identity
                        </>
                    )}
                </button>

                <p className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
                    Secured by Starknet Native Cryptography
                </p>
            </motion.div>
        </div>
    );
}
