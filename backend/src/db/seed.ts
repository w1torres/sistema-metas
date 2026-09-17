import { db } from './knex.js';

const [names] = await db.seed.run();
console.log('Seeds executados:');
names.forEach((name: string) => console.log(`  - ${name}`));
await db.destroy();
