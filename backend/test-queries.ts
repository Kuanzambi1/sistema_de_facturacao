import { getDb } from './db/connection.js';
import { invoices, company, vatExemptionReasons } from './drizzle/schema.js';

async function run() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }
  
  try {
    await db.select().from(invoices).limit(1);
    console.log("invoices OK");
  } catch (e) { console.error("invoices ERROR", e.message); }

  try {
    await db.select().from(company).limit(1);
    console.log("company OK");
  } catch (e) { console.error("company ERROR", e.message); }

  try {
    await db.select().from(vatExemptionReasons).limit(1);
    console.log("vatExemptionReasons OK");
  } catch (e) { console.error("vatExemptionReasons ERROR", e.message); }

  process.exit(0);
}
run();
