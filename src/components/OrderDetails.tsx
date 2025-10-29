import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { InventoryDisplay } from "./InventoryDisplay";
import type { Id } from "../../convex/_generated/dataModel";

interface User {
    _id: Id<"profiles">;
    role: string;
}

interface OrderDetailsProps {
    orderId: Id<"orders">;
    user: User;
    onBack: () => void;
}

export function OrderDetails({ orderId, user, onBack }: OrderDetailsProps) {
    const [newComment, setNewComment] = useState("");
    const [isAddingComment, setIsAddingComment] = useState(false);

    const order = useQuery(api.orders.getOrder, { orderId });
    const addComment = useMutation(api.orders.addOrderComment);
    const approveOrder = useMutation(api.orders.approveOrder);
    const rejectOrder = useMutation(api.orders.rejectOrder);
    const requestEdit = useMutation(api.orders.requestEdit);
    const confirmWarehouse = useMutation(api.orders.confirmWarehouse);
    const updateOrderStatus = useMutation(api.orders.updateOrderStatus);
    const createDeliveryVoucher = useMutation(
        api.deliveryVouchers.createDeliveryVoucher
    );

    if (!order) {
        return (
            <div className="p-6">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const colors = {
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-green-100 text-green-800",
            edit_requested: "bg-orange-100 text-orange-800",
            rejected: "bg-red-100 text-red-800",
            warehouse_confirmed: "bg-blue-100 text-blue-800",
            warehouse_rejected: "bg-red-100 text-red-800",
            shipped: "bg-purple-100 text-purple-800",
            completed: "bg-green-100 text-green-800",
            partial_complete: "bg-yellow-100 text-yellow-800",
            failed: "bg-red-100 text-red-800",
            cancelled: "bg-gray-100 text-gray-800",
        };
        return (
            colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        );
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsAddingComment(true);
        try {
            await addComment({ orderId, comment: newComment.trim() });
            setNewComment("");
            toast.success("Comment added");
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleApprove = async () => {
        try {
            await approveOrder({ orderId });
            toast.success("Order approved successfully");
        } catch (error) {
            toast.error("Failed to approve order");
        }
    };

    const handleReject = async () => {
        const reason = prompt("Please provide a reason for rejection:");
        if (!reason) return;

        try {
            await rejectOrder({ orderId, reason });
            toast.success("Order rejected");
        } catch (error) {
            toast.error("Failed to reject order");
        }
    };

    const handleRequestEdit = async () => {
        const reason = prompt("Please specify what changes are needed:");
        if (!reason) return;

        try {
            await requestEdit({ orderId, reason });
            toast.success("Edit request sent");
        } catch (error) {
            toast.error("Failed to send edit request");
        }
    };

    const handleConfirmWarehouse = async () => {
        try {
            await confirmWarehouse({ orderId });
            toast.success("Inventory confirmed");
        } catch (error) {
            toast.error("Failed to confirm inventory");
        }
    };

    const handleMarkShipped = async () => {
        const trackingNumber = prompt("Enter tracking number:");
        if (!trackingNumber) return;

        try {
            await updateOrderStatus({
                orderId,
                status: "shipped",
                trackingNumber,
            });
            toast.success("Order marked as shipped");
        } catch (error) {
            toast.error("Failed to update order status");
        }
    };

    const handleCreateVoucher = async () => {
        try {
            await createDeliveryVoucher({ orderId });
            toast.success("Delivery voucher created");
        } catch (error) {
            toast.error("Failed to create delivery voucher");
        }
    };

    const canApprove =
        (user.role === "accountant" || user.role === "admin") &&
        order.status === "pending";
    const canConfirmWarehouse =
        (user.role === "warehouse_manager" || user.role === "admin") &&
        order.status === "approved";
    const canMarkShipped =
        (user.role === "shipper" || user.role === "admin") &&
        order.status === "warehouse_confirmed";

    const canCreateVoucher =
        user.role === "admin" &&
        (order.status === "approved" || order.status === "warehouse_confirmed");

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Orders
                    </button>
                    <h1 className="text-2xl font-bold">
                        Order {order.orderNumber}
                    </h1>
                    <span
                        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}
                    >
                        {order.status.replace("_", " ")}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                    {canApprove && (
                        <>
                            <button
                                onClick={handleApprove}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                Approve
                            </button>
                            <button
                                onClick={handleRequestEdit}
                                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                            >
                                Request Edit
                            </button>
                            <button
                                onClick={handleReject}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            >
                                Reject
                            </button>
                        </>
                    )}

                    {canConfirmWarehouse && (
                        <button
                            onClick={handleConfirmWarehouse}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Confirm Inventory
                        </button>
                    )}

                    {canMarkShipped && (
                        <button
                            onClick={handleMarkShipped}
                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                            type="button"
                        >
                            Mark Shipped
                        </button>
                    )}

                    {canCreateVoucher && (
                        <button
                            onClick={handleCreateVoucher}
                            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
                            type="button"
                        >
                            Create Delivery Voucher
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer & Basic Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">
                            Order Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Customer ID
                                </p>
                                <p className="font-medium">
                                    {order.customerId}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Customer Name
                                </p>
                                <p className="font-medium">
                                    {order.customerName}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Total Amount
                                </p>
                                <p className="font-medium">
                                    ${order.totalAmount.toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Created</p>
                                <p className="font-medium">
                                    {new Date(
                                        order._creationTime
                                    ).toLocaleString()}
                                </p>
                            </div>
                            {order.trackingNumber && (
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Tracking Number
                                    </p>
                                    <p className="font-medium">
                                        {order.trackingNumber}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white border rounded-lg">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-medium">Order Items</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Unit Price
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-medium">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        ID: {item.productId}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                ${item.unitPrice.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                ${item.totalPrice.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Inventory visibility when awaiting warehouse confirmation */}
                    {(order.status === "approved" ||
                        order.status === "warehouse_confirmed") && (
                        <div className="bg-white border rounded-lg">
                            <div className="p-4 border-b">
                                <h3 className="text-lg font-medium">
                                    Inventory
                                </h3>
                            </div>
                            <div className="p-4">
                                <InventoryDisplay
                                    productCodes={order.items.map(
                                        (i: any) => i.productId
                                    )}
                                    productIds={order.items.map(
                                        (i: any) => i.productId
                                    )}
                                    quantities={Object.fromEntries(
                                        order.items.map((i: any) => [
                                            i.productId,
                                            i.quantity,
                                        ])
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    {/* Shipping Address */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">
                            Shipping Address
                        </h3>
                        <div className="text-sm">
                            <p>{order.shippingAddress.street}</p>
                            <p>
                                {order.shippingAddress.city},{" "}
                                {order.shippingAddress.state}{" "}
                                {order.shippingAddress.zipCode}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                        </div>
                    </div>
                </div>

                {/* Comments & Vouchers Section */}
                <div className="space-y-6">
                    {/* Delivery Vouchers */}
                    <OrderVouchers orderId={orderId} />

                    {/* Comments */}
                    <div className="bg-white border rounded-lg">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-medium">Comments</h3>
                        </div>
                        <div className="p-4">
                            {/* Add Comment Form */}
                            <form onSubmit={handleAddComment} className="mb-4">
                                <textarea
                                    value={newComment}
                                    onChange={(e) =>
                                        setNewComment(e.target.value)
                                    }
                                    placeholder="Add a comment..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                />
                                <button
                                    type="submit"
                                    disabled={
                                        isAddingComment || !newComment.trim()
                                    }
                                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAddingComment
                                        ? "Adding..."
                                        : "Add Comment"}
                                </button>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-4">
                                {order.comments.length === 0 ? (
                                    <p className="text-gray-500 text-sm">
                                        No comments yet
                                    </p>
                                ) : (
                                    order.comments.map((comment, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-50 p-3 rounded-md"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {comment.userName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {comment.userRole.replace(
                                                            "_",
                                                            " "
                                                        )}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(
                                                        comment.timestamp
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                            <p className="text-sm">
                                                {comment.comment}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrderVouchers({ orderId }: { orderId: Id<"orders"> }) {
    const vouchers = useQuery(api.deliveryVouchers.getVouchersByOrder, {
        orderId,
    });

    return (
        <div className="bg-white border rounded-lg">
            <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Delivery Vouchers</h3>
            </div>
            <div className="p-4 space-y-3">
                {!vouchers || vouchers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No vouchers yet</p>
                ) : (
                    vouchers.map((v: any) => (
                        <div
                            key={String(v._id)}
                            className="border rounded-md p-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="font-medium">
                                    {v.voucherNumber}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(v.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                                Items:{" "}
                                {v.items
                                    ?.map(
                                        (i: any) =>
                                            `${i.productName} x ${i.quantity}`
                                    )
                                    .join(", ")}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
