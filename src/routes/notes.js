const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/note');

const router = express.Router();

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

// GET /ressources — list all (match both '' and '/' for mounted path)
const listNotes = async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/', listNotes);
router.get('', listNotes);

// GET /notes/:id — get one by id
router.get('/:id', async (req, res) => {
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

// POST /notes — create
router.post('/', async (req, res) => {
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

// PUT /notes/:id — update
router.put('/:id', async (req, res) => {
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

// DELETE /notes/:id — delete
router.delete('/:id', async (req, res) => {
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

module.exports = router;
