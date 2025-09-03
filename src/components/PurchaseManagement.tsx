import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import { ProductDropdown } from "./ProductDropdown";

interface User { _id: Id<"profiles">; role: string; }

interface POItem {
  productId: string;
  productName: string;
  requestedQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function PurchaseManagement({ user }: { user: User }) {
  const canManage = user.role === "admin" || user.role === "warehouse_manager";

  const pos = useQuery(api.purchaseOrders.getPurchaseOrders);
  const createPO = useMutation(api.purchaseOrders.createPurchaseOrder);
  const updatePO = useMutation(api.purchaseOrders.updatePurchaseOrder);
  const deletePO = useMutation(api.purchaseOrders.deletePurchaseOrder);

  const [isCreating, setIsCreating] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [items, setItems] = useState<POItem[]>([
    { productId: "", productName: "", requestedQuantity: 1, unitPrice: 0, totalPrice: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => setItems([...items, { productId: "", productName: "", requestedQuantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const removeItem = (i: number) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (index: number, patch: Partial<POItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    // recalc total
    next[index].totalPrice = next[index].requestedQuantity * next[index].unitPrice;
    setItems(next);
  };

  const totalAmount = items.reduce((s, i) => s + i.totalPrice, 0);

  const resetForm = () => {
    setIsCreating(false);
    setSupplierName("");
    setItems([{ productId: "", productName: "", requestedQuantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!supplierName.trim()) return toast.error("Supplier name is required");
    if (items.some(i => !i.productId || i.requestedQuantity <= 0)) return toast.error("Please fill product and quantity");

    setIsSubmitting(true);
    try {
      await createPO({ supplierName: supplierName.trim(), items });
      toast.success("Purchase order created");
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to create PO");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Purchase Management</h2>
        {canManage && (
          <button type="button" onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Create PO</button>
        )}
      </div>

      {isCreating && canManage && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4">New Purchase Order</h3>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Items</h4>
                <button type="button" onClick={addItem} className="text-blue-600">Add Item</button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="bg-white p-4 rounded-md border">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                      <ProductDropdown
                        value={it.productId ? { productId: it.productId, productName: it.productName, unitPrice: it.unitPrice } : null}
                        onChange={(v) => updateItem(idx, { productId: v?.productId || "", productName: v?.productName || "", unitPrice: v?.unitPrice || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input type="number" min={1} value={it.requestedQuantity} onChange={(e) => updateItem(idx, { requestedQuantity: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                      <input type="number" min={0} step="0.01" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex items-end">
                      <div className="font-medium">${it.totalPrice.toFixed(2)}</div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="ml-2 text-red-600">Remove</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-right font-semibold">Total: ${totalAmount.toFixed(2)}</div>
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => { setIsCreating(false); }} className="px-4 py-2 border border-gray-300 rounded-md">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isSubmitting ? "Creating..." : "Create PO"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(pos || []).map((po: any) => (
                <tr key={po._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{po.poNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{po.supplierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{po.status.replace("_", " ")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${po.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(po._creationTime).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {canManage && (
                      <>
                        <button type="button" onClick={() => void updatePO({ poId: po._id, status: po.status === "draft" ? "pending_approval" : "draft" })} className="text-blue-600">Toggle Submit</button>
                        <button type="button" onClick={() => void deletePO({ poId: po._id })} className="text-red-600">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!pos || (pos.length === 0 && (
          <div className="text-center py-8 text-gray-500">No purchase orders</div>
        ))}
      </div>
    </div>
  );
}

