
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/client';

interface FaucetRequest {
    userAddress: string;
    amount: number;
}

/**
 * USDT Faucet API
 * Distributes testnet USDT (simulated via house balance)
 * Returns success even if DB fails to allow local demo flow
 */
export async function POST(request: NextRequest) {
    try {
        const body: FaucetRequest = await request.json();
        const { userAddress, amount } = body;

        if (!userAddress) {
            return NextResponse.json(
                { error: 'Missing userAddress' },
                { status: 400 }
            );
        }

        const faucetAmount = amount || 1000;
        console.log(`[Faucet] Processing ${faucetAmount} USDT for ${userAddress}`);

        try {
            // 1. Fetch current balance
            const { data: existingData, error: fetchError } = await supabase
                .from('user_balances')
                .select('balance')
                .eq('user_address', userAddress)
                .single();

            const currentBalance = existingData ? parseFloat(existingData.balance) : 0;
            const newBalance = currentBalance + faucetAmount;

            // 2. Update balance
            if (existingData) {
                await supabase
                    .from('user_balances')
                    .update({
                        balance: newBalance,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_address', userAddress);
            } else {
                await supabase
                    .from('user_balances')
                    .insert({
                        user_address: userAddress,
                        balance: newBalance,
                        updated_at: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    });
            }

            // 3. Log audit
            await supabase
                .from('balance_audit_log')
                .insert({
                    user_address: userAddress,
                    operation_type: 'faucet',
                    amount: faucetAmount,
                    balance_before: currentBalance,
                    balance_after: newBalance,
                    transaction_hash: `faucet-${Date.now()}`
                });

            return NextResponse.json({
                success: true,
                newBalance: newBalance,
                amount: faucetAmount,
                message: 'Balance updated in database'
            });

        } catch (dbError) {
            console.warn('[Faucet] Database operation failed, falling back to success response for local demo:', dbError);

            // Return success anyway so frontend can do optimistic update
            return NextResponse.json({
                success: true,
                newBalance: 1000, // Placeholder
                amount: faucetAmount,
                warning: 'Local-only update (DB Unavailable)'
            });
        }

    } catch (error: any) {
        console.error('[Faucet] ❌ Fatal error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
