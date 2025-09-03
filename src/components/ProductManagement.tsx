import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

interface User {
  _id: Id<"profiles">;
  role: string;
}

interface Product {
  _id: Id<"products">;
  productCode: string;
  productName: string;
  unitPrice: number;
  stockQuantity: number;
  status: "active" | "inactive";
  createdBy: Id<"profiles">;
  updatedBy: Id<"profiles">;
  _creationTime: number;
}

interface ProductManagementProps {
  user: User;
}

export function ProductManagement({ user }: ProductManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    productCode: "",
    productName: "",
    unitPrice: 0,
    stockQuantity: 0,
    status: "active" as "active" | "inactive",
  });

  const canManage = user.role === "admin" || user.role === "warehouse_manager";

  const products = useQuery(api.products.getProducts);
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);

  const resetForm = () => {
    setIsCreating(false);
    setEditing(null);
    setForm({ productCode: "", productName: "", unitPrice: 0, stockQuantity: 0, status: "active" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    if (!form.productCode.trim() || !form.productName.trim()) {
      toast.error("Please fill in product code and name");
      return;
    }

    try {
      if (editing) {
        await updateProduct({
          productId: editing._id,
          productCode: form.productCode,
          productName: form.productName,
          unitPrice: form.unitPrice,
          stockQuantity: form.stockQuantity,
          status: form.status,
        });
        toast.success("Product updated");
      } else {
        await createProduct({ ...form });
        toast.success("Product created");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    }
  };

  const onEdit = (p: Product) => {
    setEditing(p);
    setIsCreating(true);
    setForm({
      productCode: p.productCode,
      productName: p.productName,
      unitPrice: p.unitPrice,
      stockQuantity: p.stockQuantity,
      status: p.status,
    });
  };

  const onDelete = async (p: Product) => {
    if (!canManage) return;
    if (!confirm(`Delete product ${p.productCode} — ${p.productName}?`)) return;
    try {
      await deleteProduct({ productId: p._id });
      toast.success("Product deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Product Management</h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Product
          </button>
        )}
      </div>

      {isCreating && canManage && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4">{editing ? "Edit Product" : "Create Product"}</h3>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                <input
                  type="text"
                  value={form.productCode}
                  onChange={(e) => setForm({ ...form, productCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(e) => setForm({ ...form, stockQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {canManage && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(products || []).map((p) => (
                <tr key={(p as any)._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.productCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${p.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.stockQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{p.status}</td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button onClick={() => onEdit(p as any)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => void onDelete(p as any)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!products || (products.length === 0 && (
          <div className="text-center py-8 text-gray-500">No products</div>
        ))}
      </div>
    </div>
  );
}

