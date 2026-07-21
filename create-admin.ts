import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { createUser } from "./server/db";
import "dotenv/config";

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  const openId = `local_${nanoid(10)}`;

  await createUser({
    openId,
    name: "Administrador",
    email: "admin@admin.com",
    passwordHash,
    loginMethod: "local",
    role: "admin",
  });
  console.log("Admin user created!");
}

main().catch(console.error).then(() => process.exit(0));
