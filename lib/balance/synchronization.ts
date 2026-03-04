/**
 * Balance Synchronization Module
 * 
 * This module provides functions to check and maintain synchronization between
 * the Convex user_balances table and the blockchain treasury.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { convex, api } from '../convex-client';

/**
 * Result of a synchronization check
 */
export interface SyncCheckResult {
  /** Whether the balances are synchronized */
  synchronized: boolean;
  /** Total balance in Convex user_balances table */
  convexTotal: number;
  /** Total balance in the treasury on-chain */
  escrowVaultBalance: number;
  /** Discrepancy amount (escrowVaultBalance - convexTotal) */
  discrepancy: number;
  /** Timestamp of the check */
  timestamp: Date;
  /** Error message if check failed */
  error?: string;
}

/**
 * Check synchronization between Convex and blockchain treasury
 * 
 * @param contractAddress - The blockchain address of the treasury contract
 * @returns SyncCheckResult containing synchronization status and details
 */
export async function checkBalanceSynchronization(
  contractAddress: string
): Promise<SyncCheckResult> {
  const timestamp = new Date();

  try {
    // Query all balances from Convex
    // Note: In a large system, we'd use a dedicated aggregation query/mutation
    // For now, we'll fetch all and sum (assuming reasonable user count for this project)
    const balances = await convex.query(api.bets.getLeaderboard, { limit: 1000 });

    // Calculate total from Convex
    const convexTotal = balances?.reduce((sum, row) => sum + (row.balance || 0), 0) || 0;

    // TODO: Query blockchain treasury balance
    console.warn('checkBalanceSynchronization: Blockchain integration pending');

    return {
      synchronized: true,
      convexTotal,
      escrowVaultBalance: convexTotal, // Stub: assume synchronized
      discrepancy: 0,
      timestamp,
      error: 'Blockchain integration pending'
    };
  } catch (error: any) {
    console.error('Unexpected error in checkBalanceSynchronization:', error);
    return {
      synchronized: false,
      convexTotal: 0,
      escrowVaultBalance: 0,
      discrepancy: 0,
      timestamp,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Result of a user balance reconciliation
 */
export interface ReconcileResult {
  /** Whether reconciliation was successful */
  success: boolean;
  /** User's address */
  userAddress: string;
  /** Balance before reconciliation */
  oldBalance: number;
  /** Balance after reconciliation (from blockchain) */
  newBalance: number;
  /** Discrepancy that was corrected */
  discrepancy: number;
  /** Timestamp of reconciliation */
  timestamp: Date;
  /** Error message if reconciliation failed */
  error?: string;
}

/**
 * Reconcile a single user's balance with the blockchain
 * 
 * @param userAddress - The user's wallet address
 * @param dryRun - If true, only check discrepancy without updating
 * @returns ReconcileResult containing reconciliation details
 */
export async function reconcileUserBalance(
  userAddress: string,
  dryRun: boolean = false
): Promise<ReconcileResult> {
  const timestamp = new Date();

  try {
    // Query user's current balance from Convex
    const userData = await convex.query(api.users.getBalance, { user_address: userAddress });

    if (!userData) {
      return {
        success: false,
        userAddress,
        oldBalance: 0,
        newBalance: 0,
        discrepancy: 0,
        timestamp,
        error: `User balance record not found in Convex`
      };
    }

    const oldBalance = userData.balance;

    // TODO: Query user's balance from blockchain
    console.warn('reconcileUserBalance: Blockchain integration pending');

    return {
      success: true,
      userAddress,
      oldBalance,
      newBalance: oldBalance, // Stub: assume no discrepancy
      discrepancy: 0,
      timestamp,
      error: dryRun ? 'Dry run - Blockchain integration pending' : 'Blockchain integration pending'
    };
  } catch (error: any) {
    console.error('Unexpected error in reconcileUserBalance:', error);
    return {
      success: false,
      userAddress,
      oldBalance: 0,
      newBalance: 0,
      discrepancy: 0,
      timestamp,
      error: error.message || 'Unknown error'
    };
  }
}


/**
 * Reconcile all users' balances with the blockchain
 * 
 * @param dryRun - If true, only check discrepancies without updating
 * @param discrepancyThreshold - Only reconcile if discrepancy exceeds this amount
 * @returns Array of ReconcileResult for each user
 */
export async function reconcileAllUsers(
  dryRun: boolean = false,
  discrepancyThreshold: number = 0.00000001
): Promise<ReconcileResult[]> {
  try {
    // Query all users from Convex
    const users = await convex.query(api.bets.getLeaderboard, { limit: 1000 });

    // Reconcile each user
    const results: ReconcileResult[] = [];
    for (const user of users || []) {
      const result = await reconcileUserBalance(user.wallet_address, dryRun);

      // Only include users with discrepancies above threshold
      if (Math.abs(result.discrepancy) >= discrepancyThreshold) {
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Unexpected error in reconcileAllUsers:', error);
    return [];
  }
}
