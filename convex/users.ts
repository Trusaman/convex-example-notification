import { v } from "convex/values";
import {
    query,
    mutation,
    action,
    internalQuery,
    internalMutation,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { retrieveAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Get current user profile
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const authUser = await ctx.db.get(userId);
        if (!authUser) {
            return null;
        }

        // Check if user exists in our profiles table
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
            .first();

        return profile;
    },
});

// Create or update user profile
export const createOrUpdateUser = mutation({
    args: {
        email: v.string(),
        name: v.string(),
        role: v.union(
            v.literal("sales"),
            v.literal("accountant"),
            v.literal("warehouse_manager"),
            v.literal("shipper"),
            v.literal("admin")
        ),
        targetUserId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const currentProfile = await ctx.db
            .query("profiles")
            .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
            .first();

        // If updating another user, must be admin
        if (args.targetUserId && args.targetUserId !== userId) {
            if (!currentProfile || currentProfile.role !== "admin") {
                throw new Error("Only admins can manage other users");
            }
        }

        // Prevent admins from accidentally updating their own profile when trying to create a new user
        if (!args.targetUserId && currentProfile?.role === "admin") {
            const authUser = await ctx.db.get(userId);
            const currentEmail =
                (authUser as any)?.email ?? currentProfile.email;
            if (args.email !== currentEmail) {
                throw new Error(
                    "Admins cannot change their own profile email to another user's email. Use adminCreateUser instead."
                );
            }
        }

        const targetUserId = args.targetUserId || userId;
        const existingProfile = await ctx.db
            .query("profiles")
            .withIndex("by_user_id", (q: any) => q.eq("userId", targetUserId))
            .first();

        if (existingProfile) {
            await ctx.db.patch(existingProfile._id, {
                email: args.email,
                name: args.name,
                role: args.role,
            });
            return existingProfile._id;
        } else {
            return await ctx.db.insert("profiles", {
                userId: targetUserId,
                email: args.email,
                name: args.name,
                role: args.role,
            });
        }
    },
});

// Internal helpers for admin user creation flow
export const _getCurrentProfile = internalQuery({
    args: {},
    handler: async (ctx) => {
        const uid = await getAuthUserId(ctx);
        if (!uid) return null;
        return await ctx.db
            .query("profiles")
            .withIndex("by_user_id", (q: any) => q.eq("userId", uid))
            .first();
    },
});

export const _upsertProfile = internalMutation({
    args: {
        userId: v.id("users"),
        email: v.string(),
        name: v.string(),
        role: v.union(
            v.literal("sales"),
            v.literal("accountant"),
            v.literal("warehouse_manager"),
            v.literal("shipper"),
            v.literal("admin")
        ),
    },
    handler: async (ctx, args) => {
        const existingProfile = await ctx.db
            .query("profiles")
            .withIndex("by_user_id", (q: any) => q.eq("userId", args.userId))
            .first();

        if (existingProfile) {
            await ctx.db.patch(existingProfile._id, {
                email: args.email,
                name: args.name,
                role: args.role,
            });
            return existingProfile._id;
        }
        return await ctx.db.insert("profiles", {
            userId: args.userId,
            email: args.email,
            name: args.name,
            role: args.role,
        });
    },
});

// Admin: Create a brand new auth user and corresponding profile
export const adminCreateUser = action({
    args: {
        email: v.string(),
        name: v.string(),
        password: v.string(),
        role: v.union(
            v.literal("sales"),
            v.literal("accountant"),
            v.literal("warehouse_manager"),
            v.literal("shipper"),
            v.literal("admin")
        ),
    },
    handler: async (
        ctx,
        args
    ): Promise<{ profileId: Id<"profiles">; temporaryPassword?: string }> => {
        const currentProfile = await ctx.runQuery(
            internal.users._getCurrentProfile,
            {}
        );
        if (!currentProfile || currentProfile.role !== "admin") {
            throw new Error("Only admins can create users");
        }

        let userId: Id<"users"> | undefined;
        let temporaryPassword: string | undefined;

        const email = args.email.trim().toLowerCase();
        const password = args.password.trim();

        if (!password) {
            throw new Error("Password is required");
        }

        // Try to retrieve existing account first
        let existing: any = null;
        try {
            existing = await retrieveAccount(ctx, {
                provider: "password",
                account: { id: email },
            });
        } catch {
            // Account doesn't exist yet, which is fine for new user creation
            console.log("No existing account found, will create new one");
        }

        if (existing && existing.userId) {
            // User already exists, just link the profile
            userId = existing.userId as Id<"users">;
        } else {
            // Create new account with provided password
            const { createAccount } = await import("@convex-dev/auth/server");
            const created = await createAccount(ctx, {
                provider: "password",
                account: { id: email, secret: password },
                profile: { email, name: args.name },
            });
            console.log("Created account:", created);
            // The createAccount function returns an object with user property
            userId = created.user._id;
            temporaryPassword = password; // Return the password so admin can share it
        }

        if (!userId) {
            throw new Error("Failed to create or retrieve user ID");
        }

        const profileId = await ctx.runMutation(internal.users._upsertProfile, {
            userId,
            email,
            name: args.name,
            role: args.role,
        });

        return { profileId: profileId as Id<"profiles">, temporaryPassword };
    },
});

// Get all users (Admin only)
export const getAllUsers = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const authUser = await ctx.db.get(userId);
        if (!authUser) {
            throw new Error("User not found");
        }

        const currentProfile = await ctx.db
            .query("profiles")
            .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
            .first();

        if (!currentProfile || currentProfile.role !== "admin") {
            throw new Error("Only admins can view all users");
        }

        return await ctx.db.query("profiles").collect();
    },
});

// Delete user profile (Admin only)
export const deleteUser = mutation({
    args: { profileId: v.id("profiles") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const currentProfile = await ctx.db
            .query("profiles")
            .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
            .first();

        if (!currentProfile || currentProfile.role !== "admin") {
            throw new Error("Only admins can delete users");
        }

        const profileToDelete = await ctx.db.get(args.profileId);
        if (!profileToDelete) throw new Error("Profile not found");
        if (profileToDelete._id === currentProfile._id) {
            throw new Error("Cannot delete your own profile");
        }

        await ctx.db.delete(args.profileId);
    },
});
