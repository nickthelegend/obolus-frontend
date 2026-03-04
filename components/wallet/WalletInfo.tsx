import React from 'react';
import { Card } from '@/components/ui/Card';
import { useStore } from '@/lib/store';
import { useBalance, useAccount } from '@starknet-react/core';

export const WalletInfo: React.FC = () => {
  const { address } = useAccount();
  const isConnected = !!address;

  // Real on-chain balance using Starknet React
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: address as `0x${string}`,
    token: process.env.NEXT_PUBLIC_USDT_CONTRACT as `0x${string}`,
    watch: true,
    refetchInterval: 5000
  });

  if (!isConnected || !address) {
    return null;
  }

  // Format address
  const formatAddress = (addr: string) => {
    if (addr.length <= 15) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const currencySymbol = 'USDT';
  const networkName = 'Starknet';
  const balance = balanceData ? parseFloat(balanceData.formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

  return (
    <Card className="min-w-[200px] border border-white/10 !bg-black/40 backdrop-blur-md">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center p-1 border border-white/10 shrink-0">
            <img
              src="https://starknet.io/wp-content/uploads/2022/10/starknet-logo-1.png"
              alt={networkName}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">{networkName} Address</p>
            <p className="text-white font-mono text-[11px] leading-tight">{formatAddress(address)}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">{currencySymbol} Balance</p>
          <div className="flex items-center gap-2">
            <p className="text-stark-orange font-bold text-lg font-mono drop-shadow-[0_0_8px_rgba(228,65,52,0.5)]">
              {balance}
            </p>
            <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">{currencySymbol}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
