import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { CustomerForm } from "./CustomerForm";
import { CustomerHistory } from "./CustomerHistory";
import { CustomerRequests } from "./CustomerRequests";
import type { Id } from "../../convex/_generated/dataModel";

interface Customer {
  _id: Id<"customers">;
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
  createdBy: Id<"profiles">;
  updatedBy: Id<"profiles">;
  _creationTime: number;
}

interface User {
  _id: Id<"profiles">;
  role: string;
}

interface CustomerManagementProps {
  user: User;
}

export function CustomerManagement({ user }: CustomerManagementProps) {
  const [activeTab, setActiveTab] = useState<"list" | "create" | "history" | "requests">("list");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<Id<"customers"> | null>(null);

  const customers = useQuery(api.customers.getCustomers);
  const customerRequests = useQuery(api.customers.getCustomerRequests);
  const createCustomer = useMutation(api.customers.createCustomer);
  const updateCustomer = useMutation(api.customers.updateCustomer);
  const deleteCustomer = useMutation(api.customers.deleteCustomer);
  const requestCustomerCreation = useMutation(api.customers.requestCustomerCreation);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManageCustomers = user.role === "admin" || user.role === "accountant";
  const canRequestCustomers = user.role === "sales" || user.role === "admin";

  const handleCreateCustomer = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (canManageCustomers) {
        await createCustomer(data);
        toast.success("Khách hàng đã được tạo thành công!");
        setActiveTab("list");
      } else if (canRequestCustomers) {
        await requestCustomerCreation(data);
        toast.success("Yêu cầu tạo khách hàng đã được gửi!");
        setActiveTab("requests");
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (data: any) => {
    if (!editingCustomer) return;
    
    setIsSubmitting(true);
    try {
      await updateCustomer({
        customerId: editingCustomer._id,
        ...data,
      });
      toast.success("Khách hàng đã được cập nhật!");
      setEditingCustomer(null);
      setActiveTab("list");
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.companyName}"?`)) {
      return;
    }

    try {
      await deleteCustomer({ customerId: customer._id });
      toast.success("Khách hàng đã được xóa!");
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setActiveTab("create");
  };

  const handleCancel = () => {
    setEditingCustomer(null);
    setActiveTab("list");
  };

  const getStatusBadge = (status: string) => {
    return status === "active" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  const getStatusText = (status: string) => {
    return status === "active" ? "Hoạt động" : "Không hoạt động";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Quản lý khách hàng</h2>
        {(canManageCustomers || canRequestCustomers) && (
          <button
            onClick={() => setActiveTab("create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {canManageCustomers ? "Thêm khách hàng" : "Yêu cầu tạo khách hàng"}
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("list")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "list"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Danh sách khách hàng ({customers?.length || 0})
          </button>
          
          {canManageCustomers && (
            <>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Lịch sử thay đổi
              </button>
              
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "requests"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Yêu cầu tạo khách hàng ({customerRequests?.filter(r => r.status === "pending").length || 0})
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === "list" && (
          <div className="p-6">
            {!customers || customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có khách hàng nào
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
                    {customers.map((customer) => (
                      <tr key={customer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              PM: {customer.projectManager}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.taxCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.region || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(customer.status)}`}>
                            {getStatusText(customer.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer._creationTime).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {canManageCustomers && (
                            <>
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomerId(customer._id);
                                  setActiveTab("history");
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                Lịch sử
                              </button>
                              {user.role === "admin" && (
                                <button
                                  onClick={() => handleDeleteCustomer(customer)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Xóa
                                </button>
                              )}
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
              {editingCustomer 
                ? "Cập nhật khách hàng" 
                : canManageCustomers 
                  ? "Thêm khách hàng mới" 
                  : "Yêu cầu tạo khách hàng mới"
              }
            </h3>
            <CustomerForm
              initialData={editingCustomer || undefined}
              onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
              onCancel={handleCancel}
              isLoading={isSubmitting}
              isRequest={!canManageCustomers}
            />
          </div>
        )}

        {activeTab === "history" && canManageCustomers && (
          <CustomerHistory selectedCustomerId={selectedCustomerId} />
        )}

        {activeTab === "requests" && canManageCustomers && (
          <CustomerRequests />
        )}
      </div>
    </div>
  );
}
