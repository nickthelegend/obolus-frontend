'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from '@starknet-react/core';
import { useStore } from '@/lib/store';
import { TrendingUp, TrendingDown, Shield, Wallet, Activity, Zap, Info, Search, ChevronDown, Coins, Loader2 } from 'lucide-react';
import { SealedPositionList } from './SealedPositionList';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { PRICE_FEED_IDS, AssetType } from '@/lib/utils/priceFeed';
import { motion, AnimatePresence } from 'framer-motion';
import { CallData } from 'starknet';

export function PerpTerminal() {
    const { address, status, account } = useAccount();
    const { tongoPrivKey, currentPrice, selectedAsset, setSelectedAsset, placeBetFromHouseBalance, houseBalance, requestFaucet, isLoading, setGameMode } = useStore();
    const [justClaimed, setJustClaimed] = useState(false);

    // Real USDT Address from ENV
    const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_CONTRACT || "0x03df0e21f32b9a27b373275cd85e6349e92d1b69a03e87ddc15865a4cfb900b2";

    // UI State
    const [leverage, setLeverage] = useState(10);
    const [size, setSize] = useState('');
    const [isSealed, setIsSealed] = useState(true);
    const [isPlacing, setIsPlacing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [limitPrice, setLimitPrice] = useState('');
    const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
    const [isSurging, setIsSurging] = useState(false);
    const prevBalance = useRef(houseBalance);

    // Watch for balance increases (Faucet success)
    useEffect(() => {
        if (houseBalance > prevBalance.current) {
            setIsSurging(true);
            setTimeout(() => setIsSurging(false), 2000);
        }
        prevBalance.current = houseBalance;
    }, [houseBalance]);

    // Switch to Perp Mode on Mount
    useEffect(() => {
        setGameMode('perp');
    }, [setGameMode]);

    const assets = Object.keys(PRICE_FEED_IDS) as AssetType[];
    const filteredAssets = assets.filter(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

    // REAL SMART CONTRACT TRADE EXECUTION
    const handleTrade = async (side: 'long' | 'short') => {
        if (!address || !size || !account) return;
        setIsPlacing(true);

        try {
            const collateralAmount = parseFloat(size) * currentPrice / leverage;
            const collateralBaseUnits = BigInt(Math.floor(collateralAmount * 1e6)); // 6 decimals for USDT

            if (collateralAmount > houseBalance) {
                alert(`Insufficient USDT. Required: ${collateralAmount.toFixed(2)} USDT, Available: ${houseBalance.toFixed(2)} USDT`);
                setIsPlacing(false);
                return;
            }

            if (orderType === 'market') {
                // MARKET ORDER: Open Position directly on Perp Contract
                const tx = await account.execute([
                    {
                        contractAddress: USDT_ADDRESS,
                        entrypoint: "approve",
                        calldata: CallData.compile([process.env.NEXT_PUBLIC_PERP_CONTRACT!, collateralBaseUnits.toString(), "0"])
                    },
                    {
                        contractAddress: process.env.NEXT_PUBLIC_PERP_CONTRACT!,
                        entrypoint: "deposit_collateral",
                        calldata: CallData.compile([collateralBaseUnits.toString()])
                    },
                    {
                        contractAddress: process.env.NEXT_PUBLIC_PERP_CONTRACT!,
                        entrypoint: "open_position_sealed",
                        calldata: CallData.compile([
                            "0x123", // ct_size_L (placeholder)
                            "0x456", // ct_size_R (placeholder)
                            "0x789", // ct_price_L (placeholder)
                            "0xabc", // ct_price_R (placeholder)
                            collateralBaseUnits.toString()
                        ])
                    }
                ]);
                console.log("Market Trade Tx:", tx.transaction_hash);
            } else {
                // LIMIT ORDER: Place Order in SealedOrderbook Contract
                const tx = await account.execute([
                    {
                        contractAddress: process.env.NEXT_PUBLIC_ORDERBOOK_CONTRACT!,
                        entrypoint: "place_order",
                        calldata: CallData.compile([
                            side === 'long' ? "0" : "1", // 0=BUY, 1=SELL
                            "0xabc", // ct_price_L (placeholder)
                            "0xdef", // ct_price_R (placeholder)
                            "0x123", // ct_size_L (placeholder)
                            "0x456"  // ct_size_R (placeholder)
                        ])
                    }
                ]);
                console.log("Limit Order Tx:", tx.transaction_hash);
            }

            // Record in Supabase using the collateral amount (USDT) so PnL calculations are correct
            await placeBetFromHouseBalance(
                collateralAmount.toFixed(4),
                `${side === 'long' ? 'UP' : 'DOWN'}-${leverage}`,
                address,
                `perp-${Date.now()}`
            );

            alert(`Trade Executed!\nType: ${orderType.toUpperCase()}\nSize: ${size} @ ${leverage}x`);
        } catch (error) {
            console.error(error);
            alert("Trade Failed: " + (error as any).message);
        } finally {
            setIsPlacing(false);
            setSize('');
        }
    };

    // REAL SMART CONTRACT FAUCET
    const handleFaucet = async () => {
        console.log("handleFaucet clicked", {
            address,
            hasAccount: !!account,
            USDT_ADDRESS
        });

        if (!address || !account) {
            console.warn("Missing address or account - cannot invoke faucet");
            return;
        }

        try {
            setIsPlacing(true);
            console.log("STEP 1: Invoking on-chain faucet...");
            const tx = await account.execute({
                contractAddress: USDT_ADDRESS,
                entrypoint: "faucet",
                calldata: []
            });
            console.log("STEP 2: Faucet Tx confirmed!", tx.transaction_hash);
            alert(`Faucet Tx Confirmed!\nTx Hash: ${tx.transaction_hash}\nAdding 1000 USDT to your DEVNET wallet.`);

            // Sync with local balance store
            console.log("STEP 3: Syncing with store...");
            await requestFaucet(address);
            console.log("STEP 4: Sync complete");
        } catch (error) {
            console.error("FAUCET ERROR:", error);
            alert("Faucet failed: " + (error as any).message);
        } finally {
            setIsPlacing(false);
            console.log("handleFaucet finished");
        }
    };

    return (
        <div className="flex-1 w-full h-full flex flex-col md:flex-row p-2 gap-2 overflow-hidden text-foreground">

            {/* LEFT: Chart & Orders (Flex-grow) */}
            <div className="flex-1 flex flex-col gap-2 min-h-0">

                {/* Top Info Bar */}
                <div className="h-16 bg-card/40 backdrop-blur-xl border border-white/10 rounded-xl flex items-center px-6 gap-8 shrink-0 z-20">
                    <div className="relative">
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
                            onClick={() => setIsSearching(!isSearching)}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stark-orange to-red-500 flex items-center justify-center font-bold text-white shadow-lg shadow-stark-orange/20">
                                {selectedAsset?.charAt(0) || 'E'}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                    {selectedAsset}-USDT <ChevronDown className={`w-4 h-4 transition-transform ${isSearching ? 'rotate-180' : ''}`} />
                                </h2>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
                                    Pyth Oracle <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                </p>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isSearching && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-64 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100]"
                                >
                                    <div className="p-3 border-b border-white/5">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Search assets..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:border-stark-orange/50 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {filteredAssets.map(asset => (
                                            <div
                                                key={asset}
                                                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${selectedAsset === asset ? 'bg-stark-orange/10' : ''}`}
                                                onClick={() => {
                                                    setSelectedAsset(asset);
                                                    setIsSearching(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                                        {asset[0]}
                                                    </div>
                                                    <span className={`text-sm font-bold ${selectedAsset === asset ? 'text-stark-orange' : 'text-foreground'}`}>{asset}-USDT</span>
                                                </div>
                                                {selectedAsset === asset && <Zap className="w-3 h-3 text-stark-orange" />}
                                            </div>
                                        ))}
                                        {filteredAssets.length === 0 && (
                                            <div className="p-8 text-center text-xs text-muted-foreground">No assets found</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Mark Price</p>
                        <p className="text-green-400 font-mono font-bold">${currentPrice > 0 ? currentPrice.toFixed(2) : 'Loading...'}</p>
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
                <div className="flex-1 rounded-xl relative overflow-hidden bg-black/50 border border-white/10 p-1">
                    <AdvancedRealTimeChart
                        theme="dark"
                        symbol={`BINANCE:${selectedAsset}USD`}
                        autosize
                        allow_symbol_change={false}
                        hide_side_toolbar={false}
                    />
                </div>

                {/* Bottom Positions Area */}
                <div className="h-72 bg-card/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col shrink-0">
                    <div className="flex gap-1 p-2 bg-black/40 border-b border-white/5 shrink-0">
                        <button
                            onClick={() => setActiveTab('positions')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'positions' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
                        >
                            Positions <span className="bg-stark-purple px-1.5 py-0.5 rounded text-[10px]">1</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'orders' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
                        >
                            Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
                        >
                            History
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                        {activeTab === 'positions' ? (
                            <SealedPositionList tongoPrivKey={tongoPrivKey} />
                        ) : activeTab === 'orders' ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <div className="p-4 bg-stark-purple/10 border border-stark-purple/20 rounded-xl max-w-sm">
                                    <Shield className="w-8 h-8 text-stark-purple mx-auto mb-3" />
                                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Sealed Orderbook</h3>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        Your orders are encrypted. Only the designated
                                        Matcher can see compatible crosses.
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (account) {
                                            const tx = await account.execute({
                                                contractAddress: process.env.NEXT_PUBLIC_ORDERBOOK_CONTRACT!,
                                                entrypoint: "match_orders",
                                                calldata: CallData.compile(["1", "2", "0xabc", "0xdef", ["0x123"]])
                                            });
                                            console.log("Matcher Triggered:", tx.transaction_hash);
                                        }
                                    }}
                                    className="px-6 py-2 bg-stark-purple/20 hover:bg-stark-purple text-stark-purple hover:text-white border border-stark-purple/40 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Run Matcher Service
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                                <p className="text-sm font-medium tracking-widest uppercase">No Settlement History</p>
                            </div>
                        )}
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
                            <motion.span
                                animate={isSurging ? { scale: [1, 1.2, 1], color: ['#fff', '#f97316', '#fff'] } : {}}
                                className="text-white font-mono font-bold flex items-center gap-1"
                            >
                                ${houseBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <Wallet className="w-3 h-3 text-stark-orange" />
                            </motion.span>
                        </div>
                        <div className="w-full bg-black/50 rounded-full h-1.5 border border-white/5 overflow-hidden relative">
                            <motion.div
                                animate={isSurging ? {
                                    backgroundColor: ['#f97316', '#fff', '#f97316'],
                                    boxShadow: ['0 0 0px #f97316', '0 0 20px #fff', '0 0 0px #f97316']
                                } : {}}
                                className="bg-stark-orange h-full relative z-10"
                                style={{ width: `${Math.min((houseBalance / 10000) * 100, 100)}%` }}
                            />
                            {isSurging && (
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent z-20"
                                />
                            )}
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <button
                                onClick={async () => {
                                    await handleFaucet();
                                    setJustClaimed(true);
                                    setTimeout(() => setJustClaimed(false), 3000);
                                }}
                                disabled={!address || isLoading}
                                className={`w-full py-2 bg-stark-orange/20 hover:bg-stark-orange/30 border border-stark-orange/40 text-stark-orange rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${justClaimed ? 'bg-green-500/20 border-green-500/40 text-green-400' : ''}`}
                            >
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : (justClaimed ? <Shield className="w-3 h-3" /> : <Coins className="w-3 h-3" />)}
                                {justClaimed ? 'Distributed $1,000 USDT' : 'Request USDT Faucet'}
                            </button>

                            <div className="flex flex-col gap-1 mt-1">
                                <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tight">USDT Contract</span>
                                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded border border-white/5 group relative overflow-hidden">
                                    <span className="text-[7px] text-white/40 font-mono truncate flex-1">{USDT_ADDRESS}</span>
                                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center">
                                        <Zap className="w-2 h-2 text-stark-orange opacity-50" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-[9px] text-muted-foreground uppercase flex justify-between px-1 mt-1">
                                <span>Risk: Low</span>
                                <span>Isolated</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Controls */}
                    <div className="space-y-4">
                        <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
                            <button
                                onClick={() => setOrderType('market')}
                                className={`flex-1 py-1.5 rounded shadow-sm text-xs font-bold uppercase transition-all ${orderType === 'market' ? 'bg-stark-orange/20 border border-stark-orange/40 text-stark-orange' : 'text-muted-foreground hover:text-white'}`}
                            >
                                Market
                            </button>
                            <button
                                onClick={() => setOrderType('limit')}
                                className={`flex-1 py-1.5 rounded text-xs font-bold uppercase transition-all ${orderType === 'limit' ? 'bg-stark-purple/20 border border-stark-purple/40 text-stark-purple' : 'text-muted-foreground hover:text-white'}`}
                            >
                                Limit
                            </button>
                        </div>

                        {orderType === 'limit' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Limit Price</label>
                                    <span className="text-[10px] text-stark-purple animate-pulse">ENCRYPTED</span>
                                </div>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder={currentPrice.toFixed(2)}
                                        value={limitPrice}
                                        onChange={(e) => setLimitPrice(e.target.value)}
                                        className="w-full bg-black/40 border border-stark-purple/20 p-3 rounded-lg text-lg font-mono text-white outline-none focus:border-stark-purple/50 transition-colors"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase">USDT</span>
                                </div>
                            </motion.div>
                        )}

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Order Size</label>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    Max: {currentPrice > 0 ? ((houseBalance * leverage) / currentPrice).toFixed(4) : '0.00'} {selectedAsset}
                                </span>
                            </div>
                            <div className="relative group mb-3">
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-lg font-mono text-white outline-none focus:border-stark-orange/50 transition-colors group-hover:border-white/20"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase">{selectedAsset}</span>
                            </div>

                            {/* Size Slider */}
                            <div className="space-y-1 mb-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={
                                        currentPrice > 0 && size ?
                                            Math.min(100, Math.round((Number(size) / ((houseBalance * leverage) / currentPrice)) * 100)) || 0
                                            : 0
                                    }
                                    onChange={(e) => {
                                        if (currentPrice > 0) {
                                            const percentage = Number(e.target.value);
                                            const maxSize = (houseBalance * leverage) / currentPrice;
                                            const calculatedSize = (maxSize * (percentage / 100)).toFixed(4);
                                            setSize(percentage === 0 ? '' : calculatedSize);
                                        }
                                    }}
                                    className="w-full accent-stark-orange h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between items-center px-1 text-[9px] text-muted-foreground font-bold tracking-widest">
                                    <span className="hover:text-white cursor-pointer transition-colors" onClick={() => currentPrice > 0 && setSize(((houseBalance * leverage * 0.25) / currentPrice).toFixed(4))}>25%</span>
                                    <span className="hover:text-white cursor-pointer transition-colors" onClick={() => currentPrice > 0 && setSize(((houseBalance * leverage * 0.5) / currentPrice).toFixed(4))}>50%</span>
                                    <span className="hover:text-white cursor-pointer transition-colors" onClick={() => currentPrice > 0 && setSize(((houseBalance * leverage * 0.75) / currentPrice).toFixed(4))}>75%</span>
                                    <span className="hover:text-stark-orange cursor-pointer transition-colors" onClick={() => currentPrice > 0 && setSize(((houseBalance * leverage) / currentPrice).toFixed(4))}>100%</span>
                                </div>
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
                                onChange={(e) => {
                                    const newLeverage = Number(e.target.value);
                                    setLeverage(newLeverage);
                                    // Optionally recalculate size if it exceeds new max
                                    if (currentPrice > 0 && size) {
                                        const newMaxSize = (houseBalance * newLeverage) / currentPrice;
                                        if (Number(size) > newMaxSize) {
                                            setSize(newMaxSize.toFixed(4));
                                        }
                                    }
                                }}
                                className="w-full accent-stark-purple h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
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
                            <span className="text-white">
                                ~ ${size && currentPrice ? ((parseFloat(size) * currentPrice) / leverage).toFixed(2) : '0.00'}
                            </span>
                        </div>

                        <button
                            onClick={() => handleTrade('long')}
                            disabled={!address || isPlacing || !size}
                            className="w-full py-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isPlacing ? <Zap className="w-4 h-4 animate-pulse" /> : <TrendingUp className="w-4 h-4" />}
                            Buy / Long
                        </button>

                        <button
                            onClick={() => handleTrade('short')}
                            disabled={!address || isPlacing || !size}
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
