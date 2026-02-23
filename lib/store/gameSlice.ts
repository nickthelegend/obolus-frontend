/**
 * Game state slice for Zustand store
 * Manages game state, active rounds, price data, and betting actions
 * 
 * Note: After BNB migration, game logic remains off-chain.
 * Only deposit/withdrawal operations interact with the blockchain.
 */

import { StateCreator } from "zustand";
import { TargetCell, PricePoint, ActiveRound } from "@/types/game";
import { AssetType } from "@/lib/utils/priceFeed";
import { playWinSound, playLoseSound } from "@/lib/utils/sounds";

// Game Modes
export type GameMode = 'binomo' | 'box' | 'perp';

// Active bet (Supports both modes)
export interface ActiveBet {
  id: string;
  mode: GameMode;
  asset: AssetType; // Added for multi-asset tracking
  amount: number;
  multiplier: number;
  direction: 'UP' | 'DOWN';
  timestamp: number;
  status: 'active' | 'settled';
  // Binomo mode specific
  strikePrice?: number;
  endTime?: number;
  // Perp specific
  leverage?: number;
  entryPrice?: number;
  unrealizedPnL?: number;
  liquidated?: boolean;
  // Box mode specific
  cellId?: string;
}

export interface GameState {
  // Core State
  gameMode: GameMode;
  selectedAsset: AssetType;
  currentPrice: number;
  priceHistory: PricePoint[];
  assetPrices: Record<string, number>; // Global price tracking
  assetHistories: Record<string, PricePoint[]>; // History for each asset
  rawAssetPrices: Record<string, number>; // Store original prices for delta amplification
  activeRound: ActiveRound | null;
  activeBets: ActiveBet[];
  settledBets: ActiveBet[];
  targetCells: TargetCell[];
  isPlacingBet: boolean;
  isSettling: boolean;
  lastResult: {
    won: boolean;
    amount: number;
    payout: number;
    timestamp: number;
    asset: AssetType; // Track which asset this result belongs to
  } | null;
  error: string | null;
  timeframeSeconds: number;

  // Blitz Round State (Premium Feature)
  isBlitzActive: boolean;
  blitzEndTime: number | null;
  nextBlitzTime: number;
  hasBlitzAccess: boolean;
  blitzMultiplier: number;
  activeTab: 'bet' | 'wallet' | 'blitz';
  activeIndicators: Record<string, boolean>;
  isIndicatorsOpen: boolean;

  // Actions
  setActiveTab: (tab: 'bet' | 'wallet' | 'blitz') => void;
  setGameMode: (mode: GameMode) => void;
  setSelectedAsset: (asset: AssetType) => void;
  setTimeframeSeconds: (seconds: number) => void;
  placeBet: (amount: string, targetId: string) => Promise<void>;
  placeBetFromHouseBalance: (amount: string, targetId: string, userAddress: string, cellId?: string) => Promise<{ betId: string; remainingBalance: number; bet: ActiveBet } | void>;
  closePerpPosition: (betId: string, userAddress: string) => Promise<void>;
  updatePrice: (price: number, asset?: AssetType) => void;
  updateAllPrices: (prices: Record<string, number>) => void;
  startGlobalPriceFeed: (updateAllPrices: (prices: Record<string, number>) => void) => (() => void);


  addActiveBet: (bet: ActiveBet) => void;
  resolveBet: (betId: string, won: boolean, payout: number) => void;
  clearLastResult: () => void;
  settleRound: (betId: string) => Promise<void>;
  setActiveRound: (round: ActiveRound | null) => void;
  loadTargetCells: () => Promise<void>;
  clearError: () => void;


  // Blitz Round Actions
  enableBlitzAccess: () => void;
  revokeBlitzAccess: () => void;
  updateBlitzTimer: () => void;
  // Indicators Actions
  toggleIndicator: (indicatorId: string) => void;
  setIsIndicatorsOpen: (isOpen: boolean) => void;
}



// Maximum price history points (5 minutes at 1 second intervals)
const MAX_PRICE_HISTORY = 300;

// Default target cells configuration
const DEFAULT_TARGET_CELLS: TargetCell[] = [
  { id: '1', label: '+$5 in 30s', multiplier: 1.5, priceChange: 5, direction: 'UP' },
  { id: '2', label: '+$10 in 30s', multiplier: 2.0, priceChange: 10, direction: 'UP' },
  { id: '3', label: '+$20 in 30s', multiplier: 3.0, priceChange: 20, direction: 'UP' },
  { id: '4', label: '+$50 in 30s', multiplier: 5.0, priceChange: 50, direction: 'UP' },
  { id: '5', label: '+$100 in 30s', multiplier: 10.0, priceChange: 100, direction: 'UP' },
  { id: '6', label: '-$5 in 30s', multiplier: 1.5, priceChange: -5, direction: 'DOWN' },
  { id: '7', label: '-$10 in 30s', multiplier: 2.0, priceChange: -10, direction: 'DOWN' },
  { id: '8', label: '-$20 in 30s', multiplier: 3.0, priceChange: -20, direction: 'DOWN' },
];

/**
 * Create game slice for Zustand store
 * Handles betting, round management, and price updates
 */
export const createGameSlice: StateCreator<any> = (set, get) => ({
  // Initial state
  gameMode: 'binomo', // Default to binomo mode
  selectedAsset: 'BTC',
  currentPrice: 0,
  priceHistory: [],
  assetPrices: {},
  assetHistories: {},
  rawAssetPrices: {},

  activeRound: null,
  activeBets: [],
  settledBets: [],
  targetCells: DEFAULT_TARGET_CELLS,
  isPlacingBet: false,
  isSettling: false,
  lastResult: null,
  error: null,
  timeframeSeconds: 30, // Default for binomo
  activeTab: 'bet',
  activeIndicators: {},
  isIndicatorsOpen: false,

  // Blitz Initial State
  isBlitzActive: false,
  blitzEndTime: null,
  nextBlitzTime: (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kasnomo_blitz_next');
      if (stored) {
        const t = parseInt(stored, 10);
        if (t > Date.now()) return t;
      }
      const next = Date.now() + 2 * 60 * 1000;
      localStorage.setItem('kasnomo_blitz_next', next.toString());
      return next;
    }
    return Date.now() + 2 * 60 * 1000;
  })(),
  hasBlitzAccess: false,
  blitzMultiplier: 2.0,

  /**
   * Set game mode (binomo or box)
   */
  setGameMode: (mode: GameMode) => {
    set({
      gameMode: mode,
      lastResult: null,
    });

  },

  /**
   * Set UI active tab
   */
  setActiveTab: (tab: 'bet' | 'wallet' | 'blitz') => {
    set({ activeTab: tab });
  },

  /**
   * Toggle a technical indicator
   */
  toggleIndicator: (indicatorId: string) => {
    set((state: GameState) => ({
      activeIndicators: {
        ...state.activeIndicators,
        [indicatorId]: !state.activeIndicators[indicatorId]
      }
    }));
  },

  /**
   * Set indicators menu open state
   */
  setIsIndicatorsOpen: (isOpen: boolean) => {
    set({ isIndicatorsOpen: isOpen });
  },


  /**
   * Set timeframe for grid cells (box mode)
   */
  setTimeframeSeconds: (seconds: number) => {
    const { gameMode, activeBets } = get();

    /**
     * In 'box' mode, the grid (columns/boundaries) is directly tied to timeframeSeconds.
     * If there are active box bets, we MUST NOT allow changing the duration,
     * as it would rebuild the grid and make existing bets visually/logically lost.
     */
    if (gameMode === 'box' && activeBets.some((bet: ActiveBet) => bet.mode === 'box')) {
      return;
    }

    set((state: GameState) => ({
      timeframeSeconds: seconds,
      /**
       * In 'binomo' (classic) mode or when there are no box bets, we update timeframeSeconds.
       * Classic bets are independent of the current selector (they have strikePrice/endTime),
       * so we keep them active.
       */
      activeBets: state.activeBets,
    }));
  },




  /**
   * Set selected asset for price tracking
   */
  setSelectedAsset: (asset: AssetType) => {
    const { selectedAsset: currentAsset, assetHistories, assetPrices } = get();

    if (currentAsset !== asset) {
      set({
        selectedAsset: asset,
        priceHistory: assetHistories[asset] || [],
        currentPrice: assetPrices[asset] || 0,
        activeRound: null
      });
    }
  },


  /**
   * Place a bet on a target cell
   * Note: After Kaspa migration, this method is deprecated.
   * Use placeBetFromHouseBalance instead for off-chain betting.
   * @param amount - Bet amount
   * @param targetId - ID of the target cell (1-8) OR dynamic grid target (e.g., "UP-2.50")
   */
  placeBet: async (amount: string, targetId: string) => {
    throw new Error("placeBet is deprecated after Kasnomo migration. Use placeBetFromHouseBalance instead.");
  },

  /**
   * Place a bet using house balance (no wallet signature required)
   * Instant-resolution system: bet is placed on a specific cell, resolves when chart hits it
   * @param amount - Bet amount in KAS
   * @param targetId - Dynamic grid target (e.g., "UP-1.9-30") containing direction and multiplier
   * @param userAddress - User's Kaspa wallet address
   * @param cellId - Optional: The specific cell ID this bet is placed on
   */
  placeBetFromHouseBalance: async (amount: string, targetId: string, userAddress: string, cellId?: string) => {
    const { targetCells, currentPrice, addActiveBet, gameMode, timeframeSeconds, selectedAsset } = get();

    try {
      // Parse amount for validation
      const betAmount = parseFloat(amount);
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error("Invalid bet amount");
      }

      // Kaspa addresses don't use 0x prefix necessarily
      const formattedAddress = userAddress;

      let target: TargetCell;
      let direction: 'UP' | 'DOWN' = 'UP';
      let multiplier = 1.9;
      let durationSeconds = timeframeSeconds || 30;

      // Check if this is a dynamic grid target (e.g., "UP-1.9-30" or "DOWN-1.2-5")
      if (targetId.startsWith('UP-') || targetId.startsWith('DOWN-')) {
        const parts = targetId.split('-');
        direction = parts[0] as 'UP' | 'DOWN';
        multiplier = parseFloat(parts[1]) || 1.9;
        durationSeconds = parseInt(parts[2]) || durationSeconds;

        // Create dynamic target
        target = {
          id: targetId,
          label: `${direction} x${multiplier} (${durationSeconds}s)`,
          multiplier: multiplier,
          priceChange: direction === 'UP' ? 10 : -10,
          direction: direction
        };
      } else if (gameMode === 'perp' && (targetId.includes('UP-') || targetId.includes('DOWN-'))) {
        // Perp mode handling
        const parts = targetId.split('-');
        direction = parts[0] as 'UP' | 'DOWN';
        multiplier = parseFloat(parts[1]) || 1; // leverage as multiplier for PnL
        durationSeconds = 0; // Perp has no end time

        target = {
          id: targetId,
          label: `${direction} ${multiplier}x`,
          multiplier: multiplier,
          priceChange: 0,
          direction: direction
        };
      } else {
        // Find predefined target cell
        const foundTarget = targetCells.find((cell: TargetCell) => cell.id === targetId);
        if (!foundTarget) {
          throw new Error("Invalid target cell");
        }
        target = foundTarget;
        direction = target.direction;
        multiplier = target.multiplier;
      }

      // DEMO MODE: Skip API call for demo mode
      const { accountType, demoBalance, updateBalance: storeUpdateBalance } = get();
      const isDemoMode = accountType === 'demo';

      if (isDemoMode) {
        if (demoBalance < betAmount) {
          throw new Error("Insufficient demo balance");
        }

        set({ isPlacingBet: true, error: null });

        // Simulate bet placement without API
        const fakeBetId = `demo-${Date.now()}`;

        // Create active bet for tracking
        const activeBet: ActiveBet = {
          id: fakeBetId,
          mode: gameMode,
          asset: selectedAsset, // Set current asset
          amount: betAmount,
          multiplier: multiplier,
          direction: direction,
          timestamp: Date.now(),
          status: 'active',
          ...(gameMode === 'binomo' ? {
            strikePrice: currentPrice,
            endTime: Date.now() + (durationSeconds * 1000)
          } : {
            cellId: cellId || targetId
          })
        };


        // Update local demo balance immediately
        storeUpdateBalance(betAmount, 'subtract');

        // Add to active bets
        addActiveBet(activeBet);

        set({ isPlacingBet: false, error: null });

        return {
          betId: fakeBetId,
          remainingBalance: demoBalance - betAmount,
          bet: activeBet
        };
      }

      set({ isPlacingBet: true, error: null });

      // Call API endpoint to place bet from house balance
      const response = await fetch('/api/balance/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: formattedAddress,
          betAmount,
          roundId: Date.now(),
          targetPrice: currentPrice,
          isOver: direction === 'UP',
          multiplier: multiplier,
          targetCell: {
            id: 9, // Always use 9 for dynamic grid bets
            priceChange: target.priceChange,
            direction: direction,
            timeframe: durationSeconds,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place bet');
      }

      const data = await response.json();

      // Update house balance in store immediately
      if (data.remainingBalance !== undefined) {
        set({ houseBalance: data.remainingBalance } as any);
      }

      // Create ActiveBet object
      const activeBet: ActiveBet = {
        id: data.betId,
        mode: gameMode,
        asset: selectedAsset, // Set current asset
        amount: betAmount,
        multiplier: multiplier,
        direction: direction,
        timestamp: Date.now(),
        status: 'active',
        ...(gameMode === 'binomo' ? {
          strikePrice: currentPrice,
          endTime: Date.now() + (durationSeconds * 1000)
        } : (gameMode === 'perp' ? {
          entryPrice: currentPrice,
          leverage: multiplier,
          unrealizedPnL: 0
        } : {
          cellId: cellId || targetId
        }))
      };


      // Add to active bets (multiple bets can be active simultaneously)
      addActiveBet(activeBet);

      set({
        isPlacingBet: false,
        error: null
      });

      // Return bet info for UI
      return {
        betId: data.betId,
        remainingBalance: data.remainingBalance,
        bet: activeBet
      };
    } catch (error) {
      console.error("Error placing bet from house balance:", error);
      set({
        isPlacingBet: false,
        error: error instanceof Error ? error.message : "Failed to place bet"
      });
      throw error;
    }
  },

  /**
   * Close an open Perp position
   */
  closePerpPosition: async (betId: string, userAddress: string) => {
    const { activeBets, updateBalance } = get();
    const houseBalance = (get() as any).houseBalance;
    const position = activeBets.find((b: ActiveBet) => b.id === betId);

    if (!position || position.mode !== 'perp') return;

    try {
      const pnl = position.unrealizedPnL || 0;
      const totalToRefund = position.amount + pnl;

      set({ isSettling: true });

      // Call API to process the settlement
      const response = await fetch('/api/balance/win', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          winAmount: totalToRefund,
          betId: betId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to settle perp position");
      }

      const data = await response.json();

      // Update local state
      set((state: any) => ({
        activeBets: state.activeBets.filter((b: any) => b.id !== betId),
        settledBets: [{ ...position, status: 'settled', unrealizedPnL: pnl }, ...state.settledBets].slice(0, 50),
        houseBalance: data.newBalance || (state.houseBalance + totalToRefund),
        isSettling: false
      }));

    } catch (error) {
      console.error("Error closing perp position:", error);
      set({ isSettling: false, error: "Failed to close position" });
    }
  },

  /**
   * Settle an active round
   * Note: After migration, settlement is handled automatically by the instant-resolution system.
   * This method is kept for backward compatibility but does nothing.
   * @param betId - The unique bet ID to settle
   */
  settleRound: async (betId: string) => {
    console.log('settleRound called but is deprecated after migration');
    set({ isSettling: false });
  },

  /**
   * Update all prices at once
   */
  updateAllPrices: (prices: Record<string, number>) => {
    const { updatePrice } = get();
    Object.entries(prices).forEach(([asset, price]) => {
      updatePrice(price, asset as AssetType);
    });
  },

  /**
   * Update current price and add to history
   * @param price - New price in USD
   * @param asset - The asset being updated
   */
  updatePrice: (price: number, asset?: AssetType) => {
    const {
      priceHistory, selectedAsset, assetPrices, rawAssetPrices,
      activeBets, resolveBet, updateBalance, address, accountType, fetchBalance
    } = get();
    const currentSelectedAsset = (asset || selectedAsset) as AssetType;
    const now = Date.now();

    // Use RAW real-world prices (No amplification for hackathon)
    const finalPrice = price;

    // Update global asset prices
    const updatedAssetPrices = { ...assetPrices, [currentSelectedAsset]: finalPrice };
    const updatedRawPrices = { ...rawAssetPrices, [currentSelectedAsset]: price };

    // Primary update for the selected chart asset
    const newPoint: PricePoint = { timestamp: now, price: finalPrice };
    const currentAssetHistory = get().assetHistories[currentSelectedAsset] || [];
    const updatedHistory = [...currentAssetHistory, newPoint].slice(-MAX_PRICE_HISTORY);

    const updatedAssetHistories = {
      ...get().assetHistories,
      [currentSelectedAsset]: updatedHistory
    };

    if (currentSelectedAsset === selectedAsset) {
      set({
        currentPrice: finalPrice,
        priceHistory: updatedHistory,
        assetPrices: updatedAssetPrices,
        assetHistories: updatedAssetHistories,
        rawAssetPrices: updatedRawPrices
      });
    } else {
      set({
        assetPrices: updatedAssetPrices,
        assetHistories: updatedAssetHistories,
        rawAssetPrices: updatedRawPrices
      });
    }

    // RESOLUTION LOGIC: Check for expired bets for THIS specific asset
    if (!activeBets) return;

    activeBets.forEach((bet: ActiveBet) => {
      // Resolve bet if: mode is binomo, asset matches, status is active, and time has passed
      const betAsset = bet.asset || 'KAS'; // Fallback

      if (
        bet.mode === 'binomo' &&
        betAsset === currentSelectedAsset &&
        bet.endTime &&
        bet.strikePrice !== undefined &&
        now >= bet.endTime &&
        bet.status === 'active'
      ) {
        let won = false;
        if (bet.direction === 'UP') {
          won = finalPrice > bet.strikePrice;
        } else {
          won = finalPrice < bet.strikePrice;
        }

        const payout = won ? bet.amount * bet.multiplier : 0;

        // Play sound effects
        if (won) playWinSound();
        else playLoseSound();

        // Mark as settled and show result with asset info
        set({
          lastResult: {
            won,
            amount: bet.amount,
            payout,
            timestamp: now,
            asset: betAsset
          }
        });

        resolveBet(bet.id, won, payout);

        // Update real balance if necessary
        const isDemoMode = accountType === 'demo' || address?.startsWith('0xDEMO');

        if (!isDemoMode && address && won) {
          // Real mode - credit winnings via API
          fetch('/api/balance/win', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userAddress: address,
              winAmount: payout,
              betId: bet.id
            })
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.newBalance !== undefined) {
                set({ houseBalance: data.newBalance } as any);
              }
            } else {
              console.error('Failed to credit winnings');
            }
          }).catch(console.error);
        } else if (isDemoMode && won) {
          // Demo mode - update local balance
          updateBalance(payout, 'add');
        }
      }

      // Unrealized PnL calculation for Perp positions
      if (bet.mode === 'perp' && betAsset === currentSelectedAsset && bet.entryPrice && bet.status === 'active') {
        const priceDiff = finalPrice - bet.entryPrice;
        const priceChangePercent = priceDiff / bet.entryPrice;
        const pnl = bet.amount * priceChangePercent * (bet.leverage || 1) * (bet.direction === 'UP' ? 1 : -1);

        // Update the bet in the state (optimistic update for UI)
        set((state: GameState) => ({
          activeBets: state.activeBets.map(b => b.id === bet.id ? { ...b, unrealizedPnL: pnl } : b)
        }));

        // Simple Liquidation Check
        if (pnl <= -bet.amount * 0.95) { // 95% loss = liquidation
          resolveBet(bet.id, false, 0);
          playLoseSound();
        }
      }
    });
  },


  /**
   * Set active round (used by event listeners)
   * @param round - Active round data or null to clear
   */
  setActiveRound: (round: ActiveRound | null) => {
    set({ activeRound: round });
  },

  /**
   * Load target cells from configuration
   * Note: After migration, target cells are configured off-chain.
   * No blockchain query needed.
   */
  loadTargetCells: async () => {
    // Use default configuration (off-chain)
    set({ targetCells: DEFAULT_TARGET_CELLS });
  },

  /**
   * Add a new active bet (for instant-resolution system)
   * @param bet - The bet to add
   */
  addActiveBet: (bet: ActiveBet) => {
    const { activeBets } = get();
    set({ activeBets: [...activeBets, bet] });
  },

  /**
   * Resolve a bet (win or lose) and update house balance
   * @param betId - The bet ID to resolve
   * @param won - Whether the bet was won
   * @param payout - The payout amount if won
   */
  resolveBet: (betId: string, won: boolean, payout: number) => {
    const { activeBets, settledBets, currentPrice, address, network } = get();
    const resolvedBet = activeBets.find((b: ActiveBet) => b.id === betId);

    if (resolvedBet) {
      const settledBet = { ...resolvedBet, status: 'settled' as const };
      const now = Date.now();

      set({
        activeBets: activeBets.filter((b: ActiveBet) => b.id !== betId),
        settledBets: [settledBet, ...settledBets].slice(0, 50), // Keep last 50
        lastResult: { won, amount: resolvedBet.amount, payout, timestamp: now, asset: resolvedBet.asset }
      });

      // Also add to persistent local history store
      const anyGet = get() as any;
      if (anyGet.addBet) {
        anyGet.addBet({
          id: resolvedBet.id,
          timestamp: now,
          amount: resolvedBet.amount.toString(),
          won: won,
          payout: payout.toString(),
          startPrice: resolvedBet.strikePrice || 0,
          endPrice: currentPrice,
          actualChange: currentPrice - (resolvedBet.strikePrice || 0),
          target: {
            id: resolvedBet.cellId || 'classic',
            label: resolvedBet.mode === 'binomo' ? `${resolvedBet.direction} ${resolvedBet.multiplier}x` : `Box ${resolvedBet.multiplier}x`,
            multiplier: resolvedBet.multiplier,
            priceChange: 0,
            direction: resolvedBet.direction
          }
        });
      }

      // Save to Supabase for persistent history & leaderboard (non-blocking)
      if (address) {
        fetch('/api/bets/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: resolvedBet.id,
            walletAddress: address,
            asset: resolvedBet.asset || 'KAS',
            direction: resolvedBet.direction,
            amount: resolvedBet.amount,
            multiplier: resolvedBet.multiplier,
            strikePrice: resolvedBet.strikePrice || 0,
            endPrice: currentPrice,
            payout: payout,
            won: won,
            mode: resolvedBet.mode,
            network: network || 'KASPA_TESTNET',
          })
        }).catch(err => console.error('Failed to save bet to Supabase:', err));
      }
    }

    // Log resolution for debugging
    console.log(`Bet ${betId} resolved: ${won ? 'WON' : 'LOST'}, payout: ${payout}`);
  },

  /**
   * Clear the last result notification
   */
  clearLastResult: () => {
    set({ lastResult: null });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  // Blitz Actions
  enableBlitzAccess: () => {
    set({ hasBlitzAccess: true });
  },

  revokeBlitzAccess: () => {
    set({ hasBlitzAccess: false });
  },

  updateBlitzTimer: () => {
    const { isBlitzActive, blitzEndTime, nextBlitzTime } = get();
    const now = Date.now();
    const BLITZ_DURATION = 60 * 1000; // 1 minute
    const BLITZ_INTERVAL = 2 * 60 * 1000; // 2 minutes between blitzes

    if (isBlitzActive) {
      if (blitzEndTime && now >= blitzEndTime) {
        const newNextTime = now + BLITZ_INTERVAL;
        if (typeof window !== 'undefined') {
          localStorage.setItem('kasnomo_blitz_next', newNextTime.toString());
        }
        set({
          isBlitzActive: false,
          blitzEndTime: null,
          nextBlitzTime: newNextTime,
          hasBlitzAccess: false,
        });
      }
    } else {
      if (now >= nextBlitzTime) {
        const newNextTime = now + BLITZ_INTERVAL + BLITZ_DURATION;
        if (typeof window !== 'undefined') {
          localStorage.setItem('kasnomo_blitz_next', newNextTime.toString());
        }
        set({
          isBlitzActive: true,
          blitzEndTime: now + BLITZ_DURATION,
          nextBlitzTime: newNextTime,
        });
      }
    }
  },

  /**
   * Start global multi-asset price feed tracking
   */
  startGlobalPriceFeed: (updateAllPrices: (prices: Record<string, number>) => void) => {
    let stopFeedFn: (() => void) | null = null;
    let isActive = true;

    // Dynamically import to avoid circular dependencies if any
    import('@/lib/utils/priceFeed').then(({ startMultiPythPriceFeed }) => {
      if (!isActive) return;
      stopFeedFn = startMultiPythPriceFeed((prices) => {
        if (isActive) {
          updateAllPrices(prices);
        }
      });
    }).catch(err => {
      console.error('Failed to start multi-asset price feed:', err);
    });

    return () => {
      isActive = false;
      if (stopFeedFn) stopFeedFn();
    };
  }
});

