import React from 'react';

export default function Sidebar({ tabs, activeTab, onSelect, accountMeta, hasData }) {
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--ink-2)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
      }}
    >
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--line-soft)', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--amber)', letterSpacing: '-0.02em' }}>
            LEDGER
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--bone-faint)', marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Trading journal
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 12px' }}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          const disabled = !hasData && tab.key !== 'reports';
          return (
            <button
              key={tab.key}
              onClick={() => !disabled && onSelect(tab.key)}
              disabled={disabled}
              style={{
                textAlign: 'left',
                background: active ? 'var(--ink-3)' : 'transparent',
                color: disabled ? 'var(--bone-faint)' : active ? 'var(--bone)' : 'var(--bone-dim)',
                border: 'none',
                borderLeft: active ? '2px solid var(--amber)' : '2px solid transparent',
                padding: '9px 14px',
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                fontFamily: 'var(--font-ui)',
                cursor: disabled ? 'default' : 'pointer',
                borderRadius: 2,
                opacity: disabled ? 0.5 : 1,
                transition: 'background 0.12s ease, color 0.12s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {accountMeta && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line-soft)', fontSize: 11.5, color: 'var(--bone-faint)', lineHeight: 1.6 }}>
          <div style={{ color: 'var(--bone-dim)', fontWeight: 600, marginBottom: 2 }}>{accountMeta.name}</div>
          <div className="mono">{accountMeta.account?.split('(')[0].trim()}</div>
          <div style={{ marginTop: 2 }}>{accountMeta.company}</div>
        </div>
      )}
    </aside>
  );
}
