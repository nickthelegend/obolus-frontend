/**
 * Wallet state slice for Zustand store
 * Manages wallet connection status and address
 */

import { StateCreator } from "zustand";

export interface WalletState {
  // State
  address: string | null;
  walletBalance: number;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isConnectModalOpen: boolean;
  network: string;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
  setConnectModalOpen: (open: boolean) => void;
  refreshWalletBalance: () => Promise<void>;

  // Setters for wallet integration
  setAddress: (address: string | null) => void;
  setIsConnected: (connected: boolean) => void;
}

/**
 * Create wallet slice for Zustand store
 */
export const createWalletSlice: StateCreator<WalletState> = (set, get) => ({
  // Initial state
  address: null,
  walletBalance: 0,
  isConnected: false,
  isConnecting: false,
  error: null,
  isConnectModalOpen: false,
  network: 'STARKNET',

  /**
   * Connect wallet
   */
  connect: async () => {
    set({ isConnectModalOpen: true });
  },

  /**
   * Disconnect wallet
   */
  disconnect: () => {
    // Reset state
    set({
      address: null,
      walletBalance: 0,
      isConnected: false,
      isConnecting: false,
      error: null
    });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Set connect modal visibility
   */
  setConnectModalOpen: (open: boolean) => {
    set({ isConnectModalOpen: open });
  },

  /**
   * Set address
   */
  setAddress: (address: string | null) => {
    set({ address });
  },

  /**
   * Set connected status
   */
  setIsConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  /**
   * Refresh wallet balance
   * Note: This is now a stub as balance is ideally handled by starknet-react
   */
  refreshWalletBalance: async () => {
    // Stub for compatibility with components
    console.log("Refreshing wallet balance...");
  },
});
