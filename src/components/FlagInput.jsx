import { useState, useRef, useEffect } from 'react';
import './FlagInput.css';

export default function FlagInput({ onSubmit, disabled }) {
  const [flag, setFlag] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = flag.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setFlag('');
    inputRef.current?.focus();
  };

  return (
    <form className="flag-input" onSubmit={handleSubmit} id="flag-input-form">
      <div className="flag-input__wrap">
        <input
          ref={inputRef}
          id="flag-input"
          type="text"
          className="flag-input__field"
          placeholder={disabled ? 'Select a challenge first...' : 'Paste or type your flag here...'}
          value={flag}
          onChange={e => setFlag(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      <button
        type="submit"
        className="flag-input__submit"
        disabled={disabled || !flag.trim()}
        id="submit-flag-btn"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
        Submit
      </button>
    </form>
  );
}
