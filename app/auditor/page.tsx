'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Lock, Unlock, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

export default function AuditorPage() {
    const [viewingKey, setViewingKey] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [decryptedData, setDecryptedData] = useState<any | null>(null);

    const handleAudit = async () => {
        if (!viewingKey) return;
        setIsVerifying(true);

        // Mocking the ZK-decryption delay
        setTimeout(() => {
            if (viewingKey.startsWith("obolus_vk_")) {
                setDecryptedData({
                    owner: "0x034ba...c469",
                    asset: "BTC-USD",
                    size: "4.52 BTC",
                    leverage: "25x",
                    entryPrice: "$64,210.50",
                    pnl: "+$12,450.80",
                    timestamp: "2024-03-23 10:42:15 UTC",
                    compliance: "CLEAN"
                });
            } else {
                setDecryptedData({ error: "Invalid Viewing Key or Malformed Ciphertext" });
            }
            setIsVerifying(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-foreground">
            <Header />

            <main className="container mx-auto px-4 pt-32 pb-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header Section */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-bold uppercase tracking-widest">
                            <Shield className="w-3 h-3" /> External Compliance Module
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight">Obolus Auditor Portal</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Paste a **Viewing Key** provided by a trader to verify their on-chain state without compromising their permanent privacy.
                        </p>
                    </div>

                    {/* Input Area */}
                    <div className="bg-card/30 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-2xl space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-extrabold tracking-tighter text-muted-foreground opacity-50">Secure Viewing Key</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={viewingKey}
                                    onChange={(e) => setViewingKey(e.target.value)}
                                    placeholder="obolus_vk_..."
                                    className="w-full bg-muted/20 border border-border/50 p-6 rounded-2xl font-mono text-sm outline-none focus:ring-2 ring-primary/20 transition-all pr-12"
                                />
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30" />
                            </div>
                        </div>

                        <button
                            onClick={handleAudit}
                            disabled={isVerifying || !viewingKey}
                            className="w-full py-5 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 rounded-2xl font-black text-lg transition-transform active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isVerifying ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                                    Verifying ZK-Signatures...
                                </>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    Run Compliance Audit
                                </>
                            )}
                        </button>
                    </div>

                    {/* Results Display */}
                    <AnimatePresence mode="wait">
                        {decryptedData && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-card/50 border border-border/50 rounded-3xl overflow-hidden shadow-2xl"
                            >
                                {decryptedData.error ? (
                                    <div className="p-12 text-center space-y-4">
                                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                                        <h3 className="text-2xl font-bold">Verification Failed</h3>
                                        <p className="text-muted-foreground">{decryptedData.error}</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/20">
                                        <div className="p-8 bg-black/40 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                                    <Unlock className="w-6 h-6 text-green-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold italic tracking-tighter">SECURELY REVEALED</h3>
                                                    <p className="text-xs text-muted-foreground">Trade ID: OB-8892-ZKP</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</div>
                                                <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-lg border border-green-500/20">
                                                    COMPLIANT
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-px bg-border/10">
                                            <AuditItem label="Owner Address" value={decryptedData.owner} />
                                            <AuditItem label="Asset Pairing" value={decryptedData.asset} />
                                            <AuditItem label="Position Size" value={decryptedData.size} />
                                            <AuditItem label="Leverage" value={decryptedData.leverage} />
                                            <AuditItem label="Entry Vector" value={decryptedData.entryPrice} />
                                            <AuditItem label="Settled PnL" value={decryptedData.pnl} color="text-green-500" />
                                        </div>

                                        <div className="p-6 bg-black/20 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                            This data was homomorphically decrypted using the provided ephemeral Viewing Key.
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function AuditItem({ label, value, color = "text-foreground" }: any) {
    return (
        <div className="p-8 bg-card/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</span>
            <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
        </div>
    );
}
