import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { categories, words } from './src/infrastructure/persistence/postgres/schema.js';
import { dictionaryData } from './src/infrastructure/data/dictionary.js';

/**
 * Seed the database with initial data
 * Run with: npx tsx seed.ts
 */
async function seed() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://app:secret@localhost:5432/translator';
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  console.log('🌱 Seeding database...');

  try {
    // 1. Extract unique categories from dictionary
    const uniqueCategories = [...new Set(dictionaryData.map((w) => w.category))];

    console.log(`📁 Inserting ${uniqueCategories.length} categories...`);

    // 2. Insert categories and get their IDs
    const insertedCategories = await db
      .insert(categories)
      .values(uniqueCategories.map((name) => ({ name })))
      .onConflictDoNothing()
      .returning();

    // Build category name -> ID map
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

    console.log(`📝 Inserting ${dictionaryData.length} words...`);

    // 3. Insert words
    const wordValues = dictionaryData.map((word) => ({
      polish: word.polish,
      english: word.english,
      categoryId: categoryMap.get(word.category)!,
      difficulty: word.difficulty,
    }));

    await db.insert(words).values(wordValues).onConflictDoNothing();

    console.log('✅ Seeding complete!');

    // Show summary
    const wordCount = await db.select({ count: words.id }).from(words);
    const catCount = await db.select({ count: categories.id }).from(categories);

    console.log(`\n📊 Summary:`);
    console.log(`   Categories: ${allCategories.length}`);
    console.log(`   Words: ${dictionaryData.length}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
