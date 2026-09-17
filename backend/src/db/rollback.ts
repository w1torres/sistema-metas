import { db } from './knex.js';

// `all: true` desfaz todas as migrations, não só o último batch — usado por
// db:reset para começar do zero.
const [batchNo, migrations] = await db.migrate.rollback({}, true);
if (migrations.length === 0) {
  console.log('Nenhuma migration para reverter.');
} else {
  console.log(`Batch ${batchNo} revertido — migrations desfeitas:`);
  migrations.forEach((name: string) => console.log(`  - ${name}`));
}
await db.destroy();
