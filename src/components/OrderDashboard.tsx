import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { OrderList } from "./OrderList";
import { CreateOrderForm } from "./CreateOrderForm";
import { OrderDetails } from "./OrderDetails";
import { UserManagement } from "./UserManagement";
import type { Id } from "../../convex/_generated/dataModel";
import { CustomerManagement } from "./CustomerManagement";

interface User {
    _id: Id<"profiles">;
    userId: Id<"users">;
    email: string;
    name: string;
    role: "sales" | "accountant" | "warehouse_manager" | "shipper" | "admin";
}

interface OrderDashboardProps {
    user: User;
}

export function OrderDashboard({ user }: OrderDashboardProps) {
    const [activeTab, setActiveTab] = useState<
        "orders" | "create" | "users" | "customers"
    >("orders");
    const [selectedOrderId, setSelectedOrderId] = useState<Id<"orders"> | null>(
        null
    );

    const orders = useQuery(api.orders.getOrders);

    const canCreateOrders = user.role === "sales" || user.role === "admin";
    const isAdmin = user.role === "admin";
    const canManageCustomers =
        user.role === "admin" ||
        user.role === "accountant" ||
        user.role === "sales";

    const handleOrderSelect = (orderId: Id<"orders">) => {
        setSelectedOrderId(orderId);
        setActiveTab("orders");
    };

    const handleBackToList = () => {
        setSelectedOrderId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome, {user.name}
                    </h1>
                    <p className="text-gray-600 capitalize">
                        Role: {user.role.replace("_", " ")}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => {
                            setActiveTab("orders");
                            setSelectedOrderId(null);
                        }}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === "orders"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Orders ({orders?.length || 0})
                    </button>

                    {canCreateOrders && (
                        <button
                            onClick={() => setActiveTab("create")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "create"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Create Order
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "users"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            User Management
                        </button>
                    )}

                    {canManageCustomers && (
                        <button
                            onClick={() => setActiveTab("customers")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "customers"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Customer Management
                        </button>
                    )}
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm border">
                {activeTab === "orders" && (
                    <>
                        {selectedOrderId ? (
                            <OrderDetails
                                orderId={selectedOrderId}
                                user={user}
                                onBack={handleBackToList}
                            />
                        ) : (
                            <OrderList
                                orders={orders || []}
                                user={user}
                                onOrderSelect={handleOrderSelect}
                            />
                        )}
                    </>
                )}

                {activeTab === "create" && canCreateOrders && (
                    <CreateOrderForm onSuccess={() => setActiveTab("orders")} />
                )}

                {activeTab === "users" && isAdmin && <UserManagement />}

                {activeTab === "customers" && canManageCustomers && (
                    <CustomerManagement user={user} />
                )}
            </div>
        </div>
    );
}
