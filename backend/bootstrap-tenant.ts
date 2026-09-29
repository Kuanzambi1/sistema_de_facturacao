import mysql from "mysql2/promise";
import "dotenv/config";

const TABLES = [
  "users",
  "clients",
  "suppliers",
  "products",
  "product_categories",
  "company",
  "invoices",
  "invoice_items",
  "invoice_series",
  "inventory_movements",
  "payments",
  "recurring_rules",
  "audit_logs",
  "agt_submissions",
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não configurado.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const [tenants] = await conn.query("SELECT COUNT(*) AS c FROM tenants");
  const tenantCount = (tenants as any)[0]?.c ?? 0;

  let tenantId: number;
  if (tenantCount === 0) {
    const [companyRows] = await conn.query("SELECT name, nif, phone FROM company LIMIT 1");
    const company = (companyRows as any[])[0];
    const [result] = await conn.query(
      "INSERT INTO tenants (name, nif, plan, status, trialEndsAt) VALUES (?, ?, 'pro', 'ativo', DATE_ADD(NOW(), INTERVAL 30 DAY))",
      [company?.name ?? "Empresa Demo", company?.nif ?? null]
    );
    tenantId = (result as any).insertId;
    console.log(`Tenant criado: id=${tenantId} (${company?.name ?? "Empresa Demo"})`);
  } else {
    const [first] = await conn.query("SELECT id FROM tenants ORDER BY id LIMIT 1");
    tenantId = (first as any)[0]?.id;
    console.log(`Tenant existente: id=${tenantId}`);
  }

  for (const table of TABLES) {
    const [result] = await conn.query(
      `UPDATE ?? SET tenantId = ? WHERE tenantId IS NULL OR tenantId = 0`,
      [table, tenantId]
    );
    const affected = (result as any).affectedRows ?? 0;
    console.log(`Backfill ${table}: ${affected} linha(s)`);
  }

  const [exemptions] = await conn.query("SELECT COUNT(*) AS c FROM vat_exemption_reasons WHERE tenantId = ?", [tenantId]);
  if (((exemptions as any)[0]?.c ?? 0) === 0) {
    const reasons = [
      { code: "M00", description: "Regime de IVA de Caixa (A VALIDAR COM AGT)", legalBasis: "Art. 32.º do RIVA" },
      { code: "M01", description: "Isento Art. 12.º do CIVA (A VALIDAR COM AGT)", legalBasis: "Art. 12.º do CIVA" },
      { code: "M02", description: "Isento Art. 13.º do CIVA (A VALIDAR COM AGT)", legalBasis: "Art. 13.º do CIVA" }
    ];
    for (const r of reasons) {
      await conn.query(
        "INSERT INTO vat_exemption_reasons (tenantId, code, description, legalBasis) VALUES (?, ?, ?, ?)",
        [tenantId, r.code, r.description, r.legalBasis]
      );
    }
    console.log("Adicionados motivos de isenção por defeito.");
  }

  await conn.end();
  console.log("Bootstrap concluído.");
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
