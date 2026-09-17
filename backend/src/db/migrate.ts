import { db } from './knex.js';

const [batchNo, migrations] = await db.migrate.latest();
if (migrations.length === 0) {
  console.log('Nenhuma migration pendente.');
} else {
  console.log(`Batch ${batchNo} — migrations aplicadas:`);
  migrations.forEach((name: string) => console.log(`  - ${name}`));
}
await db.destroy();
