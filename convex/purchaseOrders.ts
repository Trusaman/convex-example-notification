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

function canManagePO(role: string) {
  return role === "admin" || role === "warehouse_manager";
}

export const getPurchaseOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!canManagePO(user.role)) {
      throw new Error("Only admin or warehouse manager can view purchase orders");
    }
    return await ctx.db.query("purchase_orders").order("desc").collect();
  },
});

export const getPurchaseOrder = query({
  args: { poId: v.id("purchase_orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!canManagePO(user.role)) throw new Error("Not authorized");
    const po = await ctx.db.get(args.poId);
    if (!po) throw new Error("Purchase order not found");
    return po;
  },
});

export const createPurchaseOrder = mutation({
  args: {
    supplierName: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      requestedQuantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!canManagePO(user.role)) throw new Error("Not authorized");

    const totalAmount = args.items.reduce((sum, i) => sum + i.totalPrice, 0);
    const poNumber = `PO-${Date.now()}`;

    const poId = await ctx.db.insert("purchase_orders", {
      poNumber,
      supplierName: args.supplierName,
      items: args.items,
      totalAmount,
      status: "draft",
      createdBy: user._id,
      comments: [],
    });

    return poId;
  },
});

export const updatePurchaseOrder = mutation({
  args: {
    poId: v.id("purchase_orders"),
    supplierName: v.optional(v.string()),
    items: v.optional(v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      requestedQuantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
    }))),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("sent_to_supplier"),
      v.literal("partially_received"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!canManagePO(user.role)) throw new Error("Not authorized");

    const po = await ctx.db.get(args.poId);
    if (!po) throw new Error("Purchase order not found");

    const { poId, items, ...updates } = args as any;
    const patch: any = { ...updates };
    if (items) {
      patch.items = items;
      patch.totalAmount = items.reduce((s: number, i: any) => s + i.totalPrice, 0);
    }
    await ctx.db.patch(poId, patch);
  },
});

export const deletePurchaseOrder = mutation({
  args: { poId: v.id("purchase_orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") throw new Error("Only admin can delete purchase orders");
    const po = await ctx.db.get(args.poId);
    if (!po) throw new Error("Purchase order not found");
    await ctx.db.delete(args.poId);
  },
});

