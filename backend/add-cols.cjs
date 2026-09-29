const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection('mysql://root:@localhost:3306/faturacao');
  try {
    await c.query('ALTER TABLE invoices ADD operatorName varchar(255)');
    console.log('Added operatorName');
  } catch (e) { console.log('operatorName:', e.message); }
  
  try {
    await c.query(`CREATE TABLE \`vat_exemption_reasons\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`tenantId\` int NOT NULL,
      \`code\` varchar(10) NOT NULL,
      \`description\` varchar(255) NOT NULL,
      \`legalBasis\` varchar(255) NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`vat_exemption_reasons_id\` PRIMARY KEY(\`id\`)
    )`);
    console.log('Created vat_exemption_reasons');
  } catch (e) { console.log('vat_exemption_reasons:', e.message); }

  await c.end();
}
run();
