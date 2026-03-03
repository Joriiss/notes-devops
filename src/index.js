require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Note = require('./models/note');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

function validateNoteBody(body) {
  const { title, content } = body || {};
  const titleStr = typeof title === 'string' ? title.trim() : '';
  const contentStr = typeof content === 'string' ? content.trim() : '';
  if (!titleStr) return { valid: false, message: 'title is required and cannot be empty' };
  if (!contentStr) return { valid: false, message: 'content is required and cannot be empty' };
  return { valid: true, title: titleStr, content: contentStr };
}

// GET /ressources — list all
app.get('/ressources', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ressources/:id — get one by id
app.get('/ressources/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: 'Note not found' });
  }
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ressources — create
app.post('/ressources', async (req, res) => {
  const validation = validateNoteBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }
  try {
    const note = await Note.create({ title: validation.title, content: validation.content });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /ressources/:id — update
app.put('/ressources/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: 'Note not found' });
  }
  const validation = validateNoteBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title: validation.title, content: validation.content },
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /ressources/:id — delete
app.delete('/ressources/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: 'Note not found' });
  }
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve React build when present (production)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*path}', (req, res, next) => {
    if (req.accepts('html')) {
      res.sendFile(path.join(clientDist, 'index.html'));
    } else {
      next();
    }
  });
}

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('  GET  /health      -> health check');
    console.log('  GET  /ressources  -> list notes');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

