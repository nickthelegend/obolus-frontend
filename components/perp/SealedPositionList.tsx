import React from 'react';
import { Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useStore } from '@/lib/store';

export function SealedPositionList({ tongoPrivKey }: { tongoPrivKey: string | null }) {
    const activeBets = useStore(state => state.activeBets);
    const currentPrice = useStore(state => state.currentPrice);

    if (!tongoPrivKey) return null;

    if (activeBets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-white/5 border border-white/5 rounded-lg h-full">
                <Shield className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium tracking-widest uppercase">No Active Positions</p>
                <p className="text-xs opacity-50 mt-1">Place an order to see it here</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {activeBets.map((bet, i) => {
                const isLong = bet.direction === 'UP';
                const entryPrice = bet.strikePrice || 0;

                // Calculate real-time arbitrary PnL based on current price
                const priceDiff = currentPrice - entryPrice;
                const pnlPercentage = entryPrice ? (priceDiff / entryPrice) * bet.multiplier : 0;
                let rawPnl = bet.amount * pnlPercentage;
                if (!isLong) rawPnl = -rawPnl; // Reverse if short

                const isProfit = rawPnl >= 0;
                const pnlString = `${isProfit ? '+' : '-'}$${Math.abs(rawPnl).toFixed(2)}`;

                return (
                    <div key={bet.id || i} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLong ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {isLong ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm tracking-tight">{bet.asset}-USD</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-stark-purple/20 text-stark-purple flex items-center gap-1">
                                        <Shield className="w-2 h-2" /> SEALED
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                                    <span className="text-white">{bet.amount.toFixed(2)}</span>
                                    <span>Entry: <span className="text-white">${entryPrice.toFixed(4)}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Lev.</p>
                                <p className="text-stark-purple font-mono text-sm">{bet.multiplier}x</p>
                            </div>
                            <div className="w-24">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Unrealized PnL</p>
                                <p className={`font-mono text-sm font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>{pnlString}</p>
                            </div>
                        </div>
                    </div>
                );
            })}

            <div className="p-4 border border-dashed border-white/10 rounded-lg text-center mt-2 bg-white/5">
                <Shield className="w-5 h-5 text-stark-purple mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Encrypted using Tongo Protocol</p>
                <p className="text-[10px] text-muted-foreground/60 w-3/4 mx-auto mt-1 leading-relaxed">Positions are only visible to your derived key. Liquidators can assert bankruptcy via ZK proofs without knowing your exact entry.</p>
            </div>
        </div>
    );
}
