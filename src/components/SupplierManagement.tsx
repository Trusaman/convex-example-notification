import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

interface Supplier {
    _id: Id<"suppliers">;
    companyName: string;
    taxCode: string;
    address: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    region?: string;
    status: "active" | "inactive";
    createdBy: Id<"profiles">;
    updatedBy: Id<"profiles">;
    _creationTime: number;
}
interface User {
    _id: Id<"profiles">;
    role: string;
}

export function SupplierManagement({ user }: { user: User }) {
    const [activeTab, setActiveTab] = useState<
        "list" | "create" | "history" | "requests"
    >("list");
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] =
        useState<Id<"suppliers"> | null>(null);

    const suppliers = useQuery(api.suppliers.getSuppliers);
    const supplierRequests = useQuery(api.suppliers.getSupplierRequests);

    const createSupplier = useMutation(api.suppliers.createSupplier);
    const updateSupplier = useMutation(api.suppliers.updateSupplier);
    const deleteSupplier = useMutation(api.suppliers.deleteSupplier);
    const requestSupplierCreation = useMutation(
        api.suppliers.requestSupplierCreation
    );

    const approveSupplierRequest = useMutation(
        api.suppliers.approveSupplierRequest
    );
    const rejectSupplierRequest = useMutation(
        api.suppliers.rejectSupplierRequest
    );

    const canManage = user.role === "admin" || user.role === "accountant";
    const canRequest = user.role === "sales";

    const [form, setForm] = useState({
        companyName: "",
        taxCode: "",
        address: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        region: "",
        status: "active" as "active" | "inactive",
        reason: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (canManage) {
                if (editing) {
                    await updateSupplier({
                        supplierId: editing._id,
                        companyName: form.companyName,
                        taxCode: form.taxCode,
                        address: form.address,
                        contactName: form.contactName,
                        contactPhone: form.contactPhone,
                        contactEmail: form.contactEmail || undefined,
                        region: form.region || undefined,
                        status: form.status,
                    });
                    toast.success("Supplier updated");
                } else {
                    await createSupplier({
                        companyName: form.companyName,
                        taxCode: form.taxCode,
                        address: form.address,
                        contactName: form.contactName,
                        contactPhone: form.contactPhone,
                        contactEmail: form.contactEmail || undefined,
                        region: form.region || undefined,
                        status: form.status,
                    });
                    toast.success("Supplier created");
                }
            } else if (canRequest) {
                const { status, ...req } = form;
                await requestSupplierCreation({
                    companyName: req.companyName,
                    taxCode: req.taxCode,
                    address: req.address,
                    contactName: req.contactName,
                    contactPhone: req.contactPhone,
                    contactEmail: req.contactEmail || undefined,
                    region: req.region || undefined,
                    reason: req.reason,
                });
                toast.success("Supplier creation request submitted");
            }
            reset();
            setActiveTab("list");
        } catch (err: any) {
            toast.error(err.message || "Failed to submit");
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setEditing(null);
        setForm({
            companyName: "",
            taxCode: "",
            address: "",
            contactName: "",
            contactPhone: "",
            contactEmail: "",
            region: "",
            status: "active",
            reason: "",
        });
    };

    const onEdit = (s: Supplier) => {
        setEditing(s);
        setActiveTab("create");
        setForm({
            companyName: s.companyName,
            taxCode: s.taxCode,
            address: s.address,
            contactName: s.contactName,
            contactPhone: s.contactPhone,
            contactEmail: s.contactEmail || "",
            region: s.region || "",
            status: s.status,
            reason: "",
        });
    };

    const onDelete = async (s: Supplier) => {
        if (!canManage) return;
        if (!confirm(`Delete supplier ${s.companyName}?`)) return;
        try {
            await deleteSupplier({ supplierId: s._id });
            toast.success("Supplier deleted");
        } catch (err: any) {
            toast.error(err.message || "Delete failed");
        }
    };

    const getStatusBadge = (status: string) =>
        status === "active"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
    const getStatusText = (status: string) =>
        status === "active" ? "Hoạt động" : "Không hoạt động";

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Quản lý nhà cung cấp</h2>
                {(canManage || canRequest) && (
                    <button
                        type="button"
                        onClick={() => setActiveTab("create")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        {canManage
                            ? "Thêm nhà cung cấp"
                            : "Yêu cầu tạo nhà cung cấp"}
                    </button>
                )}
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab("list")}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "list" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                    >
                        Danh sách NCC ({suppliers?.length || 0})
                    </button>
                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("history")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "history" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                        >
                            Lịch sử thay đổi
                        </button>
                    )}
                    {(canManage || canRequest) && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("requests")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "requests" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                        >
                            Yêu cầu tạo NCC (
                            {supplierRequests?.filter(
                                (r) => r.status === "pending"
                            ).length || 0}
                            )
                        </button>
                    )}
                </nav>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                {activeTab === "list" && (
                    <div className="p-6">
                        {!suppliers || suppliers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Chưa có NCC nào
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Công ty
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Mã số thuế
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Khu vực
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ngày tạo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {suppliers.map((s) => (
                                            <tr
                                                key={s._id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {s.companyName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Liên hệ: {s.contactName}{" "}
                                                        — {s.contactPhone}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {s.taxCode}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {s.region || "—"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(s.status)}`}
                                                    >
                                                        {getStatusText(
                                                            s.status
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(
                                                        s._creationTime
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    {canManage && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onEdit(s)
                                                                }
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void onDelete(
                                                                        s
                                                                    )
                                                                }
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Xóa
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "create" && (
                    <div className="p-6">
                        <h3 className="text-lg font-medium mb-6">
                            {editing
                                ? "Cập nhật NCC"
                                : canManage
                                  ? "Thêm NCC mới"
                                  : "Yêu cầu tạo NCC mới"}
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Công ty
                                    </label>
                                    <input
                                        value={form.companyName}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                companyName: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mã số thuế
                                    </label>
                                    <input
                                        value={form.taxCode}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                taxCode: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa chỉ
                                    </label>
                                    <input
                                        value={form.address}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                address: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Người liên hệ
                                    </label>
                                    <input
                                        value={form.contactName}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                contactName: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Điện thoại
                                    </label>
                                    <input
                                        value={form.contactPhone}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                contactPhone: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.contactEmail}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                contactEmail: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Khu vực
                                    </label>
                                    <input
                                        value={form.region}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                region: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                {!canManage && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lý do yêu cầu
                                        </label>
                                        <textarea
                                            value={form.reason}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    reason: e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                )}
                                {canManage && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Trạng thái
                                        </label>
                                        <select
                                            value={form.status}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    status: e.target
                                                        .value as any,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="active">
                                                Hoạt động
                                            </option>
                                            <option value="inactive">
                                                Không hoạt động
                                            </option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        reset();
                                        setActiveTab("list");
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {isSubmitting
                                        ? "Đang lưu..."
                                        : editing
                                          ? "Cập nhật"
                                          : canManage
                                            ? "Tạo NCC"
                                            : "Gửi yêu cầu"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === "history" && canManage && (
                    <div className="p-6">
                        <h3 className="text-lg font-medium mb-4">
                            Lịch sử thay đổi
                        </h3>
                        {/* You can build a SupplierHistory component similar to CustomerHistory if needed */}
                    </div>
                )}

                {activeTab === "requests" && (canManage || canRequest) && (
                    <div className="p-6">
                        <h3 className="text-lg font-medium mb-4">
                            Yêu cầu tạo nhà cung cấp
                        </h3>
                        {!supplierRequests || supplierRequests.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không có yêu cầu
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Công ty
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Người yêu cầu
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {supplierRequests.map((r) => (
                                            <tr
                                                key={r._id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {r.supplierData.companyName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {r.requestedByName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                                                    {r.status}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    {canManage &&
                                                        r.status ===
                                                            "pending" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await approveSupplierRequest(
                                                                                {
                                                                                    requestId:
                                                                                        r._id,
                                                                                }
                                                                            );
                                                                            toast.success(
                                                                                "Đã duyệt yêu cầu NCC"
                                                                            );
                                                                        } catch (e: any) {
                                                                            toast.error(
                                                                                e?.message ||
                                                                                    "Duyệt thất bại"
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="text-green-600"
                                                                >
                                                                    Duyệt
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={async () => {
                                                                        const reason =
                                                                            prompt(
                                                                                "Lý do từ chối?",
                                                                                "Thiếu thông tin"
                                                                            );
                                                                        try {
                                                                            await rejectSupplierRequest(
                                                                                {
                                                                                    requestId:
                                                                                        r._id,
                                                                                    reason:
                                                                                        reason ||
                                                                                        "",
                                                                                }
                                                                            );
                                                                            toast.success(
                                                                                "Đã từ chối yêu cầu NCC"
                                                                            );
                                                                        } catch (e: any) {
                                                                            toast.error(
                                                                                e?.message ||
                                                                                    "Từ chối thất bại"
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="text-red-600"
                                                                >
                                                                    Từ chối
                                                                </button>
                                                            </>
                                                        )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
