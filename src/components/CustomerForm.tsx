import { useState } from "react";
import { toast } from "sonner";

interface CustomerData {
    companyName: string;
    taxCode: string;
    address: string;
    shippingAddress?: string;
    invoiceAddress?: string;
    region?: string;
    status: "active" | "inactive";
    projectManager: string;
    projectManagerPhone: string;
    projectManagerNote?: string;
    paymentManager: string;
    paymentManagerPhone: string;
    paymentManagerNote?: string;
    otherManager?: string;
    otherManagerPhone?: string;
    otherManagerNote?: string;
}

interface CustomerFormProps {
    initialData?: CustomerData;
    onSubmit: (data: CustomerData) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
    isRequest?: boolean;
}

const regions = [
    "Hà Nội",
    "TP. Hồ Chí Minh",
    "Đà Nẵng",
    "Hải Phòng",
    "Cần Thơ",
    "An Giang",
    "Bà Rịa - Vũng Tàu",
    "Bắc Giang",
    "Bắc Kạn",
    "Bạc Liêu",
    "Bắc Ninh",
    "Bến Tre",
    "Bình Định",
    "Bình Dương",
    "Bình Phước",
    "Bình Thuận",
    "Cà Mau",
    "Cao Bằng",
    "Đắk Lắk",
    "Đắk Nông",
    "Điện Biên",
    "Đồng Nai",
    "Đồng Tháp",
    "Gia Lai",
    "Hà Giang",
    "Hà Nam",
    "Hà Tĩnh",
    "Hải Dương",
    "Hậu Giang",
    "Hòa Bình",
    "Hưng Yên",
    "Khánh Hòa",
    "Kiên Giang",
    "Kon Tum",
    "Lai Châu",
    "Lâm Đồng",
    "Lạng Sơn",
    "Lào Cai",
    "Long An",
    "Nam Định",
    "Nghệ An",
    "Ninh Bình",
    "Ninh Thuận",
    "Phú Thọ",
    "Phú Yên",
    "Quảng Bình",
    "Quảng Nam",
    "Quảng Ngãi",
    "Quảng Ninh",
    "Quảng Trị",
    "Sóc Trăng",
    "Sơn La",
    "Tây Ninh",
    "Thái Bình",
    "Thái Nguyên",
    "Thanh Hóa",
    "Thừa Thiên Huế",
    "Tiền Giang",
    "Trà Vinh",
    "Tuyên Quang",
    "Vĩnh Long",
    "Vĩnh Phúc",
    "Yên Bái",
];

export function CustomerForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    isRequest = false,
}: CustomerFormProps) {
    const [formData, setFormData] = useState<CustomerData>({
        companyName: initialData?.companyName || "",
        taxCode: initialData?.taxCode || "",
        address: initialData?.address || "",
        shippingAddress: initialData?.shippingAddress || "",
        invoiceAddress: initialData?.invoiceAddress || "",
        region: initialData?.region || "",
        status: initialData?.status || "active",
        projectManager: initialData?.projectManager || "",
        projectManagerPhone: initialData?.projectManagerPhone || "",
        projectManagerNote: initialData?.projectManagerNote || "",
        paymentManager: initialData?.paymentManager || "",
        paymentManagerPhone: initialData?.paymentManagerPhone || "",
        paymentManagerNote: initialData?.paymentManagerNote || "",
        otherManager: initialData?.otherManager || "",
        otherManagerPhone: initialData?.otherManagerPhone || "",
        otherManagerNote: initialData?.otherManagerNote || "",
    });

    const [reason, setReason] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.companyName.trim() || formData.companyName.length < 2) {
            toast.error("Tên công ty phải có ít nhất 2 ký tự");
            return;
        }

        if (!formData.address.trim() || formData.address.length < 5) {
            toast.error("Địa chỉ phải có ít nhất 5 ký tự");
            return;
        }

        if (!formData.taxCode.trim()) {
            toast.error("Mã số thuế là bắt buộc");
            return;
        }

        if (!formData.projectManager.trim()) {
            toast.error("Tên quản lý dự án là bắt buộc");
            return;
        }

        if (!formData.paymentManager.trim()) {
            toast.error("Tên quản lý thanh toán là bắt buộc");
            return;
        }

        if (formData.projectManagerPhone.length < 10) {
            toast.error("Số điện thoại quản lý dự án phải có ít nhất 10 số");
            return;
        }

        if (formData.paymentManagerPhone.length < 10) {
            toast.error(
                "Số điện thoại quản lý thanh toán phải có ít nhất 10 số"
            );
            return;
        }

        if (isRequest && !reason.trim()) {
            toast.error("Lý do yêu cầu là bắt buộc");
            return;
        }

        try {
            if (isRequest) {
                await onSubmit({ ...formData, reason } as any);
            } else {
                await onSubmit(formData);
            }
        } catch (error) {
            console.error("Form submission error:", error);
        }
    };

    const updateField = (field: keyof CustomerData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-medium text-gray-900">
                        Thông tin cơ bản
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên công ty *
                        </label>
                        <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) =>
                                updateField("companyName", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mã số thuế *
                        </label>
                        <input
                            type="text"
                            value={formData.taxCode}
                            onChange={(e) =>
                                updateField("taxCode", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa chỉ *
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) =>
                                updateField("address", e.target.value)
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa chỉ giao hàng
                        </label>
                        <textarea
                            value={formData.shippingAddress}
                            onChange={(e) =>
                                updateField("shippingAddress", e.target.value)
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa chỉ xuất hóa đơn
                        </label>
                        <textarea
                            value={formData.invoiceAddress}
                            onChange={(e) =>
                                updateField("invoiceAddress", e.target.value)
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Khu vực
                        </label>
                        <select
                            value={formData.region}
                            onChange={(e) =>
                                updateField("region", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                        >
                            <option value="">Chọn khu vực</option>
                            {regions.map((region) => (
                                <option key={region} value={region}>
                                    {region}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!isRequest && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trạng thái
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) =>
                                    updateField(
                                        "status",
                                        e.target.value as "active" | "inactive"
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isLoading}
                            >
                                <option value="active">Hoạt động</option>
                                <option value="inactive">
                                    Không hoạt động
                                </option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Project Manager */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-medium text-gray-900">
                        Quản lý dự án
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ tên *
                        </label>
                        <input
                            type="text"
                            value={formData.projectManager}
                            onChange={(e) =>
                                updateField("projectManager", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại *
                        </label>
                        <input
                            type="tel"
                            value={formData.projectManagerPhone}
                            onChange={(e) =>
                                updateField(
                                    "projectManagerPhone",
                                    e.target.value
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú
                        </label>
                        <textarea
                            value={formData.projectManagerNote}
                            onChange={(e) =>
                                updateField(
                                    "projectManagerNote",
                                    e.target.value
                                )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Manager */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-medium text-gray-900">
                        Quản lý thanh toán
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ tên *
                        </label>
                        <input
                            type="text"
                            value={formData.paymentManager}
                            onChange={(e) =>
                                updateField("paymentManager", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại *
                        </label>
                        <input
                            type="tel"
                            value={formData.paymentManagerPhone}
                            onChange={(e) =>
                                updateField(
                                    "paymentManagerPhone",
                                    e.target.value
                                )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú
                        </label>
                        <textarea
                            value={formData.paymentManagerNote}
                            onChange={(e) =>
                                updateField(
                                    "paymentManagerNote",
                                    e.target.value
                                )
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Other Manager */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-medium text-gray-900">
                        Quản lý khác
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ tên
                        </label>
                        <input
                            type="text"
                            value={formData.otherManager}
                            onChange={(e) =>
                                updateField("otherManager", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            value={formData.otherManagerPhone}
                            onChange={(e) =>
                                updateField("otherManagerPhone", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú
                        </label>
                        <textarea
                            value={formData.otherManagerNote}
                            onChange={(e) =>
                                updateField("otherManagerNote", e.target.value)
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Request Reason (for sales requests) */}
            {isRequest && (
                <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
                    <div className="flex items-center mb-4">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <h3 className="text-lg font-medium text-gray-900">
                            Lý do yêu cầu
                        </h3>
                    </div>

                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Vui lòng mô tả lý do cần tạo khách hàng này..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        disabled={isLoading}
                    />
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    disabled={isLoading}
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    disabled={isLoading}
                >
                    {isLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {isLoading
                        ? isRequest
                            ? "Đang gửi yêu cầu..."
                            : initialData
                              ? "Đang cập nhật..."
                              : "Đang thêm..."
                        : isRequest
                          ? "Gửi yêu cầu"
                          : initialData
                            ? "Cập nhật khách hàng"
                            : "Thêm khách hàng"}
                </button>
            </div>
        </form>
    );
}
