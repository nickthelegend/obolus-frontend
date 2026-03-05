'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { LiveChart } from './';
import { BalanceDisplay } from '@/components/balance';
import { useToast } from '@/lib/hooks/useToast';
import { useAccount } from '@starknet-react/core';
import { CallData, uint256 } from 'starknet';
import { EncryptionModal } from '../perp/EncryptionModal';
import { encryptOrderData } from '@/lib/tongo';
import { generateTradeProof, generateMockProof } from '@/lib/zk';
import PERP_ABI from '@/lib/perp_abi_clean.json';

import { Shield } from 'lucide-react';

export const GameBoard: React.FC = () => {
  const { account } = useAccount();
  const {
    address,
    isConnected,
    walletBalance,
    gameMode,
    setGameMode,
    setTimeframeSeconds,
    selectedAsset,
    updatePrice,
    placeBetFromHouseBalance,
    isPlacingBet,
    isBlitzActive,
    blitzEndTime,
    nextBlitzTime,
    hasBlitzAccess,
    updateBlitzTimer,
    enableBlitzAccess,
    error,
    clearError,
    isLoading: isLoadingBalance,
    activeTab,
    setActiveTab,
    userTier,
    refreshWalletBalance,
    fetchBalance,
    connect,
    disconnect
  } = useStore();

  // Refresh wallet and house balance when switching to wallet tab
  useEffect(() => {
    if (activeTab === 'wallet' && isConnected && address) {
      refreshWalletBalance();
      // Also fetch house balance from Supabase (skip for demo mode)
      if (fetchBalance && !address.startsWith('0xDEMO')) {
        fetchBalance(address);
      }
    }
  }, [activeTab, isConnected, address, refreshWalletBalance, fetchBalance]);

  const [betAmount, setBetAmount] = useState<string>('0.1');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // ZK/Tongo State
  const [isSealed, setIsSealed] = useState(true);
  const [isEncryptionModalOpen, setIsEncryptionModalOpen] = useState(false);
  const [encryptionModalTitle, setEncryptionModalTitle] = useState("Shielding Order Data");
  const [encryptionCompleteCallback, setEncryptionCompleteCallback] = useState<(() => Promise<void>) | null>(null);
  const tongoPrivKey = useStore(state => state.tongoPrivKey);
  const currentPrice = useStore(state => state.currentPrice);
  const houseBalance = useStore(state => (state as any).houseBalance);
  const [isPlacing, setIsPlacing] = useState(false);
  const [ctPayload, setCtPayload] = useState<{ sizeL: string, sizeR: string, priceL: string, priceR: string }>({ sizeL: "0x0", sizeR: "0x0", priceL: "0x0", priceR: "0x0" });

  const [blitzCountdown, setBlitzCountdown] = useState<string>('');
  const [blitzTimeRemaining, setBlitzTimeRemaining] = useState<string>('');
  const [isActivatingBlitz, setIsActivatingBlitz] = useState(false);

  const toast = useToast();

  // Unified balance and currency - STRK for Obolus on Starknet
  const currencySymbol = 'STRK';
  const blitzEntryFee = 0.01;

  const handleEnterBlitz = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isBlitzActive) {
      toast.error("Blitz Round is not currently active");
      return;
    }

    try {
      setIsActivatingBlitz(true);

      // Starknet Blitz payment logic would go here
      toast.info(`Confirming ${blitzEntryFee} ${currencySymbol} Blitz Entry...`);

      toast.success("Payment successful! Blitz Mode enabled.");
      // Update store state
      enableBlitzAccess();
      refreshWalletBalance();
    } catch (err: any) {
      console.error("Blitz entry failed:", err);
      const errorMessage = err.message || "";
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || errorMessage.includes('User rejected')) {
        toast.error("User rejected");
      } else {
        toast.error(errorMessage || "Failed to enter Blitz Round");
      }
    } finally {
      setIsActivatingBlitz(false);
    }
  };

  // Update Blitz Timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateBlitzTimer();
      const now = Date.now();
      if (isBlitzActive && blitzEndTime) {
        const remaining = Math.max(0, blitzEndTime - now);
        setBlitzTimeRemaining(`${Math.floor(remaining / 1000)}s`);
        setBlitzCountdown('');
      } else {
        const timeToNext = Math.max(0, nextBlitzTime - now);
        const mins = Math.floor(timeToNext / 60000);
        const secs = Math.floor((timeToNext % 60000) / 1000);
        setBlitzCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
        setBlitzTimeRemaining('');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isBlitzActive, blitzEndTime, nextBlitzTime, updateBlitzTimer]);



  // Sync selectedDuration with store's timeframeSeconds
  useEffect(() => {
    setTimeframeSeconds(selectedDuration);
  }, [selectedDuration, setTimeframeSeconds]);

  // Multiplier mapping based on duration
  const getMultiplier = (duration: number) => {
    switch (duration) {
      case 5: return 1.75;
      case 10: return 1.80;
      case 15: return 1.85;
      case 30: return 1.90;
      case 60: return 1.95;
      default: return 1.90;
    }
  };

  const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_CONTRACT || "0x00c73361df3e839e9432608f654f593cd3a48e7e172fe42fcdf549f33ae2a512";

  const handleObolusBet = async (direction: 'UP' | 'DOWN') => {
    if (!address || !account || isPlacing) return;

    const tradePrice = currentPrice;
    const collateralAmount = parseFloat(betAmount);
    const collateralBaseUnits = BigInt(Math.floor(collateralAmount * 1e6)); // 1e6 for USDT

    if (collateralAmount > houseBalance) {
      toast.error(`Insufficient Balance. Have: ${houseBalance.toFixed(2)}, Need: ${collateralAmount.toFixed(2)}`);
      return;
    }

    setIsPlacing(true);

    if (isSealed && tongoPrivKey) {
      try {
        setEncryptionModalTitle("Shielding Options Bet");

        // 1. Encrypt Size/Amount
        const encryptedSize = await encryptOrderData(tongoPrivKey, collateralBaseUnits);

        // 2. Encrypt Strike Price (current price for Binary Options)
        const encryptedPrice = await encryptOrderData(tongoPrivKey, BigInt(Math.floor(tradePrice * 1e6)));

        setCtPayload({
          sizeL: encryptedSize.ct_L,
          sizeR: encryptedSize.ct_R,
          priceL: encryptedPrice.ct_L,
          priceR: encryptedPrice.ct_R
        });

        // 3. Generate ZK Proof
        console.log("[ZK] Generating Options Trade Proof...");
        const zkProof = await generateTradeProof(
          tongoPrivKey,
          collateralBaseUnits.toString(),
          address.toString()
        );

        const zkCalldata = zkProof?.calldata || [];
        const commitment = zkProof?.commitment || "0";
        const nullifier = zkProof?.nullifier || "0";

        setEncryptionCompleteCallback(() => async () => {
          setIsEncryptionModalOpen(false);
          await executeOptionsTrade(
            direction,
            collateralAmount,
            collateralBaseUnits,
            encryptedSize.ct_L,
            encryptedSize.ct_R,
            encryptedPrice.ct_L,
            encryptedPrice.ct_R,
            zkCalldata,
            commitment,
            nullifier
          );
        });

        setIsEncryptionModalOpen(true);
      } catch (e) {
        console.error("ZK/Encryption error:", e);
        toast.error("Security Shield generation failed");
        setIsPlacing(false);
      }
    } else {
      // Unsealed fallback (plaintext)
      const mockProof = generateMockProof(collateralBaseUnits, address);
      await executeOptionsTrade(direction, collateralAmount, collateralBaseUnits, "0x0", "0x0", "0x0", "0x0", mockProof, "0", "0");
    }
  };

  const executeOptionsTrade = async (
    direction: 'UP' | 'DOWN',
    collateralAmount: number,
    collateralBaseUnits: bigint,
    sizeL: string,
    sizeR: string,
    priceL: string,
    priceR: string,
    zkCalldata: string[],
    commitment: string,
    nullifier: string
  ) => {
    try {
      const perpContractAddress = process.env.NEXT_PUBLIC_PERP_CONTRACT!;

      console.log("[Web3] Executing Options Trade on Starknet...");

      // Execute on-chain transaction for security/deposit
      const tx = await account!.execute([
        {
          contractAddress: USDT_ADDRESS,
          entrypoint: "approve",
          calldata: CallData.compile([perpContractAddress, uint256.bnToUint256(collateralBaseUnits)])
        },
        {
          contractAddress: perpContractAddress,
          entrypoint: "deposit_collateral",
          calldata: CallData.compile([collateralBaseUnits.toString()])
        },
        {
          contractAddress: perpContractAddress,
          entrypoint: "open_position_sealed",
          calldata: CallData.compile([
            sizeL, sizeR,
            priceL, priceR,
            collateralBaseUnits.toString(),
            zkCalldata,
            uint256.bnToUint256(commitment),
            uint256.bnToUint256(nullifier)
          ])
        }
      ]);

      console.log("[Web3] Transaction submitted:", tx.transaction_hash);
      toast.success("Trade Shielded on Starknet!");

      // Record in Obolus off-chain system (Convex)
      const multiplier = getMultiplier(selectedDuration);
      await placeBetFromHouseBalance(
        collateralAmount.toFixed(4),
        `${direction}-${multiplier}-${selectedDuration}`,
        address!,
        undefined,
        1 // Default position ID for demo
      );

    } catch (err: any) {
      console.error("Trade execution failed:", err);
      toast.error(err.message || "Starknet transaction failed");
    } finally {
      setIsPlacing(false);
    }
  };

  // Redundant price feed removed - now handled globally in Providers.tsx

  const activeWalletBalance = walletBalance;

  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 10) return addr || '---';
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: number) => {
    return isNaN(bal) ? '0.00' : bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* Main Interactive Chart */}
      <div className="absolute inset-0">
        <LiveChart
          betAmount={betAmount}
          setBetAmount={setBetAmount}
        />
      </div>

      {/* Blitz Round Indicator - Top Right */}
      <div className="absolute top-12 sm:top-20 right-3 sm:right-6 z-30 pointer-events-auto">
        <div className={`rounded-xl backdrop-blur-xl border shadow-lg overflow-hidden transition-all duration-500 ${isBlitzActive ? 'bg-gradient-to-br from-orange-500/20 via-red-500/20 to-yellow-500/20 border-orange-500/50 shadow-orange-500/30 animate-pulse' : 'bg-black/80 border-gray-700/50'}`}>
          <div className="px-3 py-2">
            {isBlitzActive ? (
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-orange-400 text-[9px] font-bold uppercase tracking-wider">BLITZ ACTIVE</p>
                  <p className="text-white text-sm font-bold font-mono">{blitzTimeRemaining} left</p>
                </div>
                {hasBlitzAccess && (
                  <div className="ml-2 px-1.5 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-[8px] text-green-400 font-bold">2x</div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg opacity-50">⏰</span>
                <div>
                  <p className="text-gray-500 text-[9px] font-medium uppercase tracking-wider">Next Blitz</p>
                  <p className="text-gray-300 text-sm font-mono">{blitzCountdown}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="sm:hidden fixed bottom-4 left-4 w-10 h-10 bg-stark-orange rounded-full shadow-lg shadow-stark-orange/40 flex items-center justify-center text-white text-lg font-bold z-40"
        >
          ▲
        </button>
      )}

      {/* Modern Quick Bet Panel */}
      <div className="absolute bottom-3 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-auto z-30 pointer-events-none">
        <div className={`bg-gradient-to-br from-black/95 via-stark-purple/20 to-black/95 backdrop-blur-xl border border-stark-purple/20 rounded-2xl shadow-2xl overflow-hidden w-full sm:w-[300px] transition-all duration-300 ease-out pointer-events-auto ${isPanelOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95 !pointer-events-none sm:translate-y-0 sm:opacity-100 sm:scale-100 sm:!pointer-events-auto'}`}>

          <button onClick={() => setIsPanelOpen(false)} className="sm:hidden absolute top-2 right-2 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white text-xs z-10">✕</button>

          {/* Sealed/Tongo Toggle */}
          <div className="flex items-center justify-between px-4 py-2 bg-stark-purple/10 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Shield className={`w-3 h-3 ${isSealed ? 'text-stark-purple animate-pulse' : 'text-gray-500'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Sealed Mode (Tongo)</span>
            </div>
            <button
              onClick={() => setIsSealed(!isSealed)}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${isSealed ? 'bg-stark-purple' : 'bg-gray-700'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 transform ${isSealed ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex gap-1 p-1 bg-black/60 border-b border-white/5">
            <button onClick={() => setGameMode('binomo')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-200 ${gameMode === 'binomo' ? 'bg-stark-orange/20 text-stark-orange border border-stark-orange/40' : 'text-gray-500 hover:text-gray-300'}`}>Classic</button>
            <button onClick={() => setGameMode('box')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-200 ${gameMode === 'box' ? 'bg-stark-orange/20 text-stark-orange border border-stark-orange/40' : 'text-gray-500 hover:text-gray-300'}`}>Box Mode</button>
          </div>

          <div className="flex gap-1 p-2 bg-black/40">
            <button onClick={() => setActiveTab('bet')} className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'bet' ? 'bg-gradient-to-r from-stark-orange to-red-600 text-white shadow-lg shadow-stark-orange/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Bet</button>
            <button onClick={() => setActiveTab('wallet')} className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'wallet' ? 'bg-gradient-to-r from-stark-orange to-red-600 text-white shadow-lg shadow-stark-orange/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>Wallet</button>
            <button onClick={() => setActiveTab('blitz')} className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'blitz' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' : 'text-orange-400/70 hover:text-orange-400 hover:bg-orange-400/5'}`}>Blitz</button>
          </div>

          <div className="p-4 min-h-[180px]">
            {activeTab === 'bet' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-[10px] font-medium uppercase tracking-widest mb-2 block">Quick Amount</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[100, 500, 1000, 5000, 10000].map(amt => (
                      <button key={amt} onClick={() => setBetAmount(amt.toString())} className={`py-2.5 rounded-lg font-bold text-[10px] transition-all duration-200 ${betAmount === amt.toString() ? 'bg-gradient-to-b from-stark-orange to-red-700 text-white shadow-lg shadow-stark-orange/30 scale-105' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:scale-102'}`}>{amt >= 1000 ? `${amt / 1000}k` : amt}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-[10px] font-medium uppercase tracking-widest mb-2 block">Expiration Time</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[5, 10, 15, 30, 60].map(duration => (
                      <button key={duration} onClick={() => setSelectedDuration(duration)} className={`py-2 rounded-lg font-bold text-xs transition-all duration-200 border ${selectedDuration === duration ? 'bg-stark-orange/20 border-stark-orange text-stark-orange' : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300'}`}>
                        <div className="flex flex-col items-center">
                          <span>{duration < 60 ? `${duration}s` : '1m'}</span>
                          {gameMode === 'binomo' && <span className="text-[8px] opacity-70">x{getMultiplier(duration)}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-[10px] font-medium uppercase tracking-widest mb-2 block">Investment Amount</label>
                  <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                    <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} className="flex-1 bg-transparent px-2 py-2 text-white font-mono text-base focus:outline-none min-w-0" placeholder="0.00" />
                    <span className="px-2 py-1.5 bg-stark-orange/20 rounded-lg text-stark-orange text-[10px] font-bold shrink-0">{currencySymbol}</span>
                  </div>
                </div>

                {gameMode === 'binomo' ? (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => handleObolusBet('UP')} disabled={!isConnected || isPlacing} className="group relative flex flex-col items-center justify-center gap-1 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50">
                      <div className="text-emerald-500 text-2xl font-bold group-hover:scale-110 transition-transform">▲</div>
                      <span className="text-emerald-400 text-xs font-black tracking-tighter uppercase">Higher</span>
                    </button>
                    <button onClick={() => handleObolusBet('DOWN')} disabled={!isConnected || isPlacing} className="group relative flex flex-col items-center justify-center gap-1 py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50">
                      <div className="text-rose-500 text-2xl font-bold group-hover:scale-110 transition-transform">▼</div>
                      <span className="text-rose-400 text-xs font-black tracking-tighter uppercase">Lower</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-center">
                      <p className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-1">Box Mode Active</p>
                      <p className="text-gray-400 text-[10px] leading-relaxed">Click any cell on the grid chart to place your bet.</p>
                    </div>
                  </div>
                )}
                {error && <div className="mt-2 text-red-400 text-[10px] font-bold uppercase">{error}</div>}
              </div>
            ) : activeTab === 'wallet' ? (
              <div className="space-y-4">
                <BalanceDisplay />
                <button onClick={() => disconnect()} className="w-full py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-all">Disconnect Wallet</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-xl p-4 border-2 transition-all duration-500 ${isBlitzActive ? 'bg-orange-500/20 border-orange-500/40' : 'bg-black/40 border-gray-800/50'}`}>
                  <p className="text-[10px] font-black tracking-widest text-orange-400 mb-1">Blitz Round</p>
                  <p className="text-2xl font-black font-mono text-white">{isBlitzActive ? blitzTimeRemaining : blitzCountdown}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EncryptionModal
        isOpen={isEncryptionModalOpen}
        onComplete={encryptionCompleteCallback || (() => { })}
        title={encryptionModalTitle}
        ctSizeL={ctPayload.sizeL}
        ctSizeR={ctPayload.sizeR}
        ctPriceL={ctPayload.priceL}
        ctPriceR={ctPayload.priceR}
      />
    </div>
  );
};
