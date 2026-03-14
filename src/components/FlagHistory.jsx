import { useRef, useState } from 'react';
import './FlagHistory.css';

export default function FlagHistory({ flags, onDelete, sessionName, onExport, onImport }) {
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);

  const handleCopy = async (flag) => {
    try {
      await navigator.clipboard.writeText(flag.value);
      setCopiedId(flag.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = flag.value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(flag.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' · ' +
      d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handlePickImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
    e.target.value = '';
  };

  if (!sessionName) {
    return (
      <div className="flag-history flag-history--empty-state">
        <div className="flag-history__hero">
          <div className="flag-history__hero-icon">🏁</div>
          <h2 className="flag-history__hero-title">Welcome to DupliFlag</h2>
          <p className="flag-history__hero-desc">
            Create or select a CTF challenge from the sidebar to start tracking your flag submissions.
          </p>
          <div className="flag-history__features">
            <div className="flag-history__feature">
              <span className="flag-history__feature-icon">🔍</span>
              <span>Instant duplicate detection</span>
            </div>
            <div className="flag-history__feature">
              <span className="flag-history__feature-icon">💾</span>
              <span>Offline persistence</span>
            </div>
            <div className="flag-history__feature">
              <span className="flag-history__feature-icon">📋</span>
              <span>One-click copy</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flag-history" id="flag-history">
      <div className="flag-history__header">
        <h2 className="flag-history__title">
          <span className="flag-history__title-icon">📝</span>
          {sessionName}
        </h2>
        <div className="flag-history__header-actions">
          <span className="flag-history__badge">
            {flags.length} submitted
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={handlePickImportFile}
            title="Import challenge flags JSON"
            id="import-flags-btn"
          >
            Import
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onExport}
            title="Export challenge flags JSON"
            id="export-flags-btn"
          >
            Export
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportChange}
            className="flag-history__file-input"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>

      {flags.length === 0 ? (
        <div className="flag-history__no-flags">
          <div className="flag-history__no-flags-icon">🎯</div>
          <p>No flags submitted yet for this challenge.</p>
          <p className="flag-history__no-flags-hint">Paste your first flag above!</p>
        </div>
      ) : (
        <div className="flag-history__list">
          {[...flags].reverse().map((flag, index) => (
            <div
              key={flag.id}
              className="flag-entry"
              style={{ animationDelay: `${index * 0.03}s` }}
              id={`flag-${flag.id}`}
            >
              <div className="flag-entry__index">#{flags.length - index}</div>
              <div className="flag-entry__content">
                <code className="flag-entry__value">{flag.value}</code>
                <span className="flag-entry__time">{formatTime(flag.timestamp)}</span>
              </div>
              <div className="flag-entry__actions">
                <button
                  className={`flag-entry__btn ${copiedId === flag.id ? 'flag-entry__btn--copied' : ''}`}
                  onClick={() => handleCopy(flag)}
                  title="Copy flag"
                >
                  {copiedId === flag.id ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
                <button
                  className="flag-entry__btn flag-entry__btn--delete"
                  onClick={() => onDelete(flag.id)}
                  title="Remove flag"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
