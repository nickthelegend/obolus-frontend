/**
 * API Route: Fetch bet history for a wallet
 * GET /api/bets/history?wallet=0x...&limit=50
 */

import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const wallet = searchParams.get('wallet');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
        }

        const data = await convex.query(api.bets.getBetHistory, {
            wallet_address: wallet.toLowerCase(),
            limit
        });

        return NextResponse.json({ bets: data || [] });
    } catch (error: any) {
        console.error('Error fetching bet history from Convex:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

