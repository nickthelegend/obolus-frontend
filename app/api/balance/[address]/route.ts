import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Query user_balances from Convex
    const data = await convex.query(api.users.getBalance, { user_address: address });

    // Handle database errors or missing record
    if (!data || data.updated_at === null) {
      return NextResponse.json({
        balance: 0,
        updatedAt: null,
        tier: 'free'
      });
    }

    // Return balance and updated_at timestamp
    return NextResponse.json({
      balance: data.balance,
      updatedAt: data.updated_at,
      tier: 'free'
    });
  } catch (error: any) {
    // Handle unexpected errors
    console.error('Unexpected error in GET /api/balance/[address]:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}

