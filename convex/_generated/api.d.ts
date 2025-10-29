/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as customers from "../customers.js";
import type * as deliveryVouchers from "../deliveryVouchers.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as purchaseOrders from "../purchaseOrders.js";
import type * as router from "../router.js";
import type * as suppliers from "../suppliers.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  customers: typeof customers;
  deliveryVouchers: typeof deliveryVouchers;
  http: typeof http;
  inventory: typeof inventory;
  notifications: typeof notifications;
  orders: typeof orders;
  products: typeof products;
  purchaseOrders: typeof purchaseOrders;
  router: typeof router;
  suppliers: typeof suppliers;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
