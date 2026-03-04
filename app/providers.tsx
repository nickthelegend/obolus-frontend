'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useOverflowStore } from '@/lib/store';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Starknet Imports
import { mainnet, sepolia } from "@starknet-react/chains";
import {
  StarknetConfig,
  argent,
  braavos,
  useInjectedConnectors,
  jsonRpcProvider
} from "@starknet-react/core";

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  const { connectors } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: "always",
    order: "alphabetical"
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let balanceInterval: NodeJS.Timeout;

    const init = async () => {
      const { initializeStore, useOverflowStore } = await import('@/lib/store');
      await initializeStore();
      setIsReady(true);

      // Background polling for Convex balance sync
      balanceInterval = setInterval(async () => {
        const state = useOverflowStore.getState();
        if (state.address && state.isConnected) {
          await state.fetchBalance(state.address);
        }
      }, 10000);
    };

    init();

    return () => {
      const { cleanupStore } = require('@/lib/store');
      cleanupStore();
      if (balanceInterval) clearInterval(balanceInterval);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <StarknetConfig
      chains={[sepolia]}
      provider={jsonRpcProvider({ rpc: () => ({ nodeUrl: "http://127.0.0.1:5050/rpc" }) })}
      connectors={connectors}
      autoConnect
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastProvider />
      </QueryClientProvider>
    </StarknetConfig>
  );
}

