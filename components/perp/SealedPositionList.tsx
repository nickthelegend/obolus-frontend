'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldOff, Eye, EyeOff, TrendingUp, TrendingDown, Clock, Lock } from 'lucide-react';
import { getEncryptedBalance } from '@/lib/tongo';
import type { TokenSymbol } from '@/lib/encryption-constants';

interface Position {
    id: string;
    asset: string;
    size_ct: string; // Ciphertext
    entry_ct: string; // Ciphertext
    pnl_ct: string;   // Ciphertext
    isLong: boolean;
    timestamp: number;
}

export function SealedPositionList({ tongoPrivKey }: { tongoPrivKey: string | null }) {
    const [revealed, setRevealed] = useState(false);
    const [positions, setPositions] = useState<Position[]>([
        {
            id: "1",
            asset: "ETH-USD",
            size_ct: "0x7a...f2",
            entry_ct: "0x3b...e9",
            pnl_ct: "0x1d...a4",
            isLong: true,
            timestamp: Date.now() - 3600000
        },
        {
            id: "2",
            asset: "STRK-USD",
            size_ct: "0x9c...a1",
            entry_ct: "0x2e...d4",
            pnl_ct: "0x8b...f7",
            isLong: false,
            timestamp: Date.now() - 1800000
        }
    ]);

    // Mock Decryption logic for the demo
    // In a real app, this would use tongo.decrypt(position.size_ct, tongoPrivKey)
    const getRevealedValue = (val: string, type: 'size' | 'entry' | 'pnl') => {
        if (!revealed) return "••••••••";
        if (type === 'size') return "1.25 ETH";
        if (type === 'entry') return "$1,865.40";
        if (type === 'pnl') return "+$42.10 (3.2%)";
        return val;
    };

    return (
        <div className="w-full bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Sealed Positions</h3>
                        <p className="text-xs text-muted-foreground">Only you can see these values</p>
                    </div>
                </div>

                <button
                    onClick={() => setRevealed(!revealed)}
                    disabled={!tongoPrivKey}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {revealed ? "Seal Data" : "Reveal Data"}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                            <th className="px-6 py-4 font-semibold">Asset</th>
                            <th className="px-6 py-4 font-semibold">Side</th>
                            <th className="px-6 py-4 font-semibold">Size (Sealed)</th>
                            <th className="px-6 py-4 font-semibold">Entry (Sealed)</th>
                            <th className="px-6 py-4 font-semibold">Real-time PnL</th>
                            <th className="px-6 py-4 font-semibold text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {positions.map((pos) => (
                            <tr key={pos.id} className="hover:bg-muted/10 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="font-bold">{pos.asset}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {pos.isLong ? (
                                        <span className="flex items-center gap-1 text-green-500 font-medium">
                                            <TrendingUp className="w-4 h-4" /> Long
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-500 font-medium">
                                            <TrendingDown className="w-4 h-4" /> Short
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-mono text-sm">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={revealed ? 'revealed' : 'sealed'}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className={revealed ? "text-foreground" : "text-muted-foreground/30"}
                                        >
                                            {getRevealedValue(pos.size_ct, 'size')}
                                        </motion.span>
                                    </AnimatePresence>
                                </td>
                                <td className="px-6 py-4 font-mono text-sm">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={revealed ? 'revealed' : 'sealed'}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className={revealed ? "text-foreground" : "text-muted-foreground/30"}
                                        >
                                            {getRevealedValue(pos.entry_ct, 'entry')}
                                        </motion.span>
                                    </AnimatePresence>
                                </td>
                                <td className="px-6 py-4">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={revealed ? 'revealed' : 'sealed'}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className={revealed ? "text-green-500 font-bold" : "text-muted-foreground/30 font-mono text-sm"}
                                        >
                                            {getRevealedValue(pos.pnl_ct, 'pnl')}
                                        </motion.span>
                                    </AnimatePresence>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                        <Lock className="w-3 h-3" />
                                        Sealed
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
