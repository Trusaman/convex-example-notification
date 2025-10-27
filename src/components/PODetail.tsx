import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface PODetailProps {
    poId: Id<"purchase_orders">;
    onBack: () => void;
}

export function PODetail({ poId, onBack }: PODetailProps) {
    const po = useQuery(api.purchaseOrders.getPurchaseOrder, { poId });

    if (!po) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <button
                onClick={onBack}
                className="mb-4 text-blue-600 hover:text-blue-800"
            >
                ← Back to Purchase Orders
            </button>

            <div className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">
                            {po.poNumber}
                        </h2>
                        <p className="text-gray-600">
                            Supplier: {po.supplierName}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Status</div>
                        <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 capitalize">
                            {po.status.replace("_", " ")}
                        </div>
                    </div>
                </div>

                {po.rejectionReason && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="font-medium text-yellow-800 mb-1">
                            Rejection Reason
                        </div>
                        <div className="text-yellow-700">{po.rejectionReason}</div>
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Items</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Quantity
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Unit Price
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {po.items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 text-sm">
                                            {item.productName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            {item.requestedQuantity}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            ${item.unitPrice.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">
                                            ${item.totalPrice.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-4 py-3 text-sm font-semibold text-right"
                                    >
                                        Total Amount
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-right">
                                        ${po.totalAmount.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="text-sm text-gray-500">
                    Created: {new Date(po._creationTime).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
