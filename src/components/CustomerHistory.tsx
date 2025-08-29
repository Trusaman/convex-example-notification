import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface CustomerHistoryProps {
  selectedCustomerId?: Id<"customers"> | null;
}

export function CustomerHistory({ selectedCustomerId }: CustomerHistoryProps) {
  const specificCustomerHistory = useQuery(
    api.customers.getCustomerHistory,
    selectedCustomerId ? { customerId: selectedCustomerId } : "skip"
  );
  
  const allCustomerHistory = useQuery(
    api.customers.getAllCustomerHistory,
    selectedCustomerId ? "skip" : {}
  );
  
  const customerHistory = selectedCustomerId ? specificCustomerHistory : allCustomerHistory;

  const getActionText = (action: string) => {
    const actions: Record<string, string> = {
      created: "Tạo mới",
      updated: "Cập nhật",
      deleted: "Xóa",
      created_from_request: "Tạo từ yêu cầu",
    };
    return actions[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: "bg-green-100 text-green-800",
      updated: "bg-blue-100 text-blue-800",
      deleted: "bg-red-100 text-red-800",
      created_from_request: "bg-purple-100 text-purple-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  const formatChanges = (changes: any) => {
    if (!changes) return null;

    return Object.entries(changes).map(([key, value]: [string, any]) => {
      if (typeof value === "object" && value.from && value.to) {
        return (
          <div key={key} className="text-sm">
            <span className="font-medium">{getFieldName(key)}:</span>{" "}
            <span className="text-red-600">"{value.from}"</span> → <span className="text-green-600">"{value.to}"</span>
          </div>
        );
      } else {
        return (
          <div key={key} className="text-sm">
            <span className="font-medium">{getFieldName(key)}:</span> {value}
          </div>
        );
      }
    });
  };

  const getFieldName = (field: string) => {
    const fieldNames: Record<string, string> = {
      companyName: "Tên công ty",
      taxCode: "Mã số thuế",
      status: "Trạng thái",
      requestedBy: "Yêu cầu bởi",
    };
    return fieldNames[field] || field;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">
          {selectedCustomerId ? "Lịch sử thay đổi khách hàng" : "Lịch sử thay đổi tất cả khách hàng"}
        </h3>
      </div>

      {!customerHistory || customerHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có lịch sử thay đổi nào
        </div>
      ) : (
        <div className="space-y-4">
          {customerHistory.map((history) => (
            <div key={history._id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(history.action)}`}>
                    {getActionText(history.action)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {history.performedByName}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {history.performedByRole.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(history.timestamp).toLocaleString("vi-VN")}
                </div>
              </div>

              {history.changes && (
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm font-medium text-gray-700 mb-2">Thay đổi:</div>
                  <div className="space-y-1">
                    {formatChanges(history.changes)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
