import { useState, useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
  };

  return (
    <div className={`toast toast--${type} ${isExiting ? 'toast--exit' : ''}`}>
      <span className="toast__icon">{icons[type]}</span>
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={() => { setIsExiting(true); setTimeout(onClose, 300); }}>×</button>
    </div>
  );
}
