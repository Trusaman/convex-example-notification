import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { InventoryManagement } from "./InventoryManagement";
import { ProductDetailView } from "./ProductDetailView";

interface User {
  _id: Id<"profiles">;
  role: string;
  name?: string;
}

export function InventoryDashboard({ user }: { user: User }) {
  const canManage = user.role === "admin" || user.role === "warehouse_manager";
  const rows = useQuery(api.inventory.getActiveProductsWithStock);

  const [selectedProductId, setSelectedProductId] = useState<Id<"products"> | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const data = useMemo(() => rows || [], [rows]);

  if (selectedProductId) {
    return (
      <div className="bg-white rounded-lg">
        <ProductDetailView
          productId={selectedProductId}
          onBack={() => setSelectedProductId(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Inventory Dashboard</h2>
        {canManage && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {showCreate ? "Close Create" : "Add Batch"}
            </button>
          </div>
        )}
      </div>

      {showCreate && canManage && (
        <div className="mb-6 border rounded-lg">
          <InventoryManagement user={user as any} />
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipped</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((p: any) => (
              <tr
                key={p._id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedProductId(p.productId)}
                role="button"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.productCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{p.productName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{p.stockQuantity ?? 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{p.shippedQuantity ?? 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">{p.availableQuantity ?? 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{(p.unitPrice ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">No active products found</div>
        )}
      </div>
    </div>
  );
}

