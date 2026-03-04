import { useState, useEffect } from 'react';
import './App.css';

const API = '/ressources';
const CATEGORIES_API = '/categories';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [validationWarning, setValidationWarning] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [direction, setDirection] = useState('desc');

  function buildNotesUrl(pageNum) {
    const params = new URLSearchParams();
    params.set('page', String(pageNum));
    params.set('limit', String(limit));
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (filterCategoryId) params.set('categoryId', filterCategoryId);
    params.set('sortBy', sortBy);
    params.set('direction', direction);
    return `${API}?${params.toString()}`;
  }

  async function fetchNotes(pageNum = page) {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(buildNotesUrl(pageNum));
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

  async function fetchCategories() {
    try {
      const res = await fetch(CATEGORIES_API);
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategories([]);
    }
  }

  useEffect(() => {
    fetchNotes(page);
  }, [page, searchQuery, filterCategoryId, sortBy, direction]);

  useEffect(() => {
    fetchCategories();
  }, []);

  function clearForm() {
    setTitle('');
    setContent('');
    setSelectedCategoryIds([]);
    setEditingId(null);
    setValidationWarning(null);
  }

  function toggleCategory(id) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setCategoryError(null);
    try {
      const res = await fetch(CATEGORIES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');
      setNewCategoryName('');
      await fetchCategories();
    } catch (err) {
      setCategoryError(err.message);
    }
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
          body: JSON.stringify({ title: t, content: c, categoryIds: selectedCategoryIds }),
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: t, content: c, categoryIds: selectedCategoryIds }),
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
    setSelectedCategoryIds(
      (note.categories || []).map((c) => (typeof c === 'object' ? c._id : c))
    );
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
        {categories.length > 0 && (
          <div className="form-group">
            <span className="form-label">Categories</span>
            <div className="category-chips">
              {categories.map((cat) => (
                <label key={cat._id} className="category-chip">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(cat._id)}
                    onChange={() => toggleCategory(cat._id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
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

      <section className="category-create">
        <h2 className="category-create-title">Create category</h2>
        <form onSubmit={handleCreateCategory} className="category-create-form">
          <input
            type="text"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="input category-create-input"
            aria-label="New category name"
          />
          <button type="submit" className="btn btn-primary">
            Add category
          </button>
        </form>
        {categoryError && (
          <p className="error" role="alert">
            {categoryError}
          </p>
        )}
      </section>

      <section className="filter-bar" aria-label="Filter and sort notes">
        <input
          type="search"
          placeholder="Search notes…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="input filter-search"
          aria-label="Search in title and content"
        />
        <select
          value={filterCategoryId}
          onChange={(e) => {
            setFilterCategoryId(e.target.value);
            setPage(1);
          }}
          className="input filter-select"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={`${sortBy}-${direction}`}
          onChange={(e) => {
            const [s, d] = e.target.value.split('-');
            setSortBy(s);
            setDirection(d);
            setPage(1);
          }}
          className="input filter-select"
          aria-label="Sort notes"
        >
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="title-asc">Title A–Z</option>
          <option value="title-desc">Title Z–A</option>
        </select>
      </section>

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
                {(note.categories || []).length > 0 && (
                  <p className="card-categories">
                    {(note.categories || [])
                      .map((c) => (typeof c === 'object' && c ? c.name : null))
                      .filter(Boolean)
                      .join(', ')}
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
