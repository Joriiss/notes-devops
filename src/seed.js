require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Note = require('./models/note');

const DEFAULT_COUNT = 25;

function buildFakeNote(index) {
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

  return { title, content };
}

async function run() {
  const rawCount = process.argv[2];
  const count = Number.isFinite(Number(rawCount)) && Number(rawCount) > 0
    ? Math.floor(Number(rawCount))
    : DEFAULT_COUNT;

  await connectDB();

  try {
    console.log(`Seeding ${count} notes...`);
    await Note.deleteMany({});

    const payload = Array.from({ length: count }, (_, i) => buildFakeNote(i));
    await Note.insertMany(payload);

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();

