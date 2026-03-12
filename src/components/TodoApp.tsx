'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './TodoApp.module.css';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditState {
  id: string;
  title: string;
  description: string;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editState, setEditState] = useState<EditState | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      const data = await res.json();
      setTodos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setAddError('Title is required');
      return;
    }
    try {
      setAddLoading(true);
      setAddError(null);
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create todo');
      }
      const todo = await res.json();
      setTodos((prev) => [todo, ...prev]);
      setNewTitle('');
      setNewDescription('');
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to create todo');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    if (togglingId === todo.id) return;
    try {
      setTogglingId(todo.id);
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error('Failed to update todo');
      const updated = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update todo');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(id);
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete todo');
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete todo');
    } finally {
      setDeleteLoading(null);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditState({
      id: todo.id,
      title: todo.title,
      description: todo.description || '',
    });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditState(null);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editState) return;
    if (!editState.title.trim()) {
      setEditError('Title is required');
      return;
    }
    try {
      setEditLoading(true);
      setEditError(null);
      const res = await fetch(`/api/todos/${editState.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editState.title.trim(),
          description: editState.description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update todo');
      }
      const updated = await res.json();
      setTodos((prev) =>
        prev.map((t) => (t.id === editState.id ? updated : t))
      );
      setEditState(null);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to update todo');
    } finally {
      setEditLoading(false);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>📝 Todo App</h1>
        <p className={styles.subtitle}>
          {todos.length} task{todos.length !== 1 ? 's' : ''} &mdash;{' '}
          {completedCount} completed
        </p>
      </header>

      <main className={styles.main}>
        {/* Add Todo Form */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Add New Todo</h2>
          <form onSubmit={handleAdd} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>
                Title <span className={styles.required}>*</span>
              </label>
              <input
                id="title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                className={styles.input}
                disabled={addLoading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description..."
                className={styles.textarea}
                rows={2}
                disabled={addLoading}
              />
            </div>
            {addError && <p className={styles.errorMsg}>{addError}</p>}
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={addLoading}
            >
              {addLoading ? 'Adding...' : '+ Add Todo'}
            </button>
          </form>
        </section>

        {/* Todo List */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Your Todos</h2>
          {error && (
            <div className={styles.errorBanner}>
              <span>{error}</span>
              <button onClick={() => setError(null)} className={styles.closeBtn}>
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className={styles.emptyState}>
              <p>🎉 No todos yet! Add one above.</p>
            </div>
          ) : (
            <ul className={styles.todoList}>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`${styles.todoItem} ${
                    todo.completed ? styles.todoCompleted : ''
                  }`}
                >
                  {editState && editState.id === todo.id ? (
                    /* Edit Mode */
                    <div className={styles.editForm}>
                      <input
                        type="text"
                        value={editState.title}
                        onChange={(e) =>
                          setEditState({ ...editState, title: e.target.value })
                        }
                        className={styles.editInput}
                        placeholder="Title"
                        disabled={editLoading}
                        autoFocus
                      />
                      <textarea
                        value={editState.description}
                        onChange={(e) =>
                          setEditState({
                            ...editState,
                            description: e.target.value,
                          })
                        }
                        className={styles.editTextarea}
                        placeholder="Description (optional)"
                        rows={2}
                        disabled={editLoading}
                      />
                      {editError && (
                        <p className={styles.errorMsg}>{editError}</p>
                      )}
                      <div className={styles.editActions}>
                        <button
                          onClick={handleEditSave}
                          className={styles.btnSuccess}
                          disabled={editLoading}
                        >
                          {editLoading ? 'Saving...' : '✓ Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className={styles.btnSecondary}
                          disabled={editLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : deleteConfirm === todo.id ? (
                    /* Delete Confirmation */
                    <div className={styles.deleteConfirm}>
                      <p>Delete &ldquo;{todo.title}&rdquo;?</p>
                      <div className={styles.editActions}>
                        <button
                          onClick={() => handleDelete(todo.id)}
                          className={styles.btnDanger}
                          disabled={deleteLoading === todo.id}
                        >
                          {deleteLoading === todo.id ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className={styles.btnSecondary}
                          disabled={deleteLoading === todo.id}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal View */
                    <div className={styles.todoContent}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggle(todo)}
                          disabled={togglingId === todo.id}
                          className={styles.checkbox}
                        />
                        <span
                          className={`${styles.checkmark} ${
                            todo.completed ? styles.checkmarkDone : ''
                          }`}
                        />
                      </label>
                      <div className={styles.todoText}>
                        <span
                          className={`${styles.todoTitle} ${
                            todo.completed ? styles.todoTitleDone : ''
                          }`}
                        >
                          {todo.title}
                        </span>
                        {todo.description && (
                          <span className={styles.todoDescription}>
                            {todo.description}
                          </span>
                        )}
                        <span className={styles.todoDate}>
                          {new Date(todo.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className={styles.todoActions}>
                        <button
                          onClick={() => startEdit(todo)}
                          className={styles.btnEdit}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(todo.id)}
                          className={styles.btnDelete}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
