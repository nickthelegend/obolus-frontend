/**
 * POST /api/balance/payout endpoint
 * 
 * Called when a round settles and user wins via Convex.
 * Credits payout amount to user's house balance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';

interface PayoutRequest {
  userAddress: string;
  payoutAmount: number;
  betId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PayoutRequest = await request.json();
    const { userAddress, payoutAmount, betId } = body;

    // Validate required fields
    if (!userAddress || payoutAmount === undefined || payoutAmount === null || !betId) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, payoutAmount, betId' },
        { status: 400 }
      );
    }

    // Validate payout amount is positive
    if (payoutAmount <= 0) {
      return NextResponse.json(
        { error: 'Payout amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Credit balance atomically via Convex
    const result = await convex.mutation(api.users.creditBalanceForPayout, {
      user_address: userAddress,
      amount: payoutAmount,
      bet_id: betId
    });

    // Return success with new balance
    return NextResponse.json({
      success: true,
      newBalance: result.new_balance,
    });
  } catch (error: any) {
    // Handle unexpected errors
    console.error('Unexpected error in POST /api/balance/payout for Convex:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}

