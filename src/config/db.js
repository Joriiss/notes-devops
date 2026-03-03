const mongoose = require('mongoose');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notes-devops';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

module.exports = {
  connectDB,
};

