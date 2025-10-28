import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { OrderList } from "./OrderList";
import { CreateOrderForm } from "./CreateOrderForm";
import { OrderDetails } from "./OrderDetails";
import { UserManagement } from "./UserManagement";
import type { Id } from "../../convex/_generated/dataModel";
import { CustomerManagement } from "./CustomerManagement";
import { ProductManagement } from "./ProductManagement";
import { PurchaseManagement } from "./PurchaseManagement";
import { SupplierManagement } from "./SupplierManagement";
import { InventoryManagement } from "./InventoryManagement";
import { InventoryDashboard } from "./InventoryDashboard";

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
        | "orders"
        | "create"
        | "users"
        | "customers"
        | "products"
        | "purchases"
        | "suppliers"
        | "inventory"
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
                        type="button"
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
                            type="button"
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
                            type="button"
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

                    {(user.role === "admin" ||
                        user.role === "accountant" ||
                        user.role === "sales") && (
                        <button
                            type="button"
                            onClick={() => setActiveTab("suppliers")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === "suppliers"
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                        >
                            Supplier Management
                        </button>
                    )}

                    {canManageCustomers && (
                        <button
                            type="button"
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

                    {(user.role === "admin" ||
                        user.role === "warehouse_manager") && (
                        <>
                            <button
                                type="button"
                                onClick={() => setActiveTab("products")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "products"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Product Management
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("purchases")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "purchases"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Purchase Management
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("inventory")}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === "inventory"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                            >
                                Inventory Management
                            </button>
                        </>
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
                {activeTab === "suppliers" &&
                    (user.role === "admin" ||
                        user.role === "accountant" ||
                        user.role === "sales") && (
                        <SupplierManagement user={user} />
                    )}
                {activeTab === "customers" && canManageCustomers && (
                    <CustomerManagement user={user} />
                )}
                {activeTab === "products" &&
                    (user.role === "admin" ||
                        user.role === "warehouse_manager") && (
                        <ProductManagement user={user} />
                    )}
                {activeTab === "purchases" &&
                    (user.role === "admin" ||
                        user.role === "warehouse_manager") && (
                        <PurchaseManagement user={user} />
                    )}
                {activeTab === "inventory" &&
                    (user.role === "admin" ||
                        user.role === "warehouse_manager") && (
                        <InventoryDashboard user={user} />
                    )}
            </div>
        </div>
    );
}
