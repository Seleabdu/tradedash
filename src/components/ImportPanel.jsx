import React, { useRef, useState, useCallback } from 'react';

export default function ImportPanel({ onImport, importing, error, success, onDismiss }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((fileList) => {
    const files = Array.from(fileList).filter((f) => /\.html?$/i.test(f.name));
    if (files.length) onImport(files);
  }, [onImport]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      style={{
        borderBottom: '1px solid var(--line)',
        background: dragOver ? 'var(--ink-3)' : 'var(--ink-2)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
        transition: 'background 0.15s ease',
      }}
    >
      <button
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        style={{
          background: 'var(--amber)',
          color: 'var(--ink)',
          border: 'none',
          padding: '7px 16px',
          borderRadius: 3,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.01em',
          opacity: importing ? 0.6 : 1,
        }}
      >
        {importing ? 'Importing…' : 'Import report'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
      <span style={{ fontSize: 12.5, color: 'var(--bone-faint)' }}>
        Drop an MT5 Trade History Report (.html) here, or click to browse. Re-importing a newer export merges in new trades automatically.
      </span>

      {error && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--red)', fontSize: 12.5 }}>
          <span>{error}</span>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 14 }}>×</button>
        </div>
      )}
      {success && !error && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green)', fontSize: 12.5 }}>
          <span>{success}</span>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 14 }}>×</button>
        </div>
      )}
    </div>
  );
}
