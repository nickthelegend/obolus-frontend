'use client';

import React, { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import { useStore } from '@/lib/store';
import { TrendingUp, TrendingDown, Shield, Wallet, Activity, Zap, Info } from 'lucide-react';
import { SealedPositionList } from './SealedPositionList';

export function PerpTerminal() {
    const { address, status } = useAccount();
    const { tongoPrivKey } = useStore();
    
    // UI State
    const [selectedAsset, setSelectedAsset] = useState('ETH-USD');
    const [leverage, setLeverage] = useState(10);
    const [size, setSize] = useState('');
    const [isSealed, setIsSealed] = useState(true);
    const [isPlacing, setIsPlacing] = useState(false);

    const handleTrade = async (side: 'long' | 'short') => {
        if (!address) return;
        setIsPlacing(true);
        
        // Mocking the delay for ZK Proof generation
        setTimeout(() => {
            setIsPlacing(false);
            alert(`${side.toUpperCase()} Position submitted to Starknet!`);
        }, 3000);
    };

    return (
        <div className="flex-1 w-full h-full flex flex-col md:flex-row p-2 gap-2 overflow-hidden text-foreground">
            
            {/* LEFT: Chart & Orders (Flex-grow) */}
            <div className="flex-1 flex flex-col gap-2 min-h-0">
                
                {/* Top Info Bar */}
                <div className="h-16 bg-card/40 backdrop-blur-xl border border-white/10 rounded-xl flex items-center px-6 gap-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stark-orange to-red-500 flex items-center justify-center font-bold text-white shadow-lg shadow-stark-orange/20">
                            E
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">ETH-USD</h2>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
                                Pyth Oracle <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            </p>
                        </div>
                    </div>
                    
                    <div className="h-8 w-px bg-white/10 mx-2" />
                    
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Mark Price</p>
                        <p className="text-green-400 font-mono font-bold">$2,940.50</p>
                    </div>
                    
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">24h Vol</p>
                        <p className="text-foreground font-mono font-bold">$14.2M</p>
                    </div>
                    
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Funding Rate</p>
                        <p className="text-stark-orange font-mono font-bold">0.01%</p>
                    </div>
                </div>
                
                {/* Central Chart Area */}
                <div className="flex-1 bg-card/20 backdrop-blur-xl border border-white/10 rounded-xl relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(58,30,141,0.1)_0,transparent_100%)]" />
                    <p className="text-muted-foreground font-mono uppercase tracking-[0.2em] relative z-10 animate-pulse flex items-center gap-2">
                        <Activity className="w-4 h-4" /> [ TradingView Advanced Chart Integration ]
                    </p>
                </div>
                
                {/* Bottom Positions Area */}
                <div className="h-72 bg-card/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col shrink-0">
                     <div className="flex gap-1 p-2 bg-black/40 border-b border-white/5 shrink-0">
                        <button className="px-6 py-2 bg-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            Positions <span className="bg-stark-purple px-1.5 py-0.5 rounded text-[10px]">1</span>
                        </button>
                        <button className="px-6 py-2 text-muted-foreground hover:bg-white/5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                            Orders
                        </button>
                        <button className="px-6 py-2 text-muted-foreground hover:bg-white/5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                            History
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                        <SealedPositionList tongoPrivKey={tongoPrivKey} />
                    </div>
                </div>

            </div>

            {/* RIGHT: Order Entry Terminal */}
            <div className="w-[340px] bg-gradient-to-b from-card/80 to-black/90 backdrop-blur-2xl border border-white/10 rounded-xl flex flex-col shrink-0 overflow-hidden shadow-2xl">
                
                {/* Mode Toggles */}
                <div className="flex p-2 bg-black/40 border-b border-white/5 shrink-0">
                    <button className="flex-1 py-2 bg-white/10 text-white rounded-lg text-xs font-black uppercase tracking-widest text-center shadow-lg">
                        Cross Margin
                    </button>
                    <button className="flex-1 py-2 text-muted-foreground hover:text-white rounded-lg text-xs font-black uppercase tracking-widest text-center transition-colors">
                        Isolated
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                    
                    {/* Collateral Status */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Available Margin</span>
                            <span className="text-white font-mono font-bold flex items-center gap-1">
                                $5,000.00 <Wallet className="w-3 h-3 text-stark-orange" />
                            </span>
                        </div>
                        <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5 overflow-hidden">
                            <div className="bg-stark-orange h-full w-[10%]" />
                        </div>
                        <div className="mt-2 text-[9px] text-muted-foreground uppercase flex justify-between">
                            <span>Used: 10%</span>
                            <span>Risk: Low</span>
                        </div>
                    </div>

                    {/* Order Controls */}
                    <div className="space-y-4">
                        <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
                            <button className="flex-1 py-1.5 bg-stark-orange/20 border border-stark-orange/40 text-stark-orange rounded shadow-sm text-xs font-bold uppercase">
                                Market
                            </button>
                            <button className="flex-1 py-1.5 text-muted-foreground hover:text-white rounded text-xs font-bold uppercase transition-colors">
                                Limit
                            </button>
                        </div>
                        
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Order Size</label>
                                <span className="text-[10px] text-muted-foreground font-mono">Max: 15.0 ETH</span>
                            </div>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    placeholder="0.00" 
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-lg font-mono text-white outline-none focus:border-stark-orange/50 transition-colors group-hover:border-white/20" 
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase">ETH</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Leverage</label>
                                <span className="text-[10px] text-stark-purple font-mono font-bold bg-stark-purple/10 px-1.5 py-0.5 rounded">{leverage}x</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="50" 
                                value={leverage}
                                onChange={(e) => setLeverage(Number(e.target.value))}
                                className="w-full accent-stark-purple" 
                            />
                            <div className="flex justify-between mt-1 px-1">
                                <span className="text-[8px] text-muted-foreground">1x</span>
                                <span className="text-[8px] text-muted-foreground">25x</span>
                                <span className="text-[8px] text-muted-foreground">50x</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Privacy Toggle Slider */}
                    <div className="mt-2 bg-gradient-to-r from-stark-purple/10 to-transparent p-3 rounded-xl border border-stark-purple/20 flex items-center justify-between cursor-pointer" onClick={() => setIsSealed(!isSealed)}>
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isSealed ? 'bg-stark-purple' : 'bg-white/10'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${isSealed ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#E8E8E8]">
                                Sealed Execution
                            </span>
                        </div>
                        {isSealed ? <Shield className="w-4 h-4 text-stark-purple" /> : <Info className="w-4 h-4 text-muted-foreground" />}
                    </div>

                    <div className="space-y-2 mt-auto">
                        
                        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-4">
                            <span>Initial Margin</span>
                            <span className="text-white">~ $294.05</span>
                        </div>

                        <button 
                            onClick={() => handleTrade('long')}
                            disabled={!address || isPlacing}
                            className="w-full py-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPlacing ? <Zap className="w-4 h-4 animate-pulse" /> : <TrendingUp className="w-4 h-4" />}
                            Buy / Long
                        </button>
                        
                        <button 
                            onClick={() => handleTrade('short')}
                            disabled={!address || isPlacing}
                            className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPlacing ? <Zap className="w-4 h-4 animate-pulse" /> : <TrendingDown className="w-4 h-4" />}
                            Sell / Short
                        </button>
                        
                    </div>
                </div>
            </div>
        </div>
    );
}
