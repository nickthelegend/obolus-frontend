import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';
import { normalizeAddress } from '@/lib/utils/address';

interface FaucetRequest {
    userAddress: string;
    amount: number;
}

/**
 * USDT Faucet API
 * Distributes testnet USDT (simulated via house balance) via Convex
 */
export async function POST(request: NextRequest) {
    try {
        const body: FaucetRequest = await request.json();
        const userAddress = normalizeAddress(body.userAddress);
        const { amount } = body;

        if (!userAddress) {
            return NextResponse.json(
                { error: 'Missing userAddress' },
                { status: 400 }
            );
        }

        const faucetAmount = amount || 1000;
        console.log(`[Faucet] Processing ${faucetAmount} USDT for ${userAddress} via Convex`);

        try {
            // Update balance atomically via Convex
            const result = await convex.mutation(api.users.updateBalanceForDeposit, {
                user_address: userAddress,
                amount: faucetAmount,
                operation_type: 'faucet',
                transaction_hash: `faucet-${Date.now()}`
            });

            return NextResponse.json({
                success: true,
                newBalance: result.new_balance,
                amount: faucetAmount,
                message: 'Balance updated in Convex'
            });

        } catch (dbError: any) {
            console.warn('[Faucet] Convex operation failed:', dbError);

            return NextResponse.json({
                success: false,
                error: dbError.message || 'Database operation failed'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[Faucet] ❌ Fatal error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

