import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getBetHistory = query({
    args: { wallet_address: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const address = args.wallet_address.toLowerCase();
        const limit = args.limit ?? 50;

        return await ctx.db
            .query("bet_history")
            .withIndex("by_wallet", (q) => q.eq("wallet_address", address))
            .order("desc")
            .take(limit);
    },
});

export const getLeaderboard = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        return await ctx.db
            .query("bet_history")
            .withIndex("by_leaderboard", (q) => q.eq("won", true))
            .order("desc")
            .take(limit);
    },
});

export const saveBet = mutation({
    args: {
        id: v.string(),
        walletAddress: v.string(),
        asset: v.string(),
        direction: v.string(),
        amount: v.number(),
        multiplier: v.number(),
        strikePrice: v.number(),
        endPrice: v.number(),
        payout: v.number(),
        won: v.boolean(),
        mode: v.string(),
        network: v.string(),
    },
    handler: async (ctx, args) => {
        const address = args.walletAddress.toLowerCase();
        const now = Date.now();

        const existing = await ctx.db
            .query("bet_history")
            .withIndex("by_external_id", (q) => q.eq("id", args.id))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                wallet_address: address,
                asset: args.asset,
                direction: args.direction,
                amount: args.amount,
                multiplier: args.multiplier,
                strike_price: args.strikePrice,
                end_price: args.endPrice,
                payout: args.payout,
                won: args.won,
                mode: args.mode,
                network: args.network,
                resolved_at: now,
            });
            return { success: true, id: existing._id };
        } else {
            const newId = await ctx.db.insert("bet_history", {
                id: args.id,
                wallet_address: address,
                asset: args.asset,
                direction: args.direction,
                amount: args.amount,
                multiplier: args.multiplier,
                strike_price: args.strikePrice,
                end_price: args.endPrice,
                payout: args.payout,
                won: args.won,
                mode: args.mode,
                network: args.network,
                resolved_at: now,
                created_at: now,
            });
            return { success: true, id: newId };
        }
    },
});
