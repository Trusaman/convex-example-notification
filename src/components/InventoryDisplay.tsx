import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface InventoryDisplayProps {
  productCodes: string[];
  quantities?: Record<string, number>; // requested quantity per productCode
}

export function InventoryDisplay({ productCodes, quantities }: InventoryDisplayProps) {
  const products = useQuery(api.products.getProductsByCodes, { codes: productCodes });

  const map = useMemo(() => {
    const m: Record<string, { stock: number; unitPrice: number; name: string }> = {};
    for (const p of products || []) {
      m[p.productCode] = { stock: p.stockQuantity, unitPrice: p.unitPrice, name: p.productName };
    }
    return m;
  }, [products]);

  if (!products) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
      <p className="font-medium mb-2">Inventory status</p>
      <ul className="space-y-1 text-sm">
        {productCodes.map((code) => {
          const info = map[code];
          const requested = quantities?.[code] ?? 0;
          const ok = info && info.stock >= requested;
          return (
            <li key={code} className={ok ? "text-gray-800" : "text-red-600 font-medium"}>
              {code}: {info ? `${info.name} — In stock ${info.stock}` : "Unknown product"}
              {requested > 0 && ` • Requested ${requested}`}
              {!ok && requested > 0 && " • Shortage"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

