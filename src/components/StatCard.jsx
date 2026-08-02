import React from 'react';

export default function StatCard({ label, value, sub, valueClass, accent }) {
  return (
    <div
      style={{
        background: 'var(--ink-2)',
        border: '1px solid var(--line)',
        borderTop: accent ? `2px solid ${accent}` : '1px solid var(--line)',
        padding: '14px 16px',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </div>
      <div className={`mono ${valueClass || ''}`} style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--bone-faint)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
