import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

interface Profile {
    _id: Id<"profiles">;
    userId: Id<"users">;
    email: string;
    name: string;
    role: "sales" | "accountant" | "warehouse_manager" | "shipper" | "admin";
    _creationTime: number;
}

export function UserManagement() {
    const [isCreating, setIsCreating] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [formData, setFormData] = useState<{
        email: string;
        name: string;
        role:
            | "sales"
            | "accountant"
            | "warehouse_manager"
            | "shipper"
            | "admin";
    }>({
        email: "",
        name: "",
        role: "sales",
    });

    const users = useQuery(api.users.getAllUsers);
    const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
    const deleteUser = useMutation(api.users.deleteUser);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email.trim() || !formData.name.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            await createOrUpdateUser({
                email: formData.email.trim(),
                name: formData.name.trim(),
                role: formData.role,
                targetUserId: editingUser?.userId,
            });

            toast.success(
                editingUser
                    ? "User updated successfully!"
                    : "User created successfully!"
            );
            resetForm();
        } catch (error) {
            toast.error("Failed to save user");
            console.error(error);
        }
    };

    const handleEdit = (user: Profile) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            name: user.name,
            role: user.role,
        });
        setIsCreating(true);
    };

    const handleDelete = async (user: Profile) => {
        if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
            return;
        }

        try {
            await deleteUser({ profileId: user._id });
            toast.success("User deleted successfully");
        } catch (error) {
            toast.error("Failed to delete user");
            console.error(error);
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingUser(null);
        setFormData({
            email: "",
            name: "",
            role: "sales",
        });
    };

    const getRoleBadgeColor = (role: string) => {
        const colors = {
            admin: "bg-purple-100 text-purple-800",
            sales: "bg-blue-100 text-blue-800",
            accountant: "bg-green-100 text-green-800",
            warehouse_manager: "bg-orange-100 text-orange-800",
            shipper: "bg-gray-100 text-gray-800",
        };
        return (
            colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">User Management</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Add New User
                </button>
            </div>

            {/* Create/Edit Form */}
            {isCreating && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-4">
                        {editingUser ? "Edit User" : "Create New User"}
                    </h3>

                    <form onSubmit={void handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={!!editingUser} // Can't change email for existing users
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        role: e.target.value as any,
                                    })
                                }
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

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {editingUser ? "Update User" : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white border rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
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
                            {users?.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {user.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}
                                        >
                                            {user.role.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(
                                            user._creationTime
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                void handleDelete(user)
                                            }
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!users ||
                    (users.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No users found
                        </div>
                    ))}
            </div>
        </div>
    );
}
