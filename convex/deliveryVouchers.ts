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

// Create a delivery voucher for an approved order (Admin only)
export const createDeliveryVoucher = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") {
      throw new Error("Only admin can create delivery vouchers");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "approved" && order.status !== "warehouse_confirmed") {
      throw new Error("Voucher can only be created for approved orders");
    }

    const voucherNumber = `DV-${Date.now()}`;
    const items = (order.items as any[]).map((i) => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
    }));

    const id = await ctx.db.insert("delivery_vouchers", {
      voucherNumber,
      orderId: args.orderId,
      items,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const getVouchersByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.db
      .query("delivery_vouchers")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .order("desc")
      .collect();
  },
});

