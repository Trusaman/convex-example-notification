import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";
import { ProductDropdown } from "./ProductDropdown";
import { SupplierDropdown } from "./SupplierDropdown";

interface User {
    _id: Id<"profiles">;
    role: string;
}

interface InventoryBatch {
    _id: Id<"inventory_batches">;
    productId: Id<"products">;
    productCode: string;
    productName: string;
    batchNumber: string;
    quantity: number;
    receivedDate: number;
    expiryDate?: number;
    manufactureDate?: number;
    supplierName?: string;
    location?: string;
    notes?: string;
    status: "available" | "reserved" | "expired" | "damaged";
    _creationTime: number;
}

export function InventoryManagement({ user }: { user: User }) {
    const canManage =
        user.role === "admin" || user.role === "warehouse_manager";

    const batches = useQuery(api.inventory.getInventoryBatches);
    const createBatch = useMutation(api.inventory.createInventoryBatch);
    const updateBatch = useMutation(api.inventory.updateInventoryBatch);
    const deleteBatch = useMutation(api.inventory.deleteInventoryBatch);
    const adjustQuantity = useMutation(api.inventory.adjustInventoryQuantity);

    const [isCreating, setIsCreating] = useState(false);
    const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(
        null
    );
    const [selectedProduct, setSelectedProduct] = useState<{
        productId: string;
        productName: string;
        unitPrice: number;
    } | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<{
        supplierId: string;
        companyName: string;
    } | null>(null);
    const [form, setForm] = useState({
        batchNumber: "",
        quantity: 0,
        receivedDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
        manufactureDate: "",
        supplierName: "",
        location: "",
        notes: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const resetForm = () => {
        setIsCreating(false);
        setEditingBatch(null);
        setSelectedProduct(null);
        setSelectedSupplier(null);
        setForm({
            batchNumber: "",
            quantity: 0,
            receivedDate: new Date().toISOString().split("T")[0],
            expiryDate: "",
            manufactureDate: "",
            supplierName: "",
            location: "",
            notes: "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManage) return;

        if (editingBatch) {
            // Update existing batch
            setIsSubmitting(true);
            try {
                await updateBatch({
                    batchId: editingBatch._id,
                    expiryDate: form.expiryDate
                        ? new Date(form.expiryDate).getTime()
                        : undefined,
                    manufactureDate: form.manufactureDate
                        ? new Date(form.manufactureDate).getTime()
                        : undefined,
                    location: form.location || undefined,
                    notes: form.notes || undefined,
                });
                toast.success("Batch updated successfully");
                resetForm();
            } catch (err: any) {
                toast.error(err.message || "Failed to update batch");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // Create new batch
            if (!selectedProduct) {
                toast.error("Please select a product");
                return;
            }
            if (!form.batchNumber.trim()) {
                toast.error("Batch number is required");
                return;
            }
            if (form.quantity <= 0) {
                toast.error("Quantity must be greater than 0");
                return;
            }

            setIsSubmitting(true);
            try {
                await createBatch({
                    productId: selectedProduct.productId as Id<"products">,
                    batchNumber: form.batchNumber.trim(),
                    quantity: form.quantity,
                    receivedDate: new Date(form.receivedDate).getTime(),
                    expiryDate: form.expiryDate
                        ? new Date(form.expiryDate).getTime()
                        : undefined,
                    manufactureDate: form.manufactureDate
                        ? new Date(form.manufactureDate).getTime()
                        : undefined,
                    supplierName: form.supplierName || undefined,
                    location: form.location || undefined,
                    notes: form.notes || undefined,
                });
                toast.success("Batch created successfully");
                resetForm();
            } catch (err: any) {
                toast.error(err.message || "Failed to create batch");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleEdit = (batch: InventoryBatch) => {
        setEditingBatch(batch);
        setSelectedProduct({
            productId: batch.productId,
            productName: batch.productName,
            unitPrice: 0,
        });
        setForm({
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            receivedDate: new Date(batch.receivedDate)
                .toISOString()
                .split("T")[0],
            expiryDate: batch.expiryDate
                ? new Date(batch.expiryDate).toISOString().split("T")[0]
                : "",
            manufactureDate: batch.manufactureDate
                ? new Date(batch.manufactureDate).toISOString().split("T")[0]
                : "",
            supplierName: batch.supplierName || "",
            location: batch.location || "",
            notes: batch.notes || "",
        });
        setSelectedSupplier(
            batch.supplierName
                ? { supplierId: "", companyName: batch.supplierName }
                : null
        );
        setIsCreating(true);
    };

    const handleDelete = async (batchId: Id<"inventory_batches">) => {
        if (!confirm("Are you sure you want to delete this batch?")) return;
        try {
            await deleteBatch({ batchId });
            toast.success("Batch deleted successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete batch");
        }
    };

    const filteredBatches = (batches || []).filter((batch) => {
        const matchesStatus =
            filterStatus === "all" || batch.status === filterStatus;
        const matchesSearch =
            searchQuery === "" ||
            batch.batchNumber
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            batch.productName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            batch.productCode.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "available":
                return "text-green-600 bg-green-50";
            case "reserved":
                return "text-blue-600 bg-blue-50";
            case "expired":
                return "text-red-600 bg-red-50";
            case "damaged":
                return "text-orange-600 bg-orange-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Inventory Management</h2>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Add Batch
                    </button>
                )}
            </div>

            {/* Create/Edit Form */}
            {isCreating && canManage && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-4">
                        {editingBatch ? "Edit Batch" : "New Inventory Batch"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product *
                                </label>
                                <ProductDropdown
                                    value={selectedProduct}
                                    onChange={setSelectedProduct}
                                    disabled={!!editingBatch}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Batch Number *
                                </label>
                                <input
                                    type="text"
                                    value={form.batchNumber}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            batchNumber: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={!!editingBatch}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.quantity}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            quantity:
                                                parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={!!editingBatch}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Received Date *
                                </label>
                                <input
                                    type="date"
                                    value={form.receivedDate}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            receivedDate: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={!!editingBatch}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Manufacture Date
                                </label>
                                <input
                                    type="date"
                                    value={form.manufactureDate}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            manufactureDate: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={form.expiryDate}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            expiryDate: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier
                                </label>
                                {editingBatch ? (
                                    <input
                                        type="text"
                                        value={form.supplierName}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                    />
                                ) : (
                                    <SupplierDropdown
                                        value={selectedSupplier}
                                        onChange={(v) => {
                                            setSelectedSupplier(v);
                                            setForm({
                                                ...form,
                                                supplierName:
                                                    v?.companyName || "",
                                            });
                                        }}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={form.location}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            location: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            notes: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isSubmitting
                                    ? "Saving..."
                                    : editingBatch
                                      ? "Update Batch"
                                      : "Create Batch"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by batch number, product name, or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="expired">Expired</option>
                    <option value="damaged">Damaged</option>
                </select>
            </div>

            {/* Batches Table */}
            <div className="bg-white border rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Batch Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Received Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expiry Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBatches.map((batch) => (
                                <tr
                                    key={batch._id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {batch.batchNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div>{batch.productName}</div>
                                        <div className="text-xs text-gray-500">
                                            {batch.productCode}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {batch.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {new Date(
                                            batch.receivedDate
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {batch.expiryDate
                                            ? new Date(
                                                  batch.expiryDate
                                              ).toLocaleDateString()
                                            : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {batch.location || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                batch.status
                                            )}`}
                                        >
                                            {batch.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        {canManage && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(batch)
                                                    }
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                {user.role === "admin" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                batch._id
                                                            )
                                                        }
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredBatches.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No inventory batches found
                    </div>
                )}
            </div>
        </div>
    );
}
