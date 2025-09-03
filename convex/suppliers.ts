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

async function notify(ctx: any, userId: string, type: string, title: string, message: string) {
  await ctx.db.insert("notifications", {
    userId,
    type,
    title,
    message,
    isRead: false,
    orderNumber: "",
  });
}

function canManageSuppliers(role: string) {
  return role === "admin" || role === "accountant";
}

// List suppliers (admin/accountant/sales read)
export const getSuppliers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!["admin", "accountant", "sales"].includes(user.role)) {
      throw new Error("Not authorized to view suppliers");
    }
    return await ctx.db.query("suppliers").order("desc").collect();
  },
});

export const getSupplier = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!["admin", "accountant"].includes(user.role)) throw new Error("Not authorized");
    return await ctx.db.get(args.supplierId);
  },
});

export const createSupplier = mutation({
  args: {
    companyName: v.string(),
    taxCode: v.string(),
    address: v.string(),
    contactName: v.string(),
    contactPhone: v.string(),
    contactEmail: v.optional(v.string()),
    region: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!canManageSuppliers(user.role)) throw new Error("Not authorized");

    // Unique by tax code
    const existing = await ctx.db
      .query("suppliers")
      .withIndex("by_tax_code", (q) => q.eq("taxCode", args.taxCode))
      .first();
    if (existing) throw new Error("Supplier with this tax code already exists");

    const supplierId = await ctx.db.insert("suppliers", {
      ...args,
      createdBy: user._id,
      updatedBy: user._id,
    });

    await ctx.db.insert("supplier_history", {
      supplierId,
      action: "created",
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      changes: { companyName: args.companyName, taxCode: args.taxCode, status: args.status },
      timestamp: Date.now(),
    });

    return supplierId;
  },
});

export const updateSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    companyName: v.string(),
    taxCode: v.string(),
    address: v.string(),
    contactName: v.string(),
    contactPhone: v.string(),
    contactEmail: v.optional(v.string()),
    region: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!canManageSuppliers(user.role)) throw new Error("Not authorized");

    const existing = await ctx.db.get(args.supplierId);
    if (!existing) throw new Error("Supplier not found");

    if (args.taxCode !== existing.taxCode) {
      const conflict = await ctx.db
        .query("suppliers")
        .withIndex("by_tax_code", (q) => q.eq("taxCode", args.taxCode))
        .first();
      if (conflict && conflict._id !== args.supplierId) {
        throw new Error("Another supplier with this tax code exists");
      }
    }

    const changes: any = {};
    if (args.companyName !== existing.companyName) changes.companyName = { from: existing.companyName, to: args.companyName };
    if (args.status !== existing.status) changes.status = { from: existing.status, to: args.status };
    if (args.taxCode !== existing.taxCode) changes.taxCode = { from: existing.taxCode, to: args.taxCode };

    const { supplierId, ...updateData } = args;
    await ctx.db.patch(args.supplierId, { ...updateData, updatedBy: user._id });

    if (Object.keys(changes).length > 0) {
      await ctx.db.insert("supplier_history", {
        supplierId: args.supplierId,
        action: "updated",
        performedBy: user._id,
        performedByName: user.name,
        performedByRole: user.role,
        changes,
        timestamp: Date.now(),
      });
    }

    return args.supplierId;
  },
});

export const deleteSupplier = mutation({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") throw new Error("Only admin can delete suppliers");

    const sup = await ctx.db.get(args.supplierId);
    if (!sup) throw new Error("Supplier not found");

    // TODO: disallow delete when referenced by purchase orders

    await ctx.db.delete(args.supplierId);

    await ctx.db.insert("supplier_history", {
      supplierId: args.supplierId,
      action: "deleted",
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      changes: { companyName: sup.companyName, taxCode: sup.taxCode },
      timestamp: Date.now(),
    });
  },
});

export const requestSupplierCreation = mutation({
  args: {
    companyName: v.string(),
    taxCode: v.string(),
    address: v.string(),
    contactName: v.string(),
    contactPhone: v.string(),
    contactEmail: v.optional(v.string()),
    region: v.optional(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "sales" && user.role !== "admin") {
      throw new Error("Only sales can request supplier creation");
    }

    const requestId = await ctx.db.insert("supplier_requests", {
      requestType: "create",
      requestedBy: user._id,
      requestedByName: user.name,
      status: "pending",
      reason: args.reason,
      supplierData: {
        companyName: args.companyName,
        taxCode: args.taxCode,
        address: args.address,
        contactName: args.contactName,
        contactPhone: args.contactPhone,
        contactEmail: args.contactEmail,
        region: args.region,
        status: "active",
      },
    });

    // Notify accountants
    const accountants = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("role"), "accountant"))
      .collect();
    for (const acc of accountants) {
      await notify(ctx, acc._id, "supplier_request", "New Supplier Creation Request", `${user.name} requested to create supplier: ${args.companyName}`);
    }

    return requestId;
  },
});

export const getSupplierRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!["admin", "accountant", "sales"].includes(user.role)) {
      throw new Error("Not authorized");
    }
    return await ctx.db.query("supplier_requests").order("desc").collect();
  },
});

export const approveSupplierRequest = mutation({
  args: { requestId: v.id("supplier_requests") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!canManageSuppliers(user.role)) throw new Error("Not authorized");

    const req = await ctx.db.get(args.requestId);
    if (!req || req.status !== "pending") throw new Error("Invalid request");

    const supplierId = await ctx.db.insert("suppliers", {
      ...req.supplierData,
      createdBy: user._id,
      updatedBy: user._id,
    });

    await ctx.db.patch(args.requestId, {
      status: "approved",
      processedBy: user._id,
      processedByName: user.name,
      processedAt: Date.now(),
      supplierId,
    });

    await ctx.db.insert("supplier_history", {
      supplierId,
      action: "created_from_request",
      performedBy: user._id,
      performedByName: user.name,
      performedByRole: user.role,
      changes: { companyName: req.supplierData.companyName, taxCode: req.supplierData.taxCode, requestedBy: req.requestedByName },
      timestamp: Date.now(),
    });

    await notify(
      ctx,
      req.requestedBy,
      "supplier_request_approved",
      "Supplier Request Approved",
      `Your request to create supplier ${req.supplierData.companyName} has been approved`
    );

    return supplierId;
  },
});

export const rejectSupplierRequest = mutation({
  args: { requestId: v.id("supplier_requests"), reason: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!canManageSuppliers(user.role)) throw new Error("Not authorized");

    const req = await ctx.db.get(args.requestId);
    if (!req || req.status !== "pending") throw new Error("Invalid request");

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      processedBy: user._id,
      processedByName: user.name,
      processedAt: Date.now(),
      rejectionReason: args.reason,
    });

    await notify(
      ctx,
      req.requestedBy,
      "supplier_request_rejected",
      "Supplier Request Rejected",
      `Your request to create supplier ${req.supplierData.companyName} has been rejected: ${args.reason}`
    );
  },
});

export const getSupplierHistory = query({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!["admin", "accountant"].includes(user.role)) throw new Error("Not authorized");
    return await ctx.db
      .query("supplier_history")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .order("desc")
      .collect();
  },
});

export const getAllSupplierHistory = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!["admin", "accountant", "sales"].includes(user.role)) throw new Error("Not authorized");
    return await ctx.db.query("supplier_history").order("desc").take(100);
  },
});

