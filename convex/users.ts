import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getBalance = query({
    args: { user_address: v.string() },
    handler: async (ctx, args) => {
        const address = args.user_address.toLowerCase();
        const balanceRecord = await ctx.db
            .query("user_balances")
            .withIndex("by_user_address", (q) => q.eq("user_address", address))
            .unique();

        if (!balanceRecord) {
            return { balance: 0, updated_at: null };
        }
        return {
            balance: balanceRecord.balance,
            updated_at: balanceRecord.updated_at,
        };
    },
});

export const updateBalanceForDeposit = mutation({
    args: {
        user_address: v.string(),
        amount: v.number(),
        transaction_hash: v.optional(v.string()),
        operation_type: v.optional(v.string()), // 'deposit', 'faucet', etc.
    },
    handler: async (ctx, args) => {
        const address = args.user_address.toLowerCase();
        const now = Date.now();

        const existing = await ctx.db
            .query("user_balances")
            .withIndex("by_user_address", (q) => q.eq("user_address", address))
            .unique();

        const balanceBefore = existing ? existing.balance : 0;
        const balanceAfter = balanceBefore + args.amount;

        if (existing) {
            await ctx.db.patch(existing._id, {
                balance: balanceAfter,
                updated_at: now,
            });
        } else {
            await ctx.db.insert("user_balances", {
                user_address: address,
                balance: balanceAfter,
                created_at: now,
                updated_at: now,
            });
        }

        await ctx.db.insert("balance_audit_log", {
            user_address: address,
            operation_type: args.operation_type ?? "deposit",
            amount: args.amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            transaction_hash: args.transaction_hash,
            created_at: now,
        });

        return { success: true, new_balance: balanceAfter };
    },
});

export const deductBalanceForBet = mutation({
    args: {
        user_address: v.string(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const address = args.user_address.toLowerCase();
        const now = Date.now();

        const existing = await ctx.db
            .query("user_balances")
            .withIndex("by_user_address", (q) => q.eq("user_address", address))
            .unique();

        if (!existing || existing.balance < args.amount) {
            throw new Error("Insufficient balance");
        }

        const balanceBefore = existing.balance;
        const balanceAfter = balanceBefore - args.amount;

        await ctx.db.patch(existing._id, {
            balance: balanceAfter,
            updated_at: now,
        });

        await ctx.db.insert("balance_audit_log", {
            user_address: address,
            operation_type: "bet_placed",
            amount: args.amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            created_at: now,
        });

        return { success: true, new_balance: balanceAfter };
    },
});

export const creditBalanceForPayout = mutation({
    args: {
        user_address: v.string(),
        amount: v.number(),
        bet_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const address = args.user_address.toLowerCase();
        const now = Date.now();

        const existing = await ctx.db
            .query("user_balances")
            .withIndex("by_user_address", (q) => q.eq("user_address", address))
            .unique();

        const balanceBefore = existing ? existing.balance : 0;
        const balanceAfter = balanceBefore + args.amount;

        if (existing) {
            await ctx.db.patch(existing._id, {
                balance: balanceAfter,
                updated_at: now,
            });
        } else {
            await ctx.db.insert("user_balances", {
                user_address: address,
                balance: balanceAfter,
                created_at: now,
                updated_at: now,
            });
        }

        await ctx.db.insert("balance_audit_log", {
            user_address: address,
            operation_type: "bet_won",
            amount: args.amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            bet_id: args.bet_id,
            created_at: now,
        });

        return { success: true, new_balance: balanceAfter };
    },
});

export const updateBalanceForWithdrawal = mutation({
    args: {
        user_address: v.string(),
        amount: v.number(),
        transaction_hash: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const address = args.user_address.toLowerCase();
        const now = Date.now();

        const existing = await ctx.db
            .query("user_balances")
            .withIndex("by_user_address", (q) => q.eq("user_address", address))
            .unique();

        if (!existing || existing.balance < args.amount) {
            throw new Error("Insufficient balance");
        }

        const balanceBefore = existing.balance;
        const balanceAfter = balanceBefore - args.amount;

        await ctx.db.patch(existing._id, {
            balance: balanceAfter,
            updated_at: now,
        });

        await ctx.db.insert("balance_audit_log", {
            user_address: address,
            operation_type: "withdrawal",
            amount: args.amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            transaction_hash: args.transaction_hash,
            created_at: now,
        });

        return { success: true, new_balance: balanceAfter };
    },
});
