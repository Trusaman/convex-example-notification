import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface SupplierDropdownProps {
  value?: { supplierId: string; companyName: string } | null;
  onChange: (v: { supplierId: string; companyName: string } | null) => void;
}

export function SupplierDropdown({ value, onChange }: SupplierDropdownProps) {
  const suppliers = useQuery(api.suppliers.getSuppliers);

  const options = useMemo(() => {
    return (suppliers || [])
      .filter((s: any) => s.status === "active")
      .map((s: any) => ({ id: String(s._id), label: s.companyName }));
  }, [suppliers]);

  return (
    <select
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      value={value?.supplierId ?? ""}
      onChange={(e) => {
        const selected = options.find((o) => o.id === e.target.value);
        if (!selected) return onChange(null);
        onChange({ supplierId: selected.id, companyName: selected.label });
      }}
    >
      <option value="">Select a supplier...</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

