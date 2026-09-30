import { getDb } from './db/connection.js';
import { vatExemptionReasons } from './drizzle/schema.js';

const defaultExemptions = [
  { code: 'M01', description: 'Artigo 14.º (Isenção nas Exportações)', legalBasis: 'Artigo 14.º' },
  { code: 'M02', description: 'Artigo 15.º (Isenção nas Operações Internacionais)', legalBasis: 'Artigo 15.º' },
  { code: 'M04', description: 'Artigo 12.º (Isenção nas Importações)', legalBasis: 'Artigo 12.º' },
  { code: 'M11', description: 'Regime de Exclusão', legalBasis: 'Regime de Exclusão' },
  { code: 'M12', description: 'Transmissões de bens e prestações de serviços não sujeitas a IVA', legalBasis: 'Não sujeito a IVA' },
  { code: 'M13', description: 'Regime de Não Sujeição', legalBasis: 'Regime de Não Sujeição' }
];

async function run() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }
  
  for (const ex of defaultExemptions) {
    try {
      await db.insert(vatExemptionReasons).values({
        tenantId: 1,
        code: ex.code,
        description: ex.description,
        legalBasis: ex.legalBasis
      });
      console.log(`Inserted ${ex.code}`);
    } catch (e) {
      console.log(`Error inserting ${ex.code}:`, e.message);
    }
  }

  process.exit(0);
}
run();
