import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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

function canManageInventory(role: string) {
    return role === "admin" || role === "warehouse_manager";
}

// Get all inventory batches
export const getInventoryBatches = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);
        if (!canManageInventory(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can view inventory"
            );
        }
        return await ctx.db.query("inventory_batches").order("desc").collect();
    },
});

// Get inventory batches by product
export const getInventoryByProduct = query({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageInventory(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can view inventory"
            );
        }
        return await ctx.db
            .query("inventory_batches")
            .withIndex("by_product_id", (q) =>
                q.eq("productId", args.productId)
            )
            .collect();
    },
});

// Get available inventory batches by product
export const getAvailableInventoryByProduct = query({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageInventory(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can view inventory"
            );
        }
        return await ctx.db
            .query("inventory_batches")
            .withIndex("by_product_id_and_status", (q) =>
                q.eq("productId", args.productId).eq("status", "available")
            )
            .collect();
    },
});

// Get inventory batch by batch number
export const getInventoryByBatchNumber = query({
    args: { batchNumber: v.string() },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageInventory(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can view inventory"
            );
        }
        return await ctx.db
            .query("inventory_batches")
            .withIndex("by_batch_number", (q) =>
                q.eq("batchNumber", args.batchNumber)
            )
            .first();
    },
});

// Get inventory transactions
export const getInventoryTransactions = query({
    args: { batchId: v.optional(v.id("inventory_batches")) },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageInventory(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can view inventory transactions"
            );
        }
        if (args.batchId) {
            return await ctx.db
                .query("inventory_transactions")
                .withIndex("by_batch_id", (q) => q.eq("batchId", args.batchId!))
                .order("desc")
                .collect();
        }
        return await ctx.db
            .query("inventory_transactions")
            .order("desc")
            .collect();
    },
});

// Create inventory batch
export const createInventoryBatch = mutation({
    args: {
        productId: v.id("products"),
        batchNumber: v.string(),
        quantity: v.number(),
        receivedDate: v.number(),
        expiryDate: v.optional(v.number()),
        manufactureDate: v.optional(v.number()),
        supplierName: v.optional(v.string()),
        purchaseOrderId: v.optional(v.id("purchase_orders")),
        location: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageInventory(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can create inventory batches"
            );
        }

        // Check if batch number already exists
        const existing = await ctx.db
            .query("inventory_batches")
            .withIndex("by_batch_number", (q) =>
                q.eq("batchNumber", args.batchNumber)
            )
            .first();
        if (existing) {
            throw new Error("Batch number already exists");
        }

        // Get product details
        const product = await ctx.db.get(args.productId);
        if (!product) {
            throw new Error("Product not found");
        }

        // Create batch
        const batchId = await ctx.db.insert("inventory_batches", {
            productId: args.productId,
            productCode: product.productCode,
            productName: product.productName,
            batchNumber: args.batchNumber,
            quantity: args.quantity,
            receivedDate: args.receivedDate,
            expiryDate: args.expiryDate,
            manufactureDate: args.manufactureDate,
            supplierName: args.supplierName,
            purchaseOrderId: args.purchaseOrderId,
            location: args.location,
            notes: args.notes,
            status: "available",
            createdBy: user._id,
            updatedBy: user._id,
        });

        // Create transaction record
        await ctx.db.insert("inventory_transactions", {
            batchId,
            productId: args.productId,
            transactionType: "receive",
            quantity: args.quantity,
            purchaseOrderId: args.purchaseOrderId,
            notes: args.notes,
            performedBy: user._id,
            performedByName: user.name,
            timestamp: Date.now(),
        });

        // Update product stock quantity
        await ctx.db.patch(args.productId, {
            stockQuantity: product.stockQuantity + args.quantity,
        });

        return batchId;
    },
});

// Update inventory batch
export const updateInventoryBatch = mutation({
    args: {
        batchId: v.id("inventory_batches"),
        quantity: v.optional(v.number()),
        expiryDate: v.optional(v.number()),
        manufactureDate: v.optional(v.number()),
        location: v.optional(v.string()),
        notes: v.optional(v.string()),
        status: v.optional(
            v.union(
                v.literal("available"),
                v.literal("reserved"),
                v.literal("expired"),
                v.literal("damaged")
            )
        ),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageInventory(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can update inventory batches"
            );
        }

        const batch = await ctx.db.get(args.batchId);
        if (!batch) {
            throw new Error("Batch not found");
        }

        const { batchId, ...updates } = args as any;

        // If quantity is being adjusted, create transaction and update product stock
        if (
            updates.quantity !== undefined &&
            updates.quantity !== batch.quantity
        ) {
            const quantityDiff = updates.quantity - batch.quantity;

            await ctx.db.insert("inventory_transactions", {
                batchId,
                productId: batch.productId,
                transactionType: "adjust",
                quantity: quantityDiff,
                notes: updates.notes || "Quantity adjustment",
                performedBy: user._id,
                performedByName: user.name,
                timestamp: Date.now(),
            });

            // Update product stock
            const product = await ctx.db.get(batch.productId);
            if (product) {
                await ctx.db.patch(batch.productId, {
                    stockQuantity: product.stockQuantity + quantityDiff,
                });
            }
        }

        await ctx.db.patch(batchId, { ...updates, updatedBy: user._id });
    },
});

// Delete inventory batch
export const deleteInventoryBatch = mutation({
    args: { batchId: v.id("inventory_batches") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (user.role !== "admin") {
            throw new Error("Only admin can delete inventory batches");
        }

        const batch = await ctx.db.get(args.batchId);
        if (!batch) {
            throw new Error("Batch not found");
        }

        // Update product stock quantity
        const product = await ctx.db.get(batch.productId);
        if (product) {
            await ctx.db.patch(batch.productId, {
                stockQuantity: Math.max(
                    0,
                    product.stockQuantity - batch.quantity
                ),
            });
        }

        await ctx.db.delete(args.batchId);
    },
});

// Adjust inventory batch quantity
export const adjustInventoryQuantity = mutation({
    args: {
        batchId: v.id("inventory_batches"),
        quantityChange: v.number(),
        transactionType: v.union(
            v.literal("adjust"),
            v.literal("damage"),
            v.literal("expire"),
            v.literal("return")
        ),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        if (!canManageInventory(user.role)) {
            throw new Error(
                "Only admin or warehouse manager can adjust inventory"
            );
        }

        const batch = await ctx.db.get(args.batchId);
        if (!batch) {
            throw new Error("Batch not found");
        }

        const newQuantity = batch.quantity + args.quantityChange;
        if (newQuantity < 0) {
            throw new Error("Insufficient quantity in batch");
        }

        // Update batch quantity
        await ctx.db.patch(args.batchId, {
            quantity: newQuantity,
            updatedBy: user._id,
        });

        // Create transaction record
        await ctx.db.insert("inventory_transactions", {
            batchId: args.batchId,
            productId: batch.productId,
            transactionType: args.transactionType,
            quantity: args.quantityChange,
            notes: args.notes,
            performedBy: user._id,
            performedByName: user.name,
            timestamp: Date.now(),
        });

        // Update product stock
        const product = await ctx.db.get(batch.productId);
        if (product) {
            await ctx.db.patch(batch.productId, {
                stockQuantity: product.stockQuantity + args.quantityChange,
            });
        }
    },
});
