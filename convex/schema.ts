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

    suppliers: defineTable({
        companyName: v.string(),
        taxCode: v.string(),
        address: v.string(),
        contactName: v.string(),
        contactPhone: v.string(),
        contactEmail: v.optional(v.string()),
        region: v.optional(v.string()),
        status: v.union(v.literal("active"), v.literal("inactive")),
        createdBy: v.id("profiles"),
        updatedBy: v.id("profiles"),
    })
        .index("by_tax_code", ["taxCode"])
        .index("by_company_name", ["companyName"])
        .index("by_status", ["status"]),

    supplier_requests: defineTable({
        requestType: v.literal("create"),
        requestedBy: v.id("profiles"),
        requestedByName: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected")
        ),
        reason: v.string(),
        supplierData: v.object({
            companyName: v.string(),
            taxCode: v.string(),
            address: v.string(),
            contactName: v.string(),
            contactPhone: v.string(),
            contactEmail: v.optional(v.string()),
            region: v.optional(v.string()),
            status: v.union(v.literal("active"), v.literal("inactive")),
        }),
        processedBy: v.optional(v.id("profiles")),
        processedByName: v.optional(v.string()),
        processedAt: v.optional(v.number()),
        rejectionReason: v.optional(v.string()),
        supplierId: v.optional(v.id("suppliers")),
    })
        .index("by_status", ["status"])
        .index("by_requested_by", ["requestedBy"]),

    supplier_history: defineTable({
        supplierId: v.id("suppliers"),
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
        .index("by_supplier", ["supplierId"])
        .index("by_timestamp", ["timestamp"]),

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

    products: defineTable({
        productCode: v.string(),
        productName: v.string(),
        unitPrice: v.number(),
        stockQuantity: v.number(),
        status: v.union(v.literal("active"), v.literal("inactive")),
        createdBy: v.id("profiles"),
        updatedBy: v.id("profiles"),
    })
        .index("by_product_code", ["productCode"])
        .index("by_status", ["status"]),

    purchase_orders: defineTable({
        poNumber: v.string(),
        supplierName: v.string(),
        items: v.array(
            v.object({
                productId: v.string(),
                productName: v.string(),
                requestedQuantity: v.number(),
                unitPrice: v.number(),
                totalPrice: v.number(),
            })
        ),
        totalAmount: v.number(),
        status: v.union(
            v.literal("draft"),
            v.literal("pending_approval"),
            v.literal("approved"),
            v.literal("sent_to_supplier"),
            v.literal("partially_received"),
            v.literal("completed"),
            v.literal("cancelled")
        ),
        createdBy: v.id("profiles"),
        approvedBy: v.optional(v.id("profiles")),
        approvedAt: v.optional(v.number()),
        comments: v.array(
            v.object({
                userId: v.id("profiles"),
                userName: v.string(),
                userRole: v.string(),
                comment: v.string(),
                timestamp: v.number(),
            })
        ),
        rejectionReason: v.optional(v.string()),
    })
        .index("by_status", ["status"])
        .index("by_po_number", ["poNumber"]),

    orders: defineTable({
        orderNumber: v.string(),
        customerId: v.string(),
        customerName: v.string(),
        items: v.array(
            v.object({
                productId: v.string(),
                productName: v.string(),
                quantity: v.number(),
                unitPrice: v.number(),
                totalPrice: v.number(),
            })
        ),
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
        comments: v.array(
            v.object({
                userId: v.id("profiles"),
                userName: v.string(),
                userRole: v.string(),
                comment: v.string(),
                timestamp: v.number(),
            })
        ),
        shippingAddress: v.object({
            street: v.string(),
            city: v.string(),
            state: v.string(),
            zipCode: v.string(),
            country: v.string(),
        }),
        shippingQuantities: v.optional(
            v.array(
                v.object({
                    productId: v.string(),
                    shippedQuantity: v.number(),
                })
            )
        ),
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

    inventory_batches: defineTable({
        productId: v.id("products"),
        productCode: v.string(),
        productName: v.string(),
        batchNumber: v.string(),
        quantity: v.number(),
        receivedDate: v.number(),
        expiryDate: v.optional(v.number()),
        manufactureDate: v.optional(v.number()),
        supplierName: v.optional(v.string()),
        purchaseOrderId: v.optional(v.id("purchase_orders")),
        location: v.optional(v.string()),
        notes: v.optional(v.string()),
        status: v.union(
            v.literal("available"),
            v.literal("reserved"),
            v.literal("expired"),
            v.literal("damaged")
        ),
        createdBy: v.id("profiles"),
        updatedBy: v.id("profiles"),
    })
        .index("by_product_id", ["productId"])
        .index("by_batch_number", ["batchNumber"])
        .index("by_status", ["status"])
        .index("by_product_id_and_status", ["productId", "status"])
        .index("by_received_date", ["receivedDate"]),

    inventory_transactions: defineTable({
        batchId: v.id("inventory_batches"),
        productId: v.id("products"),
        transactionType: v.union(
            v.literal("receive"),
            v.literal("ship"),
            v.literal("adjust"),
            v.literal("return"),
            v.literal("damage"),
            v.literal("expire")
        ),
        quantity: v.number(),
        orderId: v.optional(v.id("orders")),
        purchaseOrderId: v.optional(v.id("purchase_orders")),
        notes: v.optional(v.string()),
        performedBy: v.id("profiles"),
        performedByName: v.string(),
        timestamp: v.number(),
    })
        .index("by_batch_id", ["batchId"])
        .index("by_product_id", ["productId"])
        .index("by_transaction_type", ["transactionType"])
        .index("by_timestamp", ["timestamp"]),

    // Goods delivery vouchers linked to approved orders
    delivery_vouchers: defineTable({
        voucherNumber: v.string(),
        orderId: v.id("orders"),
        items: v.array(
            v.object({
                productId: v.string(), // follows orders.items.productId
                productName: v.string(),
                quantity: v.number(),
            })
        ),
        createdBy: v.id("profiles"),
        createdAt: v.number(),
    })
        .index("by_order", ["orderId"])
        .index("by_voucher_number", ["voucherNumber"]),
};

export default defineSchema({
    ...authTables,
    ...applicationTables,
});
