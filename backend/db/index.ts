/**
 * Database access layer — re-exports from entity modules.
 *
 * Each module (clients.ts, invoices.ts, etc.) contains functions
 * for a single domain. This barrel file preserves the single-import
 * convention used throughout the codebase:
 *
 *   import * as db from "./db";
 */

export { getDb } from "./connection";
export * from "./tenants";
export * from "./users";
export * from "./company";
export * from "./clients";
export * from "./suppliers";
export * from "./products";
export * from "./series";
export * from "./invoices";
export * from "./recurring";
export * from "./audit";
export * from "./agt";
export * from "./inventory";
export * from "./reports";
