import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface CustomerDropdownProps {
  value?: { customerId: string; customerName: string } | null;
  onChange: (v: { customerId: string; customerName: string } | null) => void;
  disabled?: boolean;
}

export function CustomerDropdown({ value, onChange, disabled }: CustomerDropdownProps) {
  const customers = useQuery(api.customers.getCustomers);

  const options = useMemo(() => {
    return (customers || [])
      .filter((c: any) => c.status === "active")
      .map((c: any) => ({
        id: String(c.taxCode), // use taxCode as order.customerId per existing logic
        label: `${c.companyName} (${c.taxCode})`,
        name: c.companyName,
      }));
  }, [customers]);

  return (
    <select
      aria-label="Select customer"
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      value={value?.customerId ?? ""}
      onChange={(e) => {
        const selected = options.find((o) => o.id === e.target.value);
        if (!selected) return onChange(null);
        onChange({ customerId: selected.id, customerName: selected.name });
      }}
      disabled={disabled}
    >
      <option value="">Select a customer...</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

