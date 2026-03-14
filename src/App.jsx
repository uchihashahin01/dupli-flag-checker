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
