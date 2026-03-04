require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Note = require('./models/note');
const Category = require('./models/category');

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
  const { title, content, categoryIds } = body || {};
  const titleStr = typeof title === 'string' ? title.trim() : '';
  const contentStr = typeof content === 'string' ? content.trim() : '';
  if (!titleStr) return { valid: false, message: 'title is required and cannot be empty' };
  if (!contentStr) return { valid: false, message: 'content is required and cannot be empty' };
  const ids = Array.isArray(categoryIds)
    ? categoryIds.filter((id) => isValidId(id))
    : [];
  return { valid: true, title: titleStr, content: contentStr, categoryIds: ids };
}

// GET /ressources — list with pagination and optional filter/sort
app.get('/ressources', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by category (?categoryId=<id>)
    if (req.query.categoryId && isValidId(req.query.categoryId)) {
      filter.categories = req.query.categoryId;
    }

    // Text search on title/content (?q=term)
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const q = req.query.q.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [{ title: regex }, { content: regex }];
    }

    // Sorting (?sortBy=createdAt|title&direction=asc|desc)
    const sortBy = req.query.sortBy === 'title' ? 'title' : 'createdAt';
    const direction = req.query.direction === 'asc' ? 1 : -1;
    const sort = { [sortBy]: direction };

    const [items, total] = await Promise.all([
      Note.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('categories', 'name')
        .lean(),
      Note.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      items,
      total,
      page,
      limit,
      totalPages,
    });
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
    const note = await Note.findById(req.params.id).populate('categories', 'name');
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
    const note = await Note.create({
      title: validation.title,
      content: validation.content,
      categories: validation.categoryIds,
    });
    const populated = await Note.findById(note._id).populate('categories', 'name');
    res.status(201).json(populated);
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
      {
        title: validation.title,
        content: validation.content,
        categories: validation.categoryIds,
      },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name');
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

// ——— Categories ———
function validateCategoryBody(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return { valid: false, message: 'name is required and cannot be empty' };
  return { valid: true, name };
}

app.get('/categories', async (req, res) => {
  try {
    const list = await Category.find().sort({ name: 1 }).lean();
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/categories/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: 'Category not found' });
  }
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/categories', async (req, res) => {
  const validation = validateCategoryBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }
  try {
    const category = await Category.create({ name: validation.name });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/categories/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: 'Category not found' });
  }
  const validation = validateCategoryBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message });
  }
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: validation.name },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/categories/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(404).json({ error: 'Category not found' });
  }
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    await Note.updateMany(
      { categories: req.params.id },
      { $pull: { categories: req.params.id } }
    );
    res.status(200).json(category);
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

