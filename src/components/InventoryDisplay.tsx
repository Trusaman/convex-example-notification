import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface InventoryDisplayProps {
    productCodes?: string[];
    productIds?: string[]; // Convex product _id as string OR legacy productCode strings
    quantities?: Record<string, number>; // requested quantity keyed by the provided keys
}

function isLikelyConvexId(id: string) {
    // Heuristic: Convex document IDs are long strings. Product codes in this app are short like "BMT" or "AMKKASD".
    return typeof id === "string" && id.length >= 16;
}

export function InventoryDisplay({
    productCodes,
    productIds,
    quantities,
}: InventoryDisplayProps) {
    // Prefer explicit productCodes if provided; otherwise treat productIds as either IDs or legacy codes
    const providedKeys =
        productCodes && productCodes.length > 0
            ? productCodes
            : productIds || [];

    const codeKeys = useMemo(
        () => providedKeys.filter((k) => !isLikelyConvexId(k)),
        [providedKeys]
    );
    const idKeys = useMemo(
        () => providedKeys.filter((k) => isLikelyConvexId(k)),
        [providedKeys]
    );

    const productsByCodes = codeKeys.length
        ? useQuery(api.products.getProductsByCodes, { codes: codeKeys })
        : undefined;

    const productsByIdsResults = idKeys.length
        ? idKeys.map((id) =>
              useQuery(api.products.getProduct, { productId: id as any })
          )
        : undefined;

    const products = useMemo(() => {
        const list: any[] = [];
        if (Array.isArray(productsByCodes)) list.push(...productsByCodes);
        if (Array.isArray(productsByIdsResults)) {
            for (const p of productsByIdsResults) if (p) list.push(p);
        }
        return list;
    }, [productsByCodes, productsByIdsResults]);

    const map = useMemo(() => {
        const m: Record<
            string,
            { stock: number; unitPrice: number; name: string; code: string }
        > = {};
        for (const p of products || []) {
            // Map by both identifiers so callers can look up using either code or id string
            m[String(p._id)] = {
                stock: p.stockQuantity,
                unitPrice: p.unitPrice,
                name: p.productName,
                code: p.productCode,
            };
            if (p.productCode) {
                m[p.productCode] = {
                    stock: p.stockQuantity,
                    unitPrice: p.unitPrice,
                    name: p.productName,
                    code: p.productCode,
                };
            }
        }
        return m;
    }, [products]);

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="font-medium mb-2">Inventory status</p>
            <ul className="space-y-1 text-sm">
                {providedKeys.map((k) => {
                    const info = map[k];
                    const requested = quantities?.[k] ?? 0;
                    const ok = info && info.stock >= requested;
                    return (
                        <li
                            key={k}
                            className={
                                ok
                                    ? "text-gray-800"
                                    : "text-red-600 font-medium"
                            }
                        >
                            {info
                                ? `${info.code} — ${info.name} — In stock ${info.stock}`
                                : "Unknown product"}
                            {requested > 0 && ` • Requested ${requested}`}
                            {!ok && requested > 0 && " • Shortage"}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
