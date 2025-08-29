import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  profiles: defineTable({
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
  })
    .index("by_email", ["email"])
    .index("by_user_id", ["userId"]),

  customers: defineTable({
    companyName: v.string(),
    taxCode: v.string(),
    address: v.string(),
    shippingAddress: v.optional(v.string()),
    invoiceAddress: v.optional(v.string()),
    region: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    projectManager: v.string(),
    projectManagerPhone: v.string(),
    projectManagerNote: v.optional(v.string()),
    paymentManager: v.string(),
    paymentManagerPhone: v.string(),
    paymentManagerNote: v.optional(v.string()),
    otherManager: v.optional(v.string()),
    otherManagerPhone: v.optional(v.string()),
    otherManagerNote: v.optional(v.string()),
    createdBy: v.id("profiles"),
    updatedBy: v.id("profiles"),
  })
    .index("by_tax_code", ["taxCode"])
    .index("by_company_name", ["companyName"])
    .index("by_status", ["status"]),

  customer_requests: defineTable({
    requestType: v.literal("create"),
    requestedBy: v.id("profiles"),
    requestedByName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reason: v.string(),
    customerData: v.object({
      companyName: v.string(),
      taxCode: v.string(),
      address: v.string(),
      shippingAddress: v.optional(v.string()),
      invoiceAddress: v.optional(v.string()),
      region: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("inactive")),
      projectManager: v.string(),
      projectManagerPhone: v.string(),
      projectManagerNote: v.optional(v.string()),
      paymentManager: v.string(),
      paymentManagerPhone: v.string(),
      paymentManagerNote: v.optional(v.string()),
      otherManager: v.optional(v.string()),
      otherManagerPhone: v.optional(v.string()),
      otherManagerNote: v.optional(v.string()),
    }),
    processedBy: v.optional(v.id("profiles")),
    processedByName: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
  })
    .index("by_status", ["status"])
    .index("by_requested_by", ["requestedBy"]),

  customer_history: defineTable({
    customerId: v.id("customers"),
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
      v.literal("created_from_request")
    ),
    performedBy: v.id("profiles"),
    performedByName: v.string(),
    performedByRole: v.string(),
    changes: v.any(),
    timestamp: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_timestamp", ["timestamp"]),

  orders: defineTable({
    orderNumber: v.string(),
    customerId: v.string(),
    customerName: v.string(),
    items: v.array(v.object({
      productId: v.string(),
      productName: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      totalPrice: v.number(),
    })),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("edit_requested"),
      v.literal("rejected"),
      v.literal("warehouse_confirmed"),
      v.literal("warehouse_rejected"),
      v.literal("shipped"),
      v.literal("completed"),
      v.literal("partial_complete"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    createdBy: v.id("profiles"),
    assignedAccountant: v.optional(v.id("profiles")),
    assignedWarehouseManager: v.optional(v.id("profiles")),
    assignedShipper: v.optional(v.id("profiles")),
    comments: v.array(v.object({
      userId: v.id("profiles"),
      userName: v.string(),
      userRole: v.string(),
      comment: v.string(),
      timestamp: v.number(),
    })),
    shippingAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    }),
    shippingQuantities: v.optional(v.array(v.object({
      productId: v.string(),
      shippedQuantity: v.number(),
    }))),
    trackingNumber: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_created_by", ["createdBy"])
    .index("by_order_number", ["orderNumber"]),

  notifications: defineTable({
    userId: v.id("profiles"),
    orderId: v.optional(v.id("orders")),
    type: v.union(
      v.literal("order_submitted"),
      v.literal("order_approved"),
      v.literal("order_rejected"),
      v.literal("edit_requested"),
      v.literal("warehouse_confirmed"),
      v.literal("warehouse_rejected"),
      v.literal("order_shipped"),
      v.literal("order_completed"),
      v.literal("order_failed"),
      v.literal("customer_request"),
      v.literal("customer_request_approved"),
      v.literal("customer_request_rejected")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    orderNumber: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
