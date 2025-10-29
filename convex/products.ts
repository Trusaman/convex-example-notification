import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getCurrentUser(ctx: any) {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
        .first();
    if (!profile) throw new Error("User profile not found");
    return profile;
}

function canManageProducts(role: string) {
    return role === "admin" || role === "warehouse_manager";
}

export const getActiveProducts = query({
    args: {},
    handler: async (ctx) => {
        // Any authenticated role can read products list
        await getCurrentUser(ctx);
        const products = await ctx.db
            .query("products")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();
        return products;
    },
});

export const getProduct = query({
    args: { productId: v.id("products") },
    handler: async (ctx, { productId }) => {
        await getCurrentUser(ctx);
        const product = await ctx.db.get(productId);
        if (!product) throw new Error("Product not found");
        return product;
    },
});

export const getProducts = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!canManageProducts(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can view all products"
            );
        }
        return await ctx.db.query("products").order("desc").collect();
    },
});

export const getProductsByCodes = query({
    args: { codes: v.array(v.string()) },
    handler: async (ctx, args) => {
        await getCurrentUser(ctx);
        const results: any[] = [];
        for (const code of args.codes) {
            const found = await ctx.db
                .query("products")
                .withIndex("by_product_code", (q) => q.eq("productCode", code))
                .first();
            if (found) results.push(found);
        }
        return results;
    },
});

export const getProductsByIds = query({
    args: { ids: v.array(v.id("products")) },
    handler: async (ctx, args) => {
        await getCurrentUser(ctx);
        const results: any[] = [];
        for (const id of args.ids) {
            const p = await ctx.db.get(id);
            if (p) results.push(p);
        }
        return results;
    },
});

export const createProduct = mutation({
    args: {
        productCode: v.string(),
        productName: v.string(),
        unitPrice: v.number(),
        stockQuantity: v.number(),
        status: v.union(v.literal("active"), v.literal("inactive")),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageProducts(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can create products"
            );
        }

        const existing = await ctx.db
            .query("products")
            .withIndex("by_product_code", (q) =>
                q.eq("productCode", args.productCode)
            )
            .first();
        if (existing) throw new Error("Product code already exists");

        return await ctx.db.insert("products", {
            ...args,
            createdBy: user._id,
            updatedBy: user._id,
        });
    },
});

export const updateProduct = mutation({
    args: {
        productId: v.id("products"),
        productCode: v.optional(v.string()),
        productName: v.optional(v.string()),
        unitPrice: v.optional(v.number()),
        stockQuantity: v.optional(v.number()),
        status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageProducts(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can update products"
            );
        }

        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        // If changing productCode, ensure uniqueness
        if (args.productCode && args.productCode !== product.productCode) {
            const existing = await ctx.db
                .query("products")
                .withIndex("by_product_code", (q) =>
                    q.eq("productCode", args.productCode!)
                )
                .first();
            if (existing) throw new Error("Product code already exists");
        }

        const { productId, ...updates } = args as any;
        await ctx.db.patch(productId, { ...updates, updatedBy: user._id });
    },
});

export const deleteProduct = mutation({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (user.role !== "admin") {
            throw new Error("Only admin can delete products");
        }
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        await ctx.db.delete(args.productId);
    },
});
