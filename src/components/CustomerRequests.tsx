import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

interface CustomerRequest {
    _id: Id<"customer_requests">;
    requestType: string;
    requestedBy: Id<"profiles">;
    requestedByName: string;
    status: "pending" | "approved" | "rejected";
    reason: string;
    customerData: any;
    processedBy?: Id<"profiles">;
    processedByName?: string;
    processedAt?: number;
    rejectionReason?: string;
    customerId?: Id<"customers">;
    _creationTime: number;
}

interface User {
    _id: Id<"profiles">;
    role: string;
}

interface CustomerManagementProps {
    user: User;
}

export function CustomerRequests({ user }: CustomerManagementProps) {
    const [selectedRequest, setSelectedRequest] =
        useState<CustomerRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);

    const customerRequests = useQuery(api.customers.getCustomerRequests);
    const approveRequest = useMutation(api.customers.approveCustomerRequest);
    const rejectRequest = useMutation(api.customers.rejectCustomerRequest);

    // Sales can only see their own requests; managers see all
    const visibleRequests = (customerRequests || []).filter((r) =>
        user.role === "sales" ? r.requestedBy === user._id : true
    );

    const handleApprove = async (request: CustomerRequest) => {
        try {
            await approveRequest({ requestId: request._id });
            toast.success("Yêu cầu đã được phê duyệt!");
        } catch (error: any) {
            toast.error(error.message || "Có lỗi xảy ra");
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectionReason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }

        try {
            await rejectRequest({
                requestId: selectedRequest._id,
                reason: rejectionReason.trim(),
            });
            toast.success("Yêu cầu đã được từ chối!");
            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectionReason("");
        } catch (error: any) {
            toast.error(error.message || "Có lỗi xảy ra");
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
        };
        return (
            colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        );
    };

    const getStatusText = (status: string) => {
        const texts = {
            pending: "Chờ xử lý",
            approved: "Đã phê duyệt",
            rejected: "Đã từ chối",
        };
        return texts[status as keyof typeof texts] || status;
    };

    return (
        <div className="p-6">
            <h3 className="text-lg font-medium mb-6">Yêu cầu tạo khách hàng</h3>

            {!visibleRequests || visibleRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Chưa có yêu cầu nào
                </div>
            ) : (
                <div className="space-y-4">
                    {visibleRequests.map((request) => (
                        <div
                            key={request._id}
                            className="bg-gray-50 p-6 rounded-lg border"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h4 className="text-lg font-medium text-gray-900">
                                            {request.customerData.companyName}
                                        </h4>
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}
                                        >
                                            {getStatusText(request.status)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <div>
                                            Yêu cầu bởi:{" "}
                                            <span className="font-medium">
                                                {request.requestedByName}
                                            </span>
                                        </div>
                                        <div>
                                            Ngày yêu cầu:{" "}
                                            {new Date(
                                                request._creationTime
                                            ).toLocaleString("vi-VN")}
                                        </div>
                                        <div>
                                            Mã số thuế:{" "}
                                            <span className="font-medium">
                                                {request.customerData.taxCode}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {request.status === "pending" &&
                                    user.role !== "sales" && (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() =>
                                                    void handleApprove(request)
                                                }
                                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                            >
                                                Phê duyệt
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowRejectModal(true);
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Từ chối
                                            </button>
                                        </div>
                                    )}
                            </div>

                            <div className="bg-white p-4 rounded border">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    Lý do yêu cầu:
                                </div>
                                <div className="text-sm text-gray-600 mb-4">
                                    {request.reason}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium text-gray-700">
                                            Thông tin công ty:
                                        </div>
                                        <div>
                                            Địa chỉ:{" "}
                                            {request.customerData.address}
                                        </div>
                                        <div>
                                            Khu vực:{" "}
                                            {request.customerData.region || "—"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-700">
                                            Quản lý dự án:
                                        </div>
                                        <div>
                                            {
                                                request.customerData
                                                    .projectManager
                                            }
                                        </div>
                                        <div>
                                            {
                                                request.customerData
                                                    .projectManagerPhone
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-700">
                                            Quản lý thanh toán:
                                        </div>
                                        <div>
                                            {
                                                request.customerData
                                                    .paymentManager
                                            }
                                        </div>
                                        <div>
                                            {
                                                request.customerData
                                                    .paymentManagerPhone
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {request.status !== "pending" && (
                                <div className="mt-4 p-3 bg-white rounded border">
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            Xử lý bởi:
                                        </span>{" "}
                                        {request.processedByName}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            Thời gian:
                                        </span>{" "}
                                        {request.processedAt &&
                                            new Date(
                                                request.processedAt
                                            ).toLocaleString("vi-VN")}
                                    </div>
                                    {request.rejectionReason && (
                                        <div className="text-sm mt-2">
                                            <span className="font-medium">
                                                Lý do từ chối:
                                            </span>{" "}
                                            {request.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium mb-4">
                            Từ chối yêu cầu
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lý do từ chối:
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) =>
                                    setRejectionReason(e.target.value)
                                }
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nhập lý do từ chối..."
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedRequest(null);
                                    setRejectionReason("");
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={void handleReject}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Từ chối yêu cầu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
