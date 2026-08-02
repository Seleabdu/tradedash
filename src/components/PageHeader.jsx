import React from 'react';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '24px 28px 16px',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--bone-faint)', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>}
    </div>
  );
}
