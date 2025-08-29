import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to get current user profile
async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .first();
  if (!profile) {
    throw new Error("User profile not found");
  }
  return profile;
}

// Helper function to create notification
async function createNotification(
  ctx: any,
  userId: string,
  orderId: string,
  type: string,
  title: string,
  message: string,
  orderNumber: string
) {
  await ctx.db.insert("notifications", {
    userId,
    orderId,
    type,
    title,
    message,
    isRead: false,
    orderNumber,
  });
}

// Create a new order (Sales only)
export const createOrder = mutation({
  args: {
    customerId: v.string(),
    customerName: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
    })),
    shippingAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    if (user.role !== "sales" && user.role !== "admin") {
      throw new Error("Only sales personnel can create orders");
    }

    const totalAmount = args.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const orderNumber = `ORD-${Date.now()}`;

    const orderId = await ctx.db.insert("orders", {
      orderNumber,
      customerId: args.customerId,
      customerName: args.customerName,
      items: args.items,
      totalAmount,
      status: "pending",
      createdBy: user._id,
      comments: [],
      shippingAddress: args.shippingAddress,
    });

    // Notify all accountants
    const accountants = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("role"), "accountant"))
      .collect();

    for (const accountant of accountants) {
      await createNotification(
        ctx,
        accountant._id,
        orderId,
        "order_submitted",
        "New Order Submitted",
        `Order ${orderNumber} from ${args.customerName} needs approval`,
        orderNumber
      );
    }

    return orderId;
  },
});

// Get orders based on user role
export const getOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    
    let orders: any[] = [];
    
    switch (user.role) {
      case "sales":
        orders = await ctx.db
          .query("orders")
          .withIndex("by_created_by", (q) => q.eq("createdBy", user._id))
          .collect();
        break;
      case "accountant":
      case "admin":
        orders = await ctx.db.query("orders").collect();
        break;
      case "warehouse_manager":
        orders = await ctx.db
          .query("orders")
          .filter((q) => 
            q.or(
              q.eq(q.field("status"), "approved"),
              q.eq(q.field("status"), "warehouse_confirmed"),
              q.eq(q.field("status"), "warehouse_rejected")
            )
          )
          .collect();
        break;
      case "shipper":
        orders = await ctx.db
          .query("orders")
          .filter((q) => 
            q.or(
              q.eq(q.field("status"), "warehouse_confirmed"),
              q.eq(q.field("status"), "shipped"),
              q.eq(q.field("status"), "completed"),
              q.eq(q.field("status"), "partial_complete"),
              q.eq(q.field("status"), "failed")
            )
          )
          .collect();
        break;
      default:
        orders = [];
    }

    return orders;
  },
});

// Approve order (Accountant only)
export const approveOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    if (user.role !== "accountant" && user.role !== "admin") {
      throw new Error("Only accountants can approve orders");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      status: "approved",
      assignedAccountant: user._id,
    });

    // Notify order creator
    await createNotification(
      ctx,
      order.createdBy,
      args.orderId,
      "order_approved",
      "Order Approved",
      `Your order ${order.orderNumber} has been approved`,
      order.orderNumber
    );

    // Notify warehouse managers
    const warehouseManagers = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("role"), "warehouse_manager"))
      .collect();

    for (const manager of warehouseManagers) {
      await createNotification(
        ctx,
        manager._id,
        args.orderId,
        "order_approved",
        "Order Ready for Processing",
        `Order ${order.orderNumber} has been approved and needs inventory confirmation`,
        order.orderNumber
      );
    }
  },
});

// Reject order (Accountant only)
export const rejectOrder = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    if (user.role !== "accountant" && user.role !== "admin") {
      throw new Error("Only accountants can reject orders");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      status: "rejected",
      assignedAccountant: user._id,
    });

    // Add rejection comment
    await addComment({
      orderId: args.orderId,
      comment: `Order rejected: ${args.reason}`,
    }, ctx);

    // Notify order creator
    await createNotification(
      ctx,
      order.createdBy,
      args.orderId,
      "order_rejected",
      "Order Rejected",
      `Your order ${order.orderNumber} has been rejected: ${args.reason}`,
      order.orderNumber
    );
  },
});

// Request edit (Accountant only)
export const requestEdit = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    if (user.role !== "accountant" && user.role !== "admin") {
      throw new Error("Only accountants can request edits");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      status: "edit_requested",
      assignedAccountant: user._id,
    });

    // Add edit request comment
    await addComment({
      orderId: args.orderId,
      comment: `Edit requested: ${args.reason}`,
    }, ctx);

    // Notify order creator
    await createNotification(
      ctx,
      order.createdBy,
      args.orderId,
      "edit_requested",
      "Order Edit Requested",
      `Changes requested for order ${order.orderNumber}: ${args.reason}`,
      order.orderNumber
    );
  },
});

// Confirm warehouse inventory (Warehouse Manager only)
export const confirmWarehouse = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    if (user.role !== "warehouse_manager" && user.role !== "admin") {
      throw new Error("Only warehouse managers can confirm inventory");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      status: "warehouse_confirmed",
      assignedWarehouseManager: user._id,
    });

    // Notify shippers
    const shippers = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("role"), "shipper"))
      .collect();

    for (const shipper of shippers) {
      await createNotification(
        ctx,
        shipper._id,
        args.orderId,
        "warehouse_confirmed",
        "Order Ready to Ship",
        `Order ${order.orderNumber} is ready for shipping`,
        order.orderNumber
      );
    }
  },
});

// Update order status (various roles)
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("shipped"),
      v.literal("completed"),
      v.literal("partial_complete"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
    shippingQuantities: v.optional(v.array(v.object({
      productId: v.string(),
      shippedQuantity: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Check permissions based on status
    if (args.status === "shipped" && user.role !== "shipper" && user.role !== "admin") {
      throw new Error("Only shippers can mark orders as shipped");
    }

    const updateData: any = { status: args.status };
    if (args.trackingNumber) {
      updateData.trackingNumber = args.trackingNumber;
    }
    if (args.shippingQuantities) {
      updateData.shippingQuantities = args.shippingQuantities;
    }
    if (user.role === "shipper") {
      updateData.assignedShipper = user._id;
    }

    await ctx.db.patch(args.orderId, updateData);

    // Notify relevant parties
    const notificationType = args.status === "shipped" ? "order_shipped" :
                           args.status === "completed" ? "order_completed" :
                           args.status === "failed" ? "order_failed" : "order_shipped";

    await createNotification(
      ctx,
      order.createdBy,
      args.orderId,
      notificationType,
      `Order ${args.status.replace('_', ' ').toUpperCase()}`,
      `Order ${order.orderNumber} status updated to ${args.status}`,
      order.orderNumber
    );
  },
});

// Add comment to order
async function addComment(args: { orderId: string, comment: string }, ctx: any) {
  const user = await getCurrentUser(ctx);
  const order = await ctx.db.get(args.orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const newComment = {
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    comment: args.comment,
    timestamp: Date.now(),
  };

  await ctx.db.patch(args.orderId, {
    comments: [...order.comments, newComment],
  });
}

export const addOrderComment = mutation({
  args: {
    orderId: v.id("orders"),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    return await addComment(args, ctx);
  },
});

// Get single order
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const order = await ctx.db.get(args.orderId);
    
    if (!order) {
      throw new Error("Order not found");
    }

    // Check permissions
    if (user.role === "sales" && order.createdBy !== user._id) {
      throw new Error("You can only view your own orders");
    }

    return order;
  },
});
