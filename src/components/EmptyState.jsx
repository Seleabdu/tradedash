import React, { useRef } from 'react';

export default function EmptyState({ onImport, importing }) {
  const inputRef = useRef(null);
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 40,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--bone-faint)',
          letterSpacing: '0.08em',
          marginBottom: 16,
        }}
      >
        NO DATA LOADED
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 12px', maxWidth: 480 }}>
        Bring in a trade history report to start the ledger
      </h1>
      <p style={{ color: 'var(--bone-dim)', fontSize: 14.5, maxWidth: 440, lineHeight: 1.6, margin: '0 0 28px' }}>
        Export your account's <span className="mono">Trade History Report</span> as HTML from MetaTrader 5
        (right-click the history tab → Report → HTML), then drop it here. Everything stays in your browser.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files).filter((f) => /\.html?$/i.test(f.name));
          if (files.length) onImport(files);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={importing}
        style={{
          background: 'var(--amber)',
          color: 'var(--ink)',
          border: 'none',
          padding: '11px 24px',
          borderRadius: 3,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {importing ? 'Importing…' : 'Choose report file'}
      </button>
    </div>
  );
}
