import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function ProductDetailView({
  productId,
  onBack,
}: {
  productId: Id<"products">;
  onBack: () => void;
}) {
  const data = useQuery(api.inventory.getProductStockMovements, { productId });

  if (!data) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back to Inventory
        </button>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const { product, computedAvailable, movements } = data as any;

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to Inventory
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Product Details</h2>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Product</div>
            <div className="font-medium">{product.productCode} — {product.productName}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Unit Price</div>
            <div className="font-medium">{product.unitPrice?.toLocaleString()} </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Remaining Quantity</div>
            <div className="font-semibold text-green-700">{computedAvailable}</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium">Stock Movements</h3>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(movements || []).map((m: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {m.timestamp ? new Date(m.timestamp).toLocaleString() : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                  {m.kind}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${m.quantity < 0 ? "text-red-600" : "text-green-700"}`}>
                  {m.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {m.balance}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {m.orderNumber ? `Order ${m.orderNumber}` : m.batchId ? `Batch ${m.batchId}` : m.purchaseOrderId ? `PO ${m.purchaseOrderId}` : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {m.notes || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(movements || []).length === 0 && (
          <div className="text-center py-8 text-gray-500">No movements found</div>
        )}
      </div>
    </div>
  );
}

