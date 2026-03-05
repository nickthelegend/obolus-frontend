/**
 * POST /api/balance/win endpoint
 * 
 * Credits winning amount to user's house balance via Convex.
 * Called when a bet is won in the instant-resolution system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';

interface WinRequest {
    userAddress: string;
    winAmount: number;
    betId: string;
}

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body: WinRequest = await request.json();
        const { userAddress, winAmount, betId } = body;

        // Validate required fields
        if (!userAddress || winAmount === undefined || winAmount === null) {
            return NextResponse.json(
                { error: 'Missing required fields: userAddress, winAmount' },
                { status: 400 }
            );
        }

        // Validate win amount is not negative
        if (winAmount < 0) {
            return NextResponse.json(
                { error: 'Win amount cannot be negative' },
                { status: 400 }
            );
        }

        // Credit balance atomically via Convex
        const result = await convex.mutation(api.users.creditBalanceForPayout, {
            user_address: userAddress,
            amount: winAmount,
            bet_id: betId
        });

        // Return success with new balance
        return NextResponse.json({
            success: true,
            newBalance: result.new_balance,
            winAmount: winAmount
        });

    } catch (error: any) {
        console.error('Unexpected error in POST /api/balance/win for Convex:', error);
        return NextResponse.json(
            { error: error.message || 'An error occurred processing your request' },
            { status: 500 }
        );
    }
}

