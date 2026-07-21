import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { createUser } from "./server/db";
import "dotenv/config";

async function main() {
  const passwordHash = await bcrypt.hash("user123", 10);
  const openId = `local_${nanoid(10)}`;

  await createUser({
    openId,
    name: "Utilizador Normal",
    email: "user@user.com",
    passwordHash,
    loginMethod: "local",
    role: "user",
  });
  console.log("Normal user created!");
}

main().catch(console.error).then(() => process.exit(0));
