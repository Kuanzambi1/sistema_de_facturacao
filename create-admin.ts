import bcrypt from "bcryptjs";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { createUser, createTenant, upsertCompany, getUserByEmail } from "./server/db";
import "dotenv/config";

async function main() {
  const email = "admin@admin.com";

  const existing = await getUserByEmail(email);
  if (existing) {
    console.log(`Utilizador ${email} já existe (id=${existing.id}, tenantId=${existing.tenantId}).`);
    if (existing.tenantId) {
      console.log("Já tem tenant associado. Use as credenciais existentes.");
    } else {
      console.log("SEM tenant — precisa de eliminar e recriar.");
    }
    process.exit(1);
  }

  const password = crypto.randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);
  const openId = `local_${nanoid(10)}`;

  const tenant = await createTenant({ name: "Admin Empresa", nif: "000000000" });
  if (!tenant) throw new Error("Não foi possível criar o tenant.");
  const tenantId = tenant.id;

  await upsertCompany(tenantId, {
    name: "Admin Empresa",
    nif: "000000000",
    phone: "",
    email,
  });

  const user = await createUser({
    openId,
    tenantId,
    name: "Administrador",
    email,
    passwordHash,
    loginMethod: "local",
    role: "admin",
  });

  if (!user) throw new Error("Não foi possível criar o utilizador.");

  console.log("\n=== ADMIN CRIADO COM SUCESSO ===");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Tenant:   ${tenantId}`);
  console.log("GUARDE ESTA PASSWORD — não será mostrada novamente.\n");
}

main().catch(console.error).then(() => process.exit(0));
