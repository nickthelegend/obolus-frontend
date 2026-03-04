/**
 * POST /api/balance/bet endpoint
 * 
 * Called when user places a bet from house balance via Convex.
 * Validates sufficient balance and deducts bet amount atomically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';

interface BetRequest {
  userAddress: string;
  betAmount: number;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: BetRequest = await request.json();
    const { userAddress, betAmount } = body;

    // Validate required fields
    if (!userAddress || betAmount === undefined || betAmount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, betAmount' },
        { status: 400 }
      );
    }

    // Validate bet amount is positive
    if (betAmount <= 0) {
      return NextResponse.json(
        { error: 'Bet amount must be greater than zero' },
        { status: 400 }
      );
    }

    try {
      // Deduct balance atomically via Convex
      const result = await convex.mutation(api.users.deductBalanceForBet, {
        user_address: userAddress,
        amount: betAmount
      });

      // Generate a bet ID for the response
      const betId = `bet_${Date.now()}_${userAddress.slice(-6)}`;

      // Return success with remaining balance and bet ID
      return NextResponse.json({
        success: true,
        remainingBalance: result.new_balance,
        betId,
      });

    } catch (error: any) {
      console.error('Error in Convex deductBalanceForBet:', error);
      if (error.message.includes("Insufficient balance")) {
        return NextResponse.json({ error: 'Insufficient house balance' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to place bet. Please try again.' }, { status: 500 });
    }
  } catch (error: any) {
    // Handle unexpected errors
    console.error('Unexpected error in POST /api/balance/bet:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}

