'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import { Header } from '@/components/ui/Header';
import { IdentityOnboarding } from '@/components/perp/IdentityOnboarding';
import { SealedPositionList } from '@/components/perp/SealedPositionList';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, TrendingUp, Zap, BarChart3, Wallet, Activity } from 'lucide-react';
import { getToken } from '@/lib/encryption-constants';

import { useStore } from '@/lib/store';

export default function PerpPage() {
    const { address, status } = useAccount();
    const { tongoPrivKey, setTongoPrivKey } = useStore();
    const [isGeneratingProof, setIsGeneratingProof] = useState(false);

    // Initial check for stored key
    useEffect(() => {
        if (address && !tongoPrivKey) {
            const stored = localStorage.getItem(`tongo_priv_${address}`);
            if (stored) setTongoPrivKey(stored);
        }
    }, [address, tongoPrivKey, setTongoPrivKey]);

    const handleTrade = async (side: "long" | "short") => {
        setIsGeneratingProof(true);
        // Simulate ZK-Proof generation delay (Real Tongo SDK logic would go here)
        setTimeout(() => {
            setIsGeneratingProof(false);
            alert(`${side.toUpperCase()} Position Sealed & Submitted to Starknet!`);
        }, 8000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30">
            <Header />

            {/* ZK-Proof Overlay */}
            <AnimatePresence>
                {isGeneratingProof && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="w-24 h-24 mb-8 relative">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                            <Shield className="absolute inset-0 m-auto w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter mb-4">COMPUTING ZK-PROOF</h2>
                        <p className="text-muted-foreground max-w-sm">
                            Generative ElGamal ciphertext with recursive SNARK verification.
                            <br /><span className="text-primary font-mono text-xs mt-2 block">Privacy is being manufactured...</span>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="container mx-auto px-4 pt-24 pb-12">
                <AnimatePresence mode="wait">
                    {!tongoPrivKey ? (
                        <motion.div
                            key="onboarding"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-center min-h-[60vh]"
                        >
                            <IdentityOnboarding onDerived={setTongoPrivKey} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                            {/* Dashboard Header Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard label="Account Balance" value="••••••••" icon={<Wallet className="w-4 h-4" />} isSealed={true} />
                                <StatCard label="Total Exposure" value="••••••••" icon={<TrendingUp className="w-4 h-4" />} isSealed={true} />
                                <StatCard label="Margin Ratio" value="Protected" icon={<Activity className="w-4 h-4" />} color="text-green-500" />
                                <StatCard label="Network Health" value="Sub-second" icon={<Zap className="w-4 h-4" />} color="text-primary" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Trading Controls */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-card/40 border border-border/50 rounded-2xl p-6 backdrop-blur-sm">
                                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-primary" />
                                            Open Position
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2 block">Select Asset</label>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {["ETH", "USDC", "STRK", "WBTC", "LORDS"].map(t => (
                                                        <button key={t} className="py-2 px-1 bg-muted/30 hover:bg-primary/20 rounded-lg text-xs font-bold border border-border/50 transition-colors uppercase">
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2 block">Size</label>
                                                <div className="relative">
                                                    <input type="text" placeholder="0.00" className="w-full bg-muted/20 border border-border/50 p-4 rounded-xl text-lg font-mono outline-none focus:border-primary/50 transition-colors" />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">ETH</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2 block">Leverage: 10x</label>
                                                <input type="range" className="w-full accent-primary" min="1" max="50" defaultValue="10" />
                                            </div>

                                            <div className="pt-4 space-y-3">
                                                <button
                                                    onClick={() => handleTrade("long")}
                                                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-green-500/20"
                                                >
                                                    Long ETH
                                                </button>
                                                <button
                                                    onClick={() => handleTrade("short")}
                                                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-red-500/20"
                                                >
                                                    Short ETH
                                                </button>
                                            </div>

                                            <p className="text-[10px] text-center text-muted-foreground italic">
                                                By clicking, you will generate an ElGamal ZK-Proof off-chain (~8s).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Chart & Positions */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="h-96 bg-card/20 border border-border/50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50" />
                                        <p className="text-muted-foreground font-mono uppercase tracking-[0.2em] animate-pulse">
                                            [ Pyth Real-time Chart stream ]
                                        </p>
                                    </div>

                                    <SealedPositionList tongoPrivKey={tongoPrivKey} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function StatCard({ label, value, icon, isSealed = false, color = "text-foreground" }: any) {
    return (
        <div className="bg-card/30 border border-border/40 p-5 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {icon}
                <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
            </div>
            <div className={`text-xl font-bold font-mono ${color} flex items-center gap-2`}>
                {value}
                {isSealed && <Shield className="w-3 h-3 text-primary/50" />}
            </div>
        </div>
    );
}
