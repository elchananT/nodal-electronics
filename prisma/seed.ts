import { db } from "../src/server/db";
import { seedCatalog } from "../src/server/seed-catalog";

seedCatalog(db)
  .then((result) => {
    console.log(`Seeded ${result.categories} categories and ${result.products} products.`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
