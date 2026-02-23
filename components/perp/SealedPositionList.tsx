import React from 'react';
import { Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function SealedPositionList({ tongoPrivKey }: { tongoPrivKey: string | null }) {
    if (!tongoPrivKey) return null;

    return (
        <div className="flex flex-col gap-2">
            {[
                { type: 'LONG', asset: 'ETH-USD', size: '10.5', entry: '$2,910.00', pnl: '+$320.50', liq: '$2,750.00' },
                { type: 'SHORT', asset: 'STRK-USD', size: '5000', entry: '$1.25', pnl: '-$15.20', liq: '$1.45' }
            ].map((pos, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pos.type === 'LONG' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {pos.type === 'LONG' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm tracking-tight">{pos.asset}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-stark-purple/20 text-stark-purple flex items-center gap-1">
                                    <Shield className="w-2 h-2" /> SEALED
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                                <span className="text-white">{pos.size}</span>
                                <span>Entry: <span className="text-white">{pos.entry}</span></span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-right">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Liq. Price</p>
                            <p className="text-stark-orange font-mono text-sm">{pos.liq}</p>
                        </div>
                        <div className="w-24">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Unrealized PnL</p>
                            <p className={`font-mono text-sm font-bold ${pos.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{pos.pnl}</p>
                        </div>
                        <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100">
                            Close
                        </button>
                    </div>
                </div>
            ))}
            
            <div className="p-4 border border-dashed border-white/10 rounded-lg text-center mt-2 bg-white/5">
                <Shield className="w-5 h-5 text-stark-purple mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Encrypted using Tongo Protocol</p>
                <p className="text-xs text-muted-foreground/60 w-3/4 mx-auto mt-1">Positions are only visible to your derived key. Liquidators can assert bankruptcy via ZK proofs without knowing your exact entry.</p>
            </div>
        </div>
    );
}
