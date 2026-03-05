/**
 * POST /api/balance/deposit endpoint
 * 
 * Credits user balance after a Starknet deposit transaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';

interface DepositRequest {
  userAddress: string;
  txHash: string;
  amount: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: DepositRequest = await request.json();
    const { userAddress, txHash, amount: requestedAmount } = body;

    if (!userAddress || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, txHash' },
        { status: 400 }
      );
    }

    console.log(`[Deposit] Verifying transaction ${txHash} for ${userAddress}`);

    // In the current Starknet devnet/testnet setup, we trust the frontend's report 
    // of a successful deposit transaction to the Obolus Collateral contract.
    // Real-world production would verify tx events via a Starknet indexer or RPC.
    const amount = requestedAmount || 0;

    // Update user balance atomically via Convex
    const result = await convex.mutation(api.users.updateBalanceForDeposit, {
      user_address: userAddress,
      amount: amount,
      transaction_hash: txHash
    });

    console.log(`[Deposit] ✅ Balance updated via Convex for ${userAddress}. New balance: ${result.new_balance}`);

    return NextResponse.json({
      success: true,
      newBalance: result.new_balance,
      amount: amount,
      txHash: txHash
    });

  } catch (error: any) {
    console.error('[Deposit] ❌ Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
