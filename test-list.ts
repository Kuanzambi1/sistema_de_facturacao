import { listInvoices } from "./backend/db/invoices";
import { getDb } from "./backend/db/connection";

async function run() {
  console.log("Starting test...");
  try {
    const res = await listInvoices(1, { page: 1, limit: 15 });
    console.log("Found", res.total, "invoices");
    console.log(res.data.slice(0, 1));
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

run();
