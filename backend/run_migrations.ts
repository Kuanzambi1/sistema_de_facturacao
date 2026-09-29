import { migrate } from 'drizzle-orm/mysql2/migrator';
import { getDb } from './db/connection.js';

async function run() {
  const db = await getDb();
  if (!db) {
    console.error("No database connection!");
    process.exit(1);
  }
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log("Migrations applied successfully!");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
