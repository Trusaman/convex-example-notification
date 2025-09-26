import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ProductDropdown } from "./ProductDropdown";

interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface CreateOrderFormProps {
    onSuccess: () => void;
}

export function CreateOrderForm({ onSuccess }: CreateOrderFormProps) {
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [items, setItems] = useState<OrderItem[]>([
        {
            productId: "",
            productName: "",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
        },
    ]);
    const [shippingAddress, setShippingAddress] = useState({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "USA",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createOrder = useMutation(api.orders.createOrder);

    const addItem = () => {
        setItems([
            ...items,
            {
                productId: "",
                productName: "",
                quantity: 1,
                unitPrice: 0,
                totalPrice: 0,
            },
        ]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (
        index: number,
        field: keyof OrderItem,
        value: string | number
    ) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate total price for this item
        if (field === "quantity" || field === "unitPrice") {
            newItems[index].totalPrice =
                newItems[index].quantity * newItems[index].unitPrice;
        }

        setItems(newItems);
    };

    const getTotalAmount = () => {
        return items.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerId.trim() || !customerName.trim()) {
            toast.error("Please fill in customer information");
            return;
        }

        if (
            items.some(
                (item) =>
                    !item.productId.trim() ||
                    !item.productName.trim() ||
                    item.quantity <= 0 ||
                    item.unitPrice <= 0
            )
        ) {
            toast.error("Please fill in all item details");
            return;
        }

        if (
            !shippingAddress.street.trim() ||
            !shippingAddress.city.trim() ||
            !shippingAddress.state.trim() ||
            !shippingAddress.zipCode.trim()
        ) {
            toast.error("Please fill in shipping address");
            return;
        }

        setIsSubmitting(true);
        try {
            await createOrder({
                customerId: customerId.trim(),
                customerName: customerName.trim(),
                items,
                shippingAddress,
            });

            toast.success("Order created successfully!");
            onSuccess();
        } catch (error) {
            toast.error("Failed to create order");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Create New Order</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                        Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer ID
                            </label>
                            <input
                                type="text"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) =>
                                    setCustomerName(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Order Items</h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                        >
                            Add Item
                        </button>
                    </div>

                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white p-4 rounded-md mb-4 border"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product
                                    </label>
                                    <ProductDropdown
                                        value={
                                            item.productId
                                                ? {
                                                      productId: item.productId,
                                                      productName:
                                                          item.productName,
                                                      unitPrice: item.unitPrice,
                                                  }
                                                : null
                                        }
                                        onChange={(v) => {
                                            const newItems = [...items];
                                            newItems[index] = {
                                                ...newItems[index],
                                                productId: v?.productId ?? "",
                                                productName:
                                                    v?.productName ?? "",
                                                unitPrice: v?.unitPrice ?? 0,
                                                totalPrice:
                                                    (v?.unitPrice ?? 0) *
                                                    newItems[index].quantity,
                                            };
                                            setItems(newItems);
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "quantity",
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                            updateItem(
                                                index,
                                                "unitPrice",
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div className="flex items-end">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total: ${item.totalPrice.toFixed(2)}
                                        </label>
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="ml-2 text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="text-right">
                        <p className="text-lg font-semibold">
                            Total Order Amount: ${getTotalAmount().toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">
                        Shipping Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Street Address
                            </label>
                            <input
                                type="text"
                                value={shippingAddress.street}
                                onChange={(e) =>
                                    setShippingAddress({
                                        ...shippingAddress,
                                        street: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                value={shippingAddress.city}
                                onChange={(e) =>
                                    setShippingAddress({
                                        ...shippingAddress,
                                        city: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                State
                            </label>
                            <input
                                type="text"
                                value={shippingAddress.state}
                                onChange={(e) =>
                                    setShippingAddress({
                                        ...shippingAddress,
                                        state: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ZIP Code
                            </label>
                            <input
                                type="text"
                                value={shippingAddress.zipCode}
                                onChange={(e) =>
                                    setShippingAddress({
                                        ...shippingAddress,
                                        zipCode: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country
                            </label>
                            <input
                                type="text"
                                value={shippingAddress.country}
                                onChange={(e) =>
                                    setShippingAddress({
                                        ...shippingAddress,
                                        country: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onSuccess}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Creating Order..." : "Create Order"}
                    </button>
                </div>
            </form>
        </div>
    );
}
