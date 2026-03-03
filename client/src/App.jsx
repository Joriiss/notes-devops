import { useState, useEffect } from 'react';
import './App.css';

const API = '/ressources';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  async function fetchNotes() {
    try {
      setError(null);
      const res = await fetch(API);
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  function clearForm() {
    setTitle('');
    setContent('');
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) return;

    try {
      setError(null);
      if (editingId) {
        const res = await fetch(`${API}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: t, content: c }),
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: t, content: c }),
        });
        if (!res.ok) throw new Error('Failed to create');
      }
      clearForm();
      await fetchNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this note?')) return;
    try {
      setError(null);
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      if (editingId === id) clearForm();
      await fetchNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(note) {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content);
  }

  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>Notes</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Add, edit and delete notes.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          aria-label="Title"
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input textarea"
          rows={2}
          aria-label="Content"
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={clearForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="muted">No notes yet. Add one above.</p>
      ) : (
        <ul className="list">
          {notes.map((note) => (
            <li key={note._id} className="card">
              <div className="card-body">
                <h2 className="card-title">{note.title}</h2>
                <p className="card-content">{note.content}</p>
              </div>
              <div className="card-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => startEdit(note)}
                  aria-label={`Edit ${note.title}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(note._id)}
                  aria-label={`Delete ${note.title}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
