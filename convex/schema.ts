import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    user_balances: defineTable({
        user_address: v.string(), // Normalized to lowercase
        balance: v.number(),
        updated_at: v.number(), // Timestamp in ms
        created_at: v.number(), // Timestamp in ms
    }).index("by_user_address", ["user_address"]),

    bet_history: defineTable({
        id: v.string(), // The external ID (e.g., from frontend or Starknet)
        wallet_address: v.string(),
        asset: v.string(),
        direction: v.string(),
        amount: v.number(),
        multiplier: v.number(),
        strike_price: v.number(),
        end_price: v.number(),
        payout: v.number(),
        won: v.boolean(),
        mode: v.string(),
        network: v.string(),
        resolved_at: v.number(),
        created_at: v.number(),
    })
        .index("by_external_id", ["id"])
        .index("by_wallet", ["wallet_address", "resolved_at"])
        .index("by_leaderboard", ["won", "payout"]),

    balance_audit_log: defineTable({
        user_address: v.string(),
        operation_type: v.string(), // 'deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost'
        amount: v.number(),
        balance_before: v.number(),
        balance_after: v.number(),
        transaction_hash: v.optional(v.string()),
        bet_id: v.optional(v.string()),
        created_at: v.number(),
    }).index("by_user", ["user_address"]),
});
