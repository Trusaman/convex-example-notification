import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function UserSetup() {
    const [name, setName] = useState("");
    const [role, setRole] = useState<
        "sales" | "accountant" | "warehouse_manager" | "shipper" | "admin"
    >("sales");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loggedInUser = useQuery(api.auth.loggedInUser);
    const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await createOrUpdateUser({
                email:
                    loggedInUser?.email ||
                    `anonymous-${Date.now()}@example.com`,
                name: name.trim(),
                role,
            });
            toast.success("Profile created successfully!");
        } catch (error) {
            toast.error("Failed to create profile");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-bold mb-6">
                    Complete Your Profile
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={loggedInUser?.email || "Anonymous User"}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="role"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Role
                        </label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="sales">Sales</option>
                            <option value="accountant">Accountant</option>
                            <option value="warehouse_manager">
                                Warehouse Manager
                            </option>
                            <option value="shipper">Shipper</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !name.trim()}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting
                            ? "Creating Profile..."
                            : "Complete Setup"}
                    </button>
                </form>
            </div>
        </div>
    );
}
