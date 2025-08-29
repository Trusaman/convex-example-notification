import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    if (!currentProfile || (currentProfile.role !== "admin")) {
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
