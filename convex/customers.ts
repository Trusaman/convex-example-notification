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
    type: string,
    title: string,
    message: string
) {
    await ctx.db.insert("notifications", {
        userId,
        type,
        title,
        message,
        isRead: false,
        orderNumber: "", // Not order-related
    });
}

// Get all customers (Admin/Accountant only)
export const getCustomers = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        // TODO: Sales should only see their customers
        if (
            user.role !== "admin" &&
            user.role !== "accountant" &&
            user.role !== "sales"
        ) {
            throw new Error("Only admins and accountants can view customers");
        }

        return await ctx.db.query("customers").order("desc").collect();
    },
});

// Get single customer
export const getCustomer = query({
    args: { customerId: v.id("customers") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin" && user.role !== "accountant") {
            throw new Error(
                "Only admins and accountants can view customer details"
            );
        }

        return await ctx.db.get(args.customerId);
    },
});

// Create customer (Admin/Accountant only)
export const createCustomer = mutation({
    args: {
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
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin" && user.role !== "accountant") {
            throw new Error("Only admins and accountants can create customers");
        }

        // Check if tax code already exists
        const existingCustomer = await ctx.db
            .query("customers")
            .withIndex("by_tax_code", (q) => q.eq("taxCode", args.taxCode))
            .first();

        if (existingCustomer) {
            throw new Error("Customer with this tax code already exists");
        }

        const customerId = await ctx.db.insert("customers", {
            ...args,
            createdBy: user._id,
            updatedBy: user._id,
        });

        // Create history entry
        await ctx.db.insert("customer_history", {
            customerId,
            action: "created",
            performedBy: user._id,
            performedByName: user.name,
            performedByRole: user.role,
            changes: {
                companyName: args.companyName,
                taxCode: args.taxCode,
                status: args.status,
            },
            timestamp: Date.now(),
        });

        return customerId;
    },
});

// Update customer (Admin/Accountant only)
export const updateCustomer = mutation({
    args: {
        customerId: v.id("customers"),
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
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin" && user.role !== "accountant") {
            throw new Error("Only admins and accountants can update customers");
        }

        const existingCustomer = await ctx.db.get(args.customerId);
        if (!existingCustomer) {
            throw new Error("Customer not found");
        }

        // Check if tax code is being changed and if it conflicts
        if (args.taxCode !== existingCustomer.taxCode) {
            const conflictingCustomer = await ctx.db
                .query("customers")
                .withIndex("by_tax_code", (q) => q.eq("taxCode", args.taxCode))
                .first();

            if (
                conflictingCustomer &&
                conflictingCustomer._id !== args.customerId
            ) {
                throw new Error(
                    "Another customer with this tax code already exists"
                );
            }
        }

        // Track changes
        const changes: any = {};
        if (args.companyName !== existingCustomer.companyName) {
            changes.companyName = {
                from: existingCustomer.companyName,
                to: args.companyName,
            };
        }
        if (args.status !== existingCustomer.status) {
            changes.status = { from: existingCustomer.status, to: args.status };
        }
        if (args.taxCode !== existingCustomer.taxCode) {
            changes.taxCode = {
                from: existingCustomer.taxCode,
                to: args.taxCode,
            };
        }

        const { customerId, ...updateData } = args;

        await ctx.db.patch(args.customerId, {
            ...updateData,
            updatedBy: user._id,
        });

        // Create history entry if there were changes
        if (Object.keys(changes).length > 0) {
            await ctx.db.insert("customer_history", {
                customerId: args.customerId,
                action: "updated",
                performedBy: user._id,
                performedByName: user.name,
                performedByRole: user.role,
                changes,
                timestamp: Date.now(),
            });
        }

        return args.customerId;
    },
});

// Delete customer (Admin only)
export const deleteCustomer = mutation({
    args: { customerId: v.id("customers") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin") {
            throw new Error("Only admins can delete customers");
        }

        const customer = await ctx.db.get(args.customerId);
        if (!customer) {
            throw new Error("Customer not found");
        }

        // Check if customer has any orders
        const orders = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("customerId"), customer.taxCode))
            .first();

        if (orders) {
            throw new Error("Cannot delete customer with existing orders");
        }

        await ctx.db.delete(args.customerId);

        // Create history entry
        await ctx.db.insert("customer_history", {
            customerId: args.customerId,
            action: "deleted",
            performedBy: user._id,
            performedByName: user.name,
            performedByRole: user.role,
            changes: {
                companyName: customer.companyName,
                taxCode: customer.taxCode,
            },
            timestamp: Date.now(),
        });
    },
});

// Request customer creation (Sales only)
export const requestCustomerCreation = mutation({
    args: {
        companyName: v.string(),
        taxCode: v.string(),
        address: v.string(),
        shippingAddress: v.optional(v.string()),
        invoiceAddress: v.optional(v.string()),
        region: v.optional(v.string()),
        projectManager: v.string(),
        projectManagerPhone: v.string(),
        projectManagerNote: v.optional(v.string()),
        paymentManager: v.string(),
        paymentManagerPhone: v.string(),
        paymentManagerNote: v.optional(v.string()),
        otherManager: v.optional(v.string()),
        otherManagerPhone: v.optional(v.string()),
        otherManagerNote: v.optional(v.string()),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "sales" && user.role !== "admin") {
            throw new Error(
                "Only sales personnel can request customer creation"
            );
        }

        const requestId = await ctx.db.insert("customer_requests", {
            requestType: "create",
            requestedBy: user._id,
            requestedByName: user.name,
            status: "pending",
            reason: args.reason,
            customerData: {
                companyName: args.companyName,
                taxCode: args.taxCode,
                address: args.address,
                shippingAddress: args.shippingAddress,
                invoiceAddress: args.invoiceAddress,
                region: args.region,
                status: "active",
                projectManager: args.projectManager,
                projectManagerPhone: args.projectManagerPhone,
                projectManagerNote: args.projectManagerNote,
                paymentManager: args.paymentManager,
                paymentManagerPhone: args.paymentManagerPhone,
                paymentManagerNote: args.paymentManagerNote,
                otherManager: args.otherManager,
                otherManagerPhone: args.otherManagerPhone,
                otherManagerNote: args.otherManagerNote,
            },
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
                "customer_request",
                "New Customer Creation Request",
                `${user.name} requested to create customer: ${args.companyName}`
            );
        }

        return requestId;
    },
});

// Get customer requests (Admin/Accountant only)
export const getCustomerRequests = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        // TODO: Sales should only see their requests
        if (
            user.role !== "admin" &&
            user.role !== "accountant" &&
            user.role !== "sales"
        ) {
            throw new Error(
                "Only admins and accountants can view customer requests"
            );
        }

        return await ctx.db.query("customer_requests").order("desc").collect();
    },
});

// Approve customer request (Admin/Accountant only)
export const approveCustomerRequest = mutation({
    args: { requestId: v.id("customer_requests") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin" && user.role !== "accountant") {
            throw new Error(
                "Only admins and accountants can approve customer requests"
            );
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new Error("Request not found");
        }

        if (request.status !== "pending") {
            throw new Error("Request has already been processed");
        }

        // Create the customer
        const customerId = await ctx.db.insert("customers", {
            ...request.customerData,
            createdBy: user._id,
            updatedBy: user._id,
        });

        // Update request status
        await ctx.db.patch(args.requestId, {
            status: "approved",
            processedBy: user._id,
            processedByName: user.name,
            processedAt: Date.now(),
            customerId,
        });

        // Create history entry
        await ctx.db.insert("customer_history", {
            customerId,
            action: "created_from_request",
            performedBy: user._id,
            performedByName: user.name,
            performedByRole: user.role,
            changes: {
                companyName: request.customerData.companyName,
                taxCode: request.customerData.taxCode,
                requestedBy: request.requestedByName,
            },
            timestamp: Date.now(),
        });

        // Notify the requester
        await createNotification(
            ctx,
            request.requestedBy,
            "customer_request_approved",
            "Customer Request Approved",
            `Your request to create customer ${request.customerData.companyName} has been approved`
        );

        return customerId;
    },
});

// Reject customer request (Admin/Accountant only)
export const rejectCustomerRequest = mutation({
    args: {
        requestId: v.id("customer_requests"),
        reason: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin" && user.role !== "accountant") {
            throw new Error(
                "Only admins and accountants can reject customer requests"
            );
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new Error("Request not found");
        }

        if (request.status !== "pending") {
            throw new Error("Request has already been processed");
        }

        // Update request status
        await ctx.db.patch(args.requestId, {
            status: "rejected",
            processedBy: user._id,
            processedByName: user.name,
            processedAt: Date.now(),
            rejectionReason: args.reason,
        });

        // Notify the requester
        await createNotification(
            ctx,
            request.requestedBy,
            "customer_request_rejected",
            "Customer Request Rejected",
            `Your request to create customer ${request.customerData.companyName} has been rejected: ${args.reason}`
        );
    },
});

// Get customer history
export const getCustomerHistory = query({
    args: { customerId: v.id("customers") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);

        if (user.role !== "admin" && user.role !== "accountant") {
            throw new Error(
                "Only admins and accountants can view customer history"
            );
        }

        return await ctx.db
            .query("customer_history")
            .withIndex("by_customer", (q) =>
                q.eq("customerId", args.customerId)
            )
            .order("desc")
            .collect();
    },
});

// Get all customer history (Admin/Accountant only)
export const getAllCustomerHistory = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUser(ctx);

        // TODO: Sales should only see their customers' history
        if (
            user.role !== "admin" &&
            user.role !== "accountant" &&
            user.role !== "sales"
        ) {
            throw new Error(
                "Only admins and accountants can view customer history"
            );
        }

        return await ctx.db.query("customer_history").order("desc").take(100);
    },
});
