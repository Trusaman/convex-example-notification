# Product Management & Purchase Order Management Implementation Plan

## Overview
This plan outlines the implementation of Product Management and Purchase Order Management pages based on the existing UserManagement component structure. The system will follow the established patterns for role-based access control, notifications, and data management.

## Current System Analysis

### Existing Structure
- **UserManagement**: Complete CRUD operations with role-based access
- **CustomerManagement**: Multi-tab interface with requests/approval workflow
- **OrderManagement**: Sales orders with approval workflow and notifications
- **Notification System**: Real-time notifications for workflow events
- **Role-based Access**: Admin, Sales, Accountant, Warehouse Manager, Shipper

### Current Product References
- Products are currently referenced in orders as simple objects:
  - `productId: string`
  - `productName: string` 
  - `quantity: number`
  - `unitPrice: number`
  - `totalPrice: number`

## 1. Product Management Implementation

### 1.1 Database Schema Extensions

#### New Tables to Add to `convex/schema.ts`:

```typescript
products: defineTable({
  productCode: v.string(),           // Unique product identifier
  productName: v.string(),           // Product display name
  description: v.optional(v.string()), // Product description
  category: v.string(),              // Product category
  unitPrice: v.number(),             // Base unit price
  costPrice: v.number(),             // Cost price for margin calculation
  stockQuantity: v.number(),         // Current stock level
  minStockLevel: v.number(),         // Minimum stock threshold
  maxStockLevel: v.number(),         // Maximum stock capacity
  unit: v.string(),                  // Unit of measurement (pcs, kg, etc.)
  supplier: v.optional(v.string()), // Primary supplier
  status: v.union(
    v.literal("active"),
    v.literal("inactive"),
    v.literal("discontinued")
  ),
  createdBy: v.id("profiles"),
  updatedBy: v.id("profiles"),
})
  .index("by_product_code", ["productCode"])
  .index("by_category", ["category"])
  .index("by_status", ["status"])
  .index("by_stock_level", ["stockQuantity"]),

product_history: defineTable({
  productId: v.id("products"),
  action: v.union(
    v.literal("created"),
    v.literal("updated"),
    v.literal("stock_adjusted"),
    v.literal("price_changed"),
    v.literal("status_changed")
  ),
  performedBy: v.id("profiles"),
  performedByName: v.string(),
  performedByRole: v.string(),
  changes: v.any(),                  // Store the changes made
  oldValues: v.optional(v.any()),    // Store previous values
  newValues: v.optional(v.any()),    // Store new values
  timestamp: v.number(),
})
  .index("by_product", ["productId"])
  .index("by_timestamp", ["timestamp"]),
```

### 1.2 API Functions (`convex/products.ts`)

#### Core Functions:
- `getProducts()` - Get all products (role-based filtering)
- `getActiveProducts()` - Get active products for dropdown selection
- `getProductsWithStock()` - Get products with current stock levels for order validation
- `getProduct(productId)` - Get single product details
- `createProduct(productData)` - Create new product (Admin/Warehouse Manager only)
- `updateProduct(productId, updates)` - Update product (Admin/Warehouse Manager only)
- `deleteProduct(productId)` - Delete product (Admin only)
- `adjustStock(productId, adjustment, reason)` - Adjust stock levels
- `getProductHistory(productId)` - Get product change history
- `getLowStockProducts()` - Get products below minimum stock level
- `checkStockAvailability(productId, requestedQuantity)` - Validate stock for orders

#### Role Permissions:
- **Admin**: Full access to all product operations
- **Warehouse Manager**: Create, update products, adjust stock
- **Sales**: Read-only access to active products
- **Accountant**: Read-only access for pricing/costing
- **Shipper**: Read-only access for shipping

### 1.3 React Components

#### Main Component: `src/components/ProductManagement.tsx`
- Multi-tab interface similar to CustomerManagement
- Tabs: Products List, Add/Edit Product, Stock Management, Product History
- Role-based UI rendering

#### Supporting Components:
- `ProductForm.tsx` - Create/edit product form
- `ProductList.tsx` - Products table with filtering/sorting
- `ProductDropdown.tsx` - Reusable product selection dropdown component
- `StockAdjustment.tsx` - Stock level adjustment interface
- `ProductHistory.tsx` - Product change history display
- `InventoryDisplay.tsx` - Component to show current stock levels in orders

## 2. Purchase Order Management Implementation

### 2.1 Database Schema Extensions

#### New Tables to Add to `convex/schema.ts`:

```typescript
purchase_orders: defineTable({
  poNumber: v.string(),              // Auto-generated PO number
  supplierId: v.optional(v.string()), // Supplier identifier
  supplierName: v.string(),          // Supplier name
  items: v.array(v.object({
    productId: v.id("products"),
    productCode: v.string(),
    productName: v.string(),
    requestedQuantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
    receivedQuantity: v.optional(v.number()),
    notes: v.optional(v.string()),
  })),
  totalAmount: v.number(),
  status: v.union(
    v.literal("draft"),
    v.literal("pending_approval"),
    v.literal("approved"),
    v.literal("sent_to_supplier"),
    v.literal("partially_received"),
    v.literal("completed"),
    v.literal("cancelled"),
    v.literal("rejected")
  ),
  priority: v.union(
    v.literal("low"),
    v.literal("normal"),
    v.literal("high"),
    v.literal("urgent")
  ),
  expectedDeliveryDate: v.optional(v.number()),
  actualDeliveryDate: v.optional(v.number()),
  createdBy: v.id("profiles"),
  approvedBy: v.optional(v.id("profiles")),
  approvedAt: v.optional(v.number()),
  receivedBy: v.optional(v.id("profiles")),
  receivedAt: v.optional(v.number()),
  comments: v.array(v.object({
    userId: v.id("profiles"),
    userName: v.string(),
    userRole: v.string(),
    comment: v.string(),
    timestamp: v.number(),
  })),
  attachments: v.optional(v.array(v.object({
    fileName: v.string(),
    fileUrl: v.string(),
    uploadedBy: v.id("profiles"),
    uploadedAt: v.number(),
  }))),
})
  .index("by_status", ["status"])
  .index("by_created_by", ["createdBy"])
  .index("by_po_number", ["poNumber"])
  .index("by_supplier", ["supplierId"]),

purchase_order_history: defineTable({
  purchaseOrderId: v.id("purchase_orders"),
  action: v.union(
    v.literal("created"),
    v.literal("submitted"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("sent_to_supplier"),
    v.literal("partially_received"),
    v.literal("completed"),
    v.literal("cancelled"),
    v.literal("modified")
  ),
  performedBy: v.id("profiles"),
  performedByName: v.string(),
  performedByRole: v.string(),
  changes: v.optional(v.any()),
  notes: v.optional(v.string()),
  timestamp: v.number(),
})
  .index("by_purchase_order", ["purchaseOrderId"])
  .index("by_timestamp", ["timestamp"]),
```

### 2.2 API Functions (`convex/purchaseOrders.ts`)

#### Core Functions:
- `getPurchaseOrders()` - Get POs based on user role
- `getPurchaseOrder(poId)` - Get single PO details
- `createPurchaseOrder(poData)` - Create new PO (Warehouse Manager only)
- `updatePurchaseOrder(poId, updates)` - Update PO (role-based)
- `approvePurchaseOrder(poId)` - Approve PO (Admin only)
- `rejectPurchaseOrder(poId, reason)` - Reject PO (Admin only)
- `receiveItems(poId, receivedItems)` - Mark items as received
- `completePurchaseOrder(poId)` - Mark PO as completed
- `addComment(poId, comment)` - Add comment to PO

#### Notification Integration:
- Notify admins when PO is submitted for approval
- Notify warehouse when PO is approved
- Notify relevant users when items are received
- **Special Requirement**: Notify warehouse when sales orders are created (modify existing order creation)

### 2.3 React Components

#### Main Component: `src/components/PurchaseOrderManagement.tsx`
- Multi-tab interface: PO List, Create PO, Receiving, PO History
- Role-based access control

#### Supporting Components:
- `PurchaseOrderForm.tsx` - Create/edit PO form with product selection
- `PurchaseOrderList.tsx` - PO table with status filtering
- `ReceivingInterface.tsx` - Interface for receiving items
- `PurchaseOrderDetails.tsx` - Detailed PO view with comments/history

## 3. Integration Points

### 3.1 Existing Order System Enhancement
- Modify `convex/orders.ts` to add warehouse notification when orders are created
- Update order items to reference actual product IDs from products table
- Add stock validation when creating sales orders
- **Product Dropdown Integration**: Update OrderDetails.tsx to display products as dropdown lists for easy selection
- **Inventory Display**: Show current inventory levels in OrderDetails when order status is waiting for warehouse confirmation
- Add real-time stock level checking during order creation and editing

### 3.2 Notification System Extensions
Add new notification types to schema:
```typescript
// Add to existing notification types
v.literal("purchase_order_submitted"),
v.literal("purchase_order_approved"),
v.literal("purchase_order_rejected"),
v.literal("items_received"),
v.literal("low_stock_alert"),
v.literal("stock_adjusted"),
```

### 3.3 Navigation Updates
Update main navigation to include:
- Product Management (Admin, Warehouse Manager access)
- Purchase Order Management (Admin, Warehouse Manager access)

## 4. Implementation Phases

### Phase 1: Database Schema & API
1. Add product and purchase order tables to schema
2. Implement product management API functions
3. Implement purchase order management API functions
4. Add new notification types

### Phase 2: Product Management UI
1. Create ProductManagement main component
2. Implement ProductForm for CRUD operations
3. Add ProductList with filtering/sorting
4. Create ProductDropdown component for order integration
5. Implement InventoryDisplay component for stock visibility
6. Implement StockAdjustment interface
7. Add ProductHistory component

### Phase 3: Purchase Order Management UI
1. Create PurchaseOrderManagement main component
2. Implement PurchaseOrderForm with product selection
3. Add PurchaseOrderList with status filtering
4. Implement ReceivingInterface for item receipt
5. Add PurchaseOrderDetails with comments

### Phase 4: Integration & Testing
1. Integrate ProductDropdown with existing order system
2. Update OrderDetails.tsx to show inventory levels during warehouse confirmation
3. Add warehouse notifications for sales orders
4. Implement real-time stock validation in order creation/editing
5. Update navigation and routing
6. Comprehensive testing of all workflows
7. Role-based access testing

## 5. Special Requirements Implementation

### Product Dropdown in Order Details
- Create reusable `ProductDropdown` component with search and filtering
- Display product code, name, and current stock level in dropdown options
- Integrate with existing `CreateOrderForm.tsx` and `OrderDetails.tsx`
- Show real-time stock availability during product selection

### Inventory Display During Warehouse Confirmation
- Add `InventoryDisplay` component to show current stock levels
- Display inventory information when order status is "pending" or "warehouse_confirmed"
- Show available quantity vs. requested quantity
- Highlight potential stock shortages with visual indicators
- Update inventory display in real-time as stock levels change

### Warehouse Notification on Order Creation
- Modify `createOrder` function in `convex/orders.ts`
- Add notification to all warehouse managers when new sales order is created
- Include order details, priority information, and stock availability status

### Order Detail Changes After Completion
- Add `editAfterCompletion` permission check
- Allow modifications to completed orders with special approval
- Track all post-completion changes in order history
- Require additional approval for post-completion edits

## 6. Testing Strategy

### Unit Testing
- Test all API functions with different user roles
- Validate schema constraints and indexes
- Test notification creation and delivery

### Integration Testing
- Test complete workflows (create product → create PO → receive items)
- Test product dropdown functionality in order creation
- Test inventory display during warehouse confirmation workflow
- Test real-time stock validation and updates
- Test role-based access controls
- Test notification flows

### User Acceptance Testing
- Test with different user roles
- Validate business workflows
- Test edge cases and error handling

## 7. Future Enhancements

### Potential Additions
- Barcode scanning for receiving
- Automated reorder points
- Supplier management
- Purchase analytics and reporting
- Integration with accounting systems
- Mobile app for warehouse operations

This plan provides a comprehensive roadmap for implementing both Product Management and Purchase Order Management while maintaining consistency with the existing codebase architecture and patterns.
