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
  const [validationWarning, setValidationWarning] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchNotes(pageNum = page) {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${API}?page=${pageNum}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      setNotes(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setPage(data.page ?? pageNum);
    } catch (err) {
      setError(err.message);
      setNotes([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes(page);
  }, [page]);

  function clearForm() {
    setTitle('');
    setContent('');
    setEditingId(null);
    setValidationWarning(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const t = title.trim();
    const c = content.trim();

    if (!t && !c) {
      setValidationWarning('Please enter a title and content.');
      return;
    }
    if (!t) {
      setValidationWarning('Please enter a title.');
      return;
    }
    if (!c) {
      setValidationWarning('Please enter some content.');
      return;
    }

    setValidationWarning(null);
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
      setPage(1);
      await fetchNotes(1);
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
      await fetchNotes(page);
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
          onChange={(e) => {
            setTitle(e.target.value);
            setValidationWarning(null);
          }}
          className="input"
          aria-label="Title"
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setValidationWarning(null);
          }}
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
        {validationWarning && (
          <p className="validation-warning" role="alert">
            {validationWarning}
          </p>
        )}
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : notes.length === 0 && total === 0 ? (
        <p className="muted">No notes yet. Add one above.</p>
      ) : (
        <>
        <ul className="list">
          {notes.map((note) => (
            <li key={note._id} className="card">
              <div className="card-body">
                <h2 className="card-title">{note.title}</h2>
                {note.createdAt && (
                  <p className="card-meta">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                )}
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
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Notes pagination">
            <p className="pagination-info">
              Page {page} of {totalPages}
              {total > 0 && ` · ${total} note${total !== 1 ? 's' : ''} total`}
            </p>
            <div className="pagination-actions">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </nav>
        )}
        </>
      )}
    </>
  );
}
