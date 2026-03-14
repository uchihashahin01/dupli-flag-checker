import { useState } from 'react';
import './SessionList.css';

export default function SessionList({ sessions, activeId, onSelect, onCreate, onDelete }) {
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filteredSessions = sessions.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewName('');
    setShowCreate(false);
  };

  return (
    <aside className="session-list" id="session-list">
      <div className="session-list__header">
        <div className="session-list__brand">
          <span className="session-list__logo">🚩</span>
          <h1 className="session-list__title">DupliFlag</h1>
        </div>
        <p className="session-list__subtitle">CTF Flag Tracker</p>
      </div>

      <div className="session-list__search-wrap">
        <svg className="session-list__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          id="session-search"
          type="text"
          className="session-list__search"
          placeholder="Search challenges..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="session-list__items">
        {filteredSessions.length === 0 && (
          <div className="session-list__empty">
            {sessions.length === 0
              ? 'No challenges yet. Create one to get started!'
              : 'No matches found.'}
          </div>
        )}
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className={`session-card ${session.id === activeId ? 'session-card--active' : ''}`}
            onClick={() => onSelect(session.id)}
            id={`session-${session.id}`}
          >
            <div className="session-card__info">
              <span className="session-card__name">{session.name}</span>
              <span className="session-card__count">
                {session.flags.length} flag{session.flags.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              className="session-card__delete"
              onClick={e => { e.stopPropagation(); onDelete(session.id); }}
              title="Delete challenge"
              id={`delete-session-${session.id}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {showCreate ? (
        <form className="session-list__create-form" onSubmit={handleCreate}>
          <input
            id="new-session-input"
            type="text"
            className="session-list__create-input"
            placeholder="Challenge name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
          />
          <div className="session-list__create-actions">
            <button type="submit" className="btn btn--primary btn--sm" id="create-session-submit">Create</button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setShowCreate(false); setNewName(''); }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button
          className="session-list__create-btn"
          onClick={() => setShowCreate(true)}
          id="new-session-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Challenge
        </button>
      )}
    </aside>
  );
}
