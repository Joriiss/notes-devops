require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Note = require('./models/note');
const Category = require('./models/category');

const DEFAULT_COUNT = 25;

const SEED_CATEGORIES = ['Work', 'Personal', 'Ideas', 'Archive'];

function buildFakeNote(index, categoryIds) {
  const titles = [
    'Meeting notes',
    'Random idea',
    'Todo list',
    'Quick thought',
    'Daily log',
  ];
  const contents = [
    'Remember to refactor the API.',
    'Check pipeline status before deploying.',
    'Write documentation for the new feature.',
    'Investigate performance of the notes listing.',
    'Try adding tags or labels later.',
  ];
  const title = `${titles[index % titles.length]} #${index + 1}`;
  const content = contents[index % contents.length];
  const categories = categoryIds.length
    ? [categoryIds[index % categoryIds.length]]
    : [];
  return { title, content, categories };
}

/** Run seed (assumes DB is already connected). Used by CLI and by server on startup. */
async function seedData(count = DEFAULT_COUNT) {
  console.log('Seeding categories...');
  await Category.deleteMany({});
  const categories = await Category.insertMany(
    SEED_CATEGORIES.map((name) => ({ name }))
  );
  const categoryIds = categories.map((c) => c._id);

  console.log(`Seeding ${count} notes...`);
  await Note.deleteMany({});
  const payload = Array.from({ length: count }, (_, i) =>
    buildFakeNote(i, categoryIds)
  );
  await Note.insertMany(payload);
  console.log('Seeding complete.');
}

async function run() {
  const rawCount = process.argv[2];
  const count =
    Number.isFinite(Number(rawCount)) && Number(rawCount) > 0
      ? Math.floor(Number(rawCount))
      : DEFAULT_COUNT;

  await connectDB();

  try {
    await seedData(count);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// CLI: node src/seed.js [count]
if (require.main === module) {
  run();
}

module.exports = { seedData, DEFAULT_COUNT, SEED_CATEGORIES };

