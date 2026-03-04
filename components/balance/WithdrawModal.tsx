'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useOverflowStore } from '@/lib/store';
import { useToast } from '@/lib/hooks/useToast';
import { useAccount } from '@starknet-react/core';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number, txHash: string) => void;
  onError?: (error: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  const { withdrawFunds, houseBalance, refreshWalletBalance } = useOverflowStore();
  const { address } = useAccount();
  const toast = useToast();

  const currencySymbol = 'USDT';
  const networkName = 'Starknet Devnet';

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError(null);
      setIsLoading(false);
      setSuccessTx(null);
    }
  }, [isOpen]);

  const validateAmount = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Please enter an amount';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }

    if (numValue <= 0) {
      return 'Amount must be greater than zero';
    }

    if (numValue > houseBalance) {
      return 'Insufficient house balance';
    }

    return null;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleMaxClick = () => {
    if (houseBalance > 0) {
      setAmount(houseBalance.toString());
      setError(null);
    }
  };

  const handleWithdraw = async () => {
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const withdrawAmount = parseFloat(amount);
      toast.info('Processing withdrawal...');

      // Call the withdrawal store action (which calls the backend)
      const result = await withdrawFunds(address, withdrawAmount);

      // Refresh balances
      refreshWalletBalance();

      console.log('Withdrawal successful:', result.txHash);
      setSuccessTx(result.txHash);

      toast.success(
        `Successfully withdrew ${withdrawAmount.toLocaleString()} ${currencySymbol}!`
      );

      if (onSuccess) onSuccess(withdrawAmount, result.txHash);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      const errorMessage = err.message || 'Failed to withdraw funds';
      setError(errorMessage);
      toast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (successTx) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Withdrawal Successful"
      >
        <div className="text-center py-4 space-y-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/50 relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">Withdrawal Initiated</h3>
            <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">Funds are being transferred</p>
          </div>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex flex-col items-center gap-1.5 font-mono">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Transaction Hash</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-stark-orange font-medium">{successTx.slice(0, 10)}...{successTx.slice(-10)}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onClose}
            variant="primary"
            className="w-full bg-white text-black hover:bg-gray-200 border-none h-12 text-sm font-black uppercase tracking-widest"
          >
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Withdraw ${currencySymbol}`}
      showCloseButton={!isLoading}
    >
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-stark-orange/10 to-red-500/10 border border-stark-orange/30 rounded-lg p-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-stark-orange/20 text-stark-orange text-[8px] font-bold uppercase tracking-tighter rounded-bl-lg">
            {networkName}
          </div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-mono">
            Available to Withdraw
          </p>
          <div className="flex items-center gap-2">
            <img
              src="https://starknet.io/wp-content/uploads/2022/10/starknet-logo-1.png"
              alt="Starknet"
              className="w-4 h-4 object-contain"
            />
            <p className="text-white text-xl font-bold font-mono">
              {houseBalance.toLocaleString()} {currencySymbol}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="withdraw-amount" className="text-gray-400 text-xs font-mono uppercase">Amount to Withdraw</label>
          <div className="relative">
            <input
              id="withdraw-amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={isLoading}
              className={`
                w-full px-4 py-3 bg-black/50 border rounded-lg text-lg
                text-white font-mono
                focus:outline-none focus:ring-1 focus:ring-stark-orange
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-white/10'}
              `}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
              {currencySymbol}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleMaxClick}
              disabled={isLoading || houseBalance === 0}
              className="text-[10px] text-stark-orange hover:text-red-400 font-mono disabled:opacity-50 transition-colors uppercase tracking-wider"
            >
              Withdraw All
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg px-3 py-2">
            <p className="text-red-400 text-xs font-mono">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            variant="primary"
            className="flex-1"
            disabled={isLoading || !amount || parseFloat(amount || '0') <= 0}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing</span>
              </span>
            ) : (
              `Withdraw ${currencySymbol}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
