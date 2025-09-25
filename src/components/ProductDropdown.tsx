import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ProductDropdownProps {
    value?: {
        productId: string;
        productName: string;
        unitPrice: number;
    } | null;
    onChange: (
        v: { productId: string; productName: string; unitPrice: number } | null
    ) => void;
}

export function ProductDropdown({ value, onChange }: ProductDropdownProps) {
    const products = useQuery(api.products.getActiveProducts);

    const options = useMemo(() => {
        return (products || []).map((p) => ({
            id: p.productCode, // use productCode as productId for now
            label: `${p.productCode} — ${p.productName}`,
            unitPrice: p.unitPrice,
        }));
    }, [products]);

    return (
        <select
            aria-label="Select product"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={value?.productId ?? ""}
            onChange={(e) => {
                const selected = options.find((o) => o.id === e.target.value);
                if (!selected) return onChange(null);
                onChange({
                    productId: selected.id,
                    productName: selected.label,
                    unitPrice: selected.unitPrice,
                });
            }}
        >
            <option value="">Select a product...</option>
            {options.map((o) => (
                <option key={o.id} value={o.id}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}
