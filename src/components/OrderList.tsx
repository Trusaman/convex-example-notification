import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

interface Order {
  _id: Id<"orders">;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  _creationTime: number;
  createdBy: Id<"profiles">;
}

interface User {
  _id: Id<"profiles">;
  role: string;
}

interface OrderListProps {
  orders: Order[];
  user: User;
  onOrderSelect: (orderId: Id<"orders">) => void;
}

export function OrderList({ orders, user, onOrderSelect }: OrderListProps) {
  const approveOrder = useMutation(api.orders.approveOrder);
  const rejectOrder = useMutation(api.orders.rejectOrder);
  const requestEdit = useMutation(api.orders.requestEdit);
  const confirmWarehouse = useMutation(api.orders.confirmWarehouse);
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);

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
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleApprove = async (orderId: Id<"orders">) => {
    try {
      await approveOrder({ orderId });
      toast.success("Order approved successfully");
    } catch (error) {
      toast.error("Failed to approve order");
    }
  };

  const handleReject = async (orderId: Id<"orders">) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await rejectOrder({ orderId, reason });
      toast.success("Order rejected");
    } catch (error) {
      toast.error("Failed to reject order");
    }
  };

  const handleRequestEdit = async (orderId: Id<"orders">) => {
    const reason = prompt("Please specify what changes are needed:");
    if (!reason) return;

    try {
      await requestEdit({ orderId, reason });
      toast.success("Edit request sent");
    } catch (error) {
      toast.error("Failed to send edit request");
    }
  };

  const handleConfirmWarehouse = async (orderId: Id<"orders">) => {
    try {
      await confirmWarehouse({ orderId });
      toast.success("Inventory confirmed");
    } catch (error) {
      toast.error("Failed to confirm inventory");
    }
  };

  const handleMarkShipped = async (orderId: Id<"orders">) => {
    const trackingNumber = prompt("Enter tracking number:");
    if (!trackingNumber) return;

    try {
      await updateOrderStatus({ 
        orderId, 
        status: "shipped",
        trackingNumber 
      });
      toast.success("Order marked as shipped");
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const canApprove = (order: Order) => {
    return (user.role === "accountant" || user.role === "admin") && order.status === "pending";
  };

  const canConfirmWarehouse = (order: Order) => {
    return (user.role === "warehouse_manager" || user.role === "admin") && order.status === "approved";
  };

  const canMarkShipped = (order: Order) => {
    return (user.role === "shipper" || user.role === "admin") && order.status === "warehouse_confirmed";
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Orders</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No orders found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onOrderSelect(order._id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {order.orderNumber}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order._creationTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {canApprove(order) && (
                      <>
                        <button
                          onClick={() => handleApprove(order._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestEdit(order._id)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Request Edit
                        </button>
                        <button
                          onClick={() => handleReject(order._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {canConfirmWarehouse(order) && (
                      <button
                        onClick={() => handleConfirmWarehouse(order._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Confirm Inventory
                      </button>
                    )}
                    
                    {canMarkShipped(order) && (
                      <button
                        onClick={() => handleMarkShipped(order._id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Mark Shipped
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
