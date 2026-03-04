/**
 * API Route: Save a bet result to Convex
 * POST /api/bets/save
 */

import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            id,
            walletAddress,
            asset,
            direction,
            amount,
            multiplier,
            strikePrice,
            endPrice,
            payout,
            won,
            mode,
            network,
        } = body;

        if (!id || !walletAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await convex.mutation(api.bets.saveBet, {
            id,
            walletAddress: walletAddress.toLowerCase(),
            asset: asset || 'BNB',
            direction: direction || 'UP',
            amount: parseFloat(amount) || 0,
            multiplier: parseFloat(multiplier) || 1.9,
            strikePrice: parseFloat(strikePrice) || 0,
            endPrice: parseFloat(endPrice) || 0,
            payout: parseFloat(payout) || 0,
            won: !!won,
            mode: mode || 'binomo',
            network: network || 'BNB',
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving bet to Convex:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

