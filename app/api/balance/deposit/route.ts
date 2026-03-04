/**
 * POST /api/balance/deposit endpoint
 * 
 * Verifies a real Kaspa blockchain transaction and credits user balance
 * User must first send KAS to treasury address, then call this endpoint with txHash
 */

import { NextRequest, NextResponse } from 'next/server';
import { convex, api } from '@/lib/convex-client';
import { ethers } from 'ethers';
import { getTransaction } from '@/lib/kaspa/rpc';

interface DepositRequest {
  userAddress: string;
  txHash: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DepositRequest = await request.json();
    const { userAddress, txHash } = body;

    if (!userAddress || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, txHash' },
        { status: 400 }
      );
    }

    // Validate address format
    const isKaspaAddress = userAddress.startsWith('kaspa:') || userAddress.startsWith('kaspatest:');
    const isEVMAddress = ethers.isAddress(userAddress);

    if (!isKaspaAddress && !isEVMAddress) {
      return NextResponse.json(
        { error: 'Invalid wallet address format (Kaspa or EVM required)' },
        { status: 400 }
      );
    }

    console.log(`[Deposit] Verifying transaction ${txHash} for ${userAddress}`);

    // Verify transaction on blockchain (only for Kaspa addresses)
    let amount = 0;

    if (isKaspaAddress) {
      console.log(`[Deposit] Verifying Kaspa blockchain transaction...`);

      const treasuryAddress = process.env.NEXT_PUBLIC_KASPA_TREASURY_ADDRESS;
      if (!treasuryAddress) {
        throw new Error('Treasury address not configured');
      }

      // Get transaction from blockchain (retry with delay — tx may not be indexed yet)
      let txInfo = await getTransaction(txHash);

      if (!txInfo) {
        console.log(`[Deposit] Transaction not found yet, retrying with delays...`);
        for (let attempt = 1; attempt <= 5; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3 seconds
          console.log(`[Deposit] Retry attempt ${attempt}/5 for tx ${txHash}`);
          txInfo = await getTransaction(txHash);
          if (txInfo) break;
        }
      }

      if (!txInfo) {
        return NextResponse.json(
          { error: 'Transaction not found on blockchain. It may still be processing — please try again in a few seconds.' },
          { status: 404 }
        );
      }

      // Find output to treasury address
      let depositAmountSompi = 0n;

      if (txInfo.outputs) {
        for (const output of txInfo.outputs) {
          const outputAddress = output.script_public_key_address;
          if (outputAddress === treasuryAddress) {
            depositAmountSompi += BigInt(output.amount);
          }
        }
      }

      if (depositAmountSompi === 0n) {
        return NextResponse.json(
          { error: 'No deposit found to treasury address in this transaction' },
          { status: 400 }
        );
      }

      // Convert sompi to KAS (1 KAS = 100,000,000 sompi)
      amount = Number(depositAmountSompi) / 100_000_000;
      console.log(`[Deposit] ✅ Verified deposit: ${amount} KAS`);

    } else {
      return NextResponse.json(
        { error: 'EVM deposit verification not yet implemented' },
        { status: 501 }
      );
    }

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

