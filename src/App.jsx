import { useState, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import SessionList from './components/SessionList';
import FlagInput from './components/FlagInput';
import FlagHistory from './components/FlagHistory';
import Toast from './components/Toast';
import './App.css';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function App() {
  const [sessions, setSessions] = useLocalStorage('dupliflag-sessions', []);
  const [activeSessionId, setActiveSessionId] = useLocalStorage('dupliflag-active', null);
  const [toasts, setToasts] = useState([]);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const addToast = useCallback((message, type = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const createSession = useCallback((name) => {
    const duplicate = sessions.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      addToast(`Challenge "${name}" already exists!`, 'warning');
      return;
    }
    const newSession = { id: generateId(), name, flags: [], createdAt: Date.now() };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    addToast(`Challenge "${name}" created!`, 'success');
    setMobileShowSidebar(false);
  }, [sessions, setSessions, setActiveSessionId, addToast]);

  const deleteSession = useCallback((id) => {
    const session = sessions.find(s => s.id === id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
    if (session) {
      addToast(`Challenge "${session.name}" deleted`, 'info');
    }
  }, [sessions, activeSessionId, setSessions, setActiveSessionId, addToast]);

  const selectSession = useCallback((id) => {
    setActiveSessionId(id);
    setMobileShowSidebar(false);
  }, [setActiveSessionId]);

  const submitFlag = useCallback((flagValue) => {
    if (!activeSession) return;

    const isDuplicate = activeSession.flags.some(
      f => f.value.toLowerCase() === flagValue.toLowerCase()
    );

    if (isDuplicate) {
      addToast('⚠ Duplicate flag! You already submitted this one. Try another.', 'warning');
      return;
    }

    const newFlag = {
      id: generateId(),
      value: flagValue,
      timestamp: Date.now(),
    };

    setSessions(prev =>
      prev.map(s =>
        s.id === activeSessionId
          ? { ...s, flags: [...s.flags, newFlag] }
          : s
      )
    );

    addToast('Flag submitted successfully!', 'success');
  }, [activeSession, activeSessionId, setSessions, addToast]);

  const deleteFlag = useCallback((flagId) => {
    setSessions(prev =>
      prev.map(s =>
        s.id === activeSessionId
          ? { ...s, flags: s.flags.filter(f => f.id !== flagId) }
          : s
      )
    );
  }, [activeSessionId, setSessions]);

  const exportData = useCallback(() => {
    const downloadJson = (payload, filename) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    if (activeSession) {
      const payload = {
        kind: 'dupliflag-session',
        version: 1,
        exportedAt: new Date().toISOString(),
        session: {
          name: activeSession.name,
          createdAt: activeSession.createdAt ?? Date.now(),
          flags: activeSession.flags.map(flag => ({
            value: flag.value,
            timestamp: flag.timestamp,
          })),
        },
      };

      const safeName = activeSession.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'challenge';

      downloadJson(payload, `${safeName}-dupliflag.json`);
      addToast(`Exported ${activeSession.flags.length} flag${activeSession.flags.length !== 1 ? 's' : ''} from "${activeSession.name}"`, 'success');
      return;
    }

    const payload = {
      kind: 'dupliflag-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions: sessions.map(session => ({
        name: session.name,
        createdAt: session.createdAt ?? Date.now(),
        flags: session.flags.map(flag => ({
          value: flag.value,
          timestamp: flag.timestamp,
        })),
      })),
    };

    const dateTag = new Date().toISOString().slice(0, 10);
    downloadJson(payload, `dupliflag-backup-${dateTag}.json`);
    addToast(`Exported ${sessions.length} challenge${sessions.length !== 1 ? 's' : ''} from homepage`, 'success');
  }, [activeSession, sessions, addToast]);

  const importSessionFromFile = useCallback(async (file) => {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const sourceSessions = parsed?.kind === 'dupliflag-backup'
        ? parsed?.sessions
        : [parsed?.kind === 'dupliflag-session' ? parsed?.session : parsed];

      if (!Array.isArray(sourceSessions) || sourceSessions.length === 0) {
        throw new Error('Invalid import payload');
      }

      const normalizeSession = (rawSession) => {
        const name = typeof rawSession?.name === 'string' ? rawSession.name.trim() : '';
        if (!name) return null;

        const rawFlags = Array.isArray(rawSession?.flags) ? rawSession.flags : [];
        const seenImportedFlags = new Set();
        const normalizedFlags = [];

        for (const item of rawFlags) {
          const rawValue = typeof item === 'string' ? item : item?.value;
          if (typeof rawValue !== 'string') continue;

          const value = rawValue.trim();
          if (!value) continue;

          const dedupeKey = value.toLowerCase();
          if (seenImportedFlags.has(dedupeKey)) continue;
          seenImportedFlags.add(dedupeKey);

          const timestampCandidate = typeof item === 'object' ? Number(item?.timestamp) : NaN;
          normalizedFlags.push({
            id: generateId(),
            value,
            timestamp: Number.isFinite(timestampCandidate) ? timestampCandidate : Date.now(),
          });
        }

        return {
          name,
          createdAt: Number.isFinite(Number(rawSession?.createdAt))
            ? Number(rawSession.createdAt)
            : Date.now(),
          flags: normalizedFlags,
        };
      };

      const normalizedSessions = sourceSessions
        .map(normalizeSession)
        .filter(Boolean);

      if (normalizedSessions.length === 0) {
        throw new Error('No valid sessions in import');
      }

      let targetId = null;
      let createdSessions = 0;
      let addedFlags = 0;
      let skippedDuplicates = 0;

      setSessions(prev => {
        let next = [...prev];

        for (const imported of normalizedSessions) {
          const existingIndex = next.findIndex(
            session => session.name.toLowerCase() === imported.name.toLowerCase()
          );

          if (existingIndex === -1) {
            const newSession = {
              id: generateId(),
              name: imported.name,
              createdAt: imported.createdAt,
              flags: imported.flags,
            };
            next.push(newSession);
            createdSessions += 1;
            addedFlags += imported.flags.length;
            targetId = targetId ?? newSession.id;
            continue;
          }

          const existing = next[existingIndex];
          const existingSet = new Set(existing.flags.map(flag => flag.value.toLowerCase()));
          const toAdd = imported.flags.filter(flag => {
            const key = flag.value.toLowerCase();
            if (existingSet.has(key)) return false;
            existingSet.add(key);
            return true;
          });

          skippedDuplicates += imported.flags.length - toAdd.length;
          addedFlags += toAdd.length;
          targetId = targetId ?? existing.id;

          next[existingIndex] = {
            ...existing,
            flags: [...existing.flags, ...toAdd],
          };
        }

        return next;
      });

      if (targetId) {
        setActiveSessionId(targetId);
      }

      if (normalizedSessions.length === 1 && createdSessions === 1) {
        addToast(`Imported challenge "${normalizedSessions[0].name}" with ${addedFlags} flag${addedFlags !== 1 ? 's' : ''}`, 'success');
      } else {
        addToast(
          `Imported ${normalizedSessions.length} challenge${normalizedSessions.length !== 1 ? 's' : ''}: ${createdSessions} created, ${addedFlags} flag${addedFlags !== 1 ? 's' : ''} added`,
          'success'
        );
      }

      if (skippedDuplicates > 0) {
        addToast(`Skipped ${skippedDuplicates} duplicate flag${skippedDuplicates !== 1 ? 's' : ''} during import`, 'warning');
      }
    } catch {
      addToast('Import failed: invalid JSON or unsupported export file', 'warning');
    }
  }, [setSessions, setActiveSessionId, addToast]);

  return (
    <div className="app">
      {/* Mobile menu toggle */}
      <button
        className={`mobile-toggle ${mobileShowSidebar ? 'mobile-toggle--open' : ''}`}
        onClick={() => setMobileShowSidebar(!mobileShowSidebar)}
        id="mobile-toggle"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          {mobileShowSidebar ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {/* Sidebar overlay for mobile */}
      {mobileShowSidebar && (
        <div className="sidebar-overlay" onClick={() => setMobileShowSidebar(false)} />
      )}

      <div className={`sidebar-wrapper ${mobileShowSidebar ? 'sidebar-wrapper--open' : ''}`}>
        <SessionList
          sessions={sessions}
          activeId={activeSessionId}
          onSelect={selectSession}
          onCreate={createSession}
          onDelete={deleteSession}
        />
      </div>

      <main className="main-panel">
        <FlagInput onSubmit={submitFlag} disabled={!activeSession} />
        <FlagHistory
          flags={activeSession?.flags || []}
          onDelete={deleteFlag}
          sessionName={activeSession?.name}
          hasAnySessions={sessions.length > 0}
          onExport={exportData}
          onImport={importSessionFromFile}
        />
      </main>

      {/* Toasts */}
      <div className="toast-container" id="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
