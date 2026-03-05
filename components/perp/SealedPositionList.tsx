import React from 'react';
import { Shield, ArrowUpRight, ArrowDownRight, AlertTriangle, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { liquidatePosition } from '@/lib/perp';

import { useAccount } from '@starknet-react/core';

export function SealedPositionList({ tongoPrivKey, filterMode }: { tongoPrivKey: string | null, filterMode?: string }) {
    const { account } = useAccount();
    const allActiveBets = useStore(state => state.activeBets);
    const activeBets = filterMode ? allActiveBets.filter(b => b.mode === filterMode) : allActiveBets;
    const assetPrices = useStore(state => state.assetPrices);
    const closePerpPosition = useStore(state => state.closePerpPosition);
    const address = useStore(state => state.address);

    if (!tongoPrivKey && activeBets.length > 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-stark-purple bg-stark-purple/5 border border-stark-purple/10 rounded-lg h-full">
                <Shield className="w-8 h-8 mb-3 opacity-50 animate-pulse" />
                <p className="text-sm font-black tracking-widest uppercase">Positions Shielded</p>
                <p className="text-[10px] opacity-70 mt-1 max-w-[200px] text-center uppercase tracking-tight">Unlock your Obolus Vault to view and manage active positions</p>
            </div>
        );
    }

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
                const entryPrice = bet.entryPrice || bet.strikePrice || 0;

                // Use store-calculated PnL or fall back to local calculation
                const assetPrice = assetPrices[bet.asset] || (bet.asset === useStore.getState().selectedAsset ? useStore.getState().currentPrice : 0);

                const rawPnl = (() => {
                    if (!assetPrice || !entryPrice) return 0;
                    const priceDiff = assetPrice - entryPrice;
                    const lev = bet.leverage || bet.multiplier || 1;
                    const pnlPercentage = (priceDiff / entryPrice) * lev;
                    const localPnl = bet.amount * pnlPercentage;
                    return isLong ? localPnl : -localPnl;
                })();

                const isLiquidatable = rawPnl <= -bet.amount * 0.9; // 90% loss
                const isProfit = rawPnl >= 0;
                const pnlString = `${isProfit ? '+' : '-'}$${Math.abs(rawPnl).toFixed(Math.abs(rawPnl) < 1 ? 4 : 2)}`;

                return (
                    <div key={bet.id || i} className={`flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border rounded-lg transition-colors group ${isLiquidatable ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLong ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {isLong ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm tracking-tight">{bet.asset}-USDT</span>
                                    <span className="text-[10px] text-white/50 font-mono ml-1">
                                        {((bet.amount * (bet.leverage || bet.multiplier || 1)) / (entryPrice || 1)).toFixed(4)} {bet.asset}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-stark-purple/20 text-stark-purple flex items-center gap-1">
                                        <Shield className="w-2 h-2" /> SEALED
                                    </span>
                                    {isLiquidatable && (
                                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 animate-pulse flex items-center gap-1">
                                            <AlertTriangle className="w-2 h-2" /> RECT
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                                    <span className="text-white">{(bet.amount * (bet.multiplier || 1)).toFixed(2)} USDT</span>
                                    <span>Entry: <span className="text-white">${entryPrice.toFixed(4)}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                            <div>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Lev.</p>
                                <p className="text-stark-purple font-mono text-xs">{bet.multiplier}x</p>
                            </div>
                            <div className="w-20">
                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">PnL</p>
                                <p className={`font-mono text-xs font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>{pnlString}</p>
                            </div>
                            {isLiquidatable && account && (
                                <button
                                    onClick={async () => {
                                        if (account) {
                                            const tx = await liquidatePosition(account, 1);
                                            console.log("Liquidation Tx:", tx.transaction_hash);
                                        }
                                    }}
                                    className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[9px] font-black uppercase tracking-tight hover:bg-red-500 hover:text-white transition-all"
                                >
                                    Rect
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (!address || !account) {
                                        alert("Please connect your wallet to close positions.");
                                        return;
                                    }
                                    closePerpPosition(bet.id, address, account);
                                }}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm border ${(!address || !account) ? 'bg-white/5 text-white/30 border-white/5 cursor-not-allowed' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'}`}
                            >
                                <Zap className="w-3 h-3" />
                                {(!address || !account) ? 'Locked' : 'Close'}
                            </button>
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
