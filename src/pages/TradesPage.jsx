import React, { useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { fmtCurrency, fmtDate, fmtDuration, fmtNumber, plClass } from '../lib/format.js';
import TradeDetailDrawer from '../components/TradeDetailDrawer.jsx';

const COLUMNS = [
  { key: 'closeTime', label: 'Close', sortable: true },
  { key: 'symbol', label: 'Symbol', sortable: true },
  { key: 'side', label: 'Side', sortable: true },
  { key: 'volume', label: 'Vol', sortable: true },
  { key: 'openPrice', label: 'Open', sortable: true },
  { key: 'closePrice', label: 'Close px', sortable: true },
  { key: 'pips', label: 'Pips', sortable: true },
  { key: 'rMultiple', label: 'R', sortable: true },
  { key: 'durationMin', label: 'Duration', sortable: true },
  { key: 'pl', label: 'P/L', sortable: true },
];

export default function TradesPage({ analytics }) {
  const { enriched } = analytics;
  const [sortKey, setSortKey] = useState('closeTime');
  const [sortDir, setSortDir] = useState('desc');
  const [symbolFilter, setSymbolFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState(null);

  const symbols = useMemo(() => Array.from(new Set(enriched.map((t) => t.symbol))).sort(), [enriched]);

  const filtered = useMemo(() => {
    return enriched.filter((t) => {
      if (symbolFilter !== 'all' && t.symbol !== symbolFilter) return false;
      if (resultFilter === 'wins' && !t.isWin) return false;
      if (resultFilter === 'losses' && !t.isLoss) return false;
      return true;
    });
  }, [enriched, symbolFilter, resultFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === 'closeTime' || sortKey === 'openTime') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      }
      if (av == null) av = -Infinity;
      if (bv == null) bv = -Infinity;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const totalPL = filtered.reduce((s, t) => s + t.pl, 0);

  return (
    <div>
      <PageHeader title="Trades" subtitle={`${filtered.length} of ${enriched.length} trades · ${fmtCurrency(totalPL, { signed: true })}`}>
        <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)} style={selectStyle}>
          <option value="all">All symbols</option>
          {symbols.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} style={selectStyle}>
          <option value="all">All results</option>
          <option value="wins">Wins only</option>
          <option value="losses">Losses only</option>
        </select>
      </PageHeader>

      <div style={{ padding: '0 28px 28px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{
                    textAlign: col.key === 'symbol' ? 'left' : 'right',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--line)',
                    color: sortKey === col.key ? 'var(--amber)' : 'var(--bone-faint)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {col.label}{sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr
                key={t.id}
                onClick={() => setSelectedTrade(t)}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'var(--ink-2)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ink-3)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--ink-2)')}
              >
                <td style={tdStyle}>{fmtDate(t.closeTime, { withTime: true, withYear: false })}</td>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>{t.symbol}</td>
                <td style={{ ...tdStyle, color: t.side === 'buy' ? 'var(--green)' : 'var(--red)' }}>{t.side.toUpperCase()}</td>
                <td style={tdStyle}>{t.volume}</td>
                <td style={tdStyle}>{fmtNumber(t.openPrice, 5)}</td>
                <td style={tdStyle}>{fmtNumber(t.closePrice, 5)}</td>
                <td style={tdStyle}>{t.pips != null ? fmtNumber(t.pips, 1) : '—'}</td>
                <td style={tdStyle}>{t.rMultiple != null ? `${fmtNumber(t.rMultiple, 2)}R` : '—'}</td>
                <td style={tdStyle}>{fmtDuration(t.durationMin)}</td>
                <td className={plClass(t.pl)} style={{ ...tdStyle, fontWeight: 700 }}>{fmtCurrency(t.pl, { signed: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--bone-faint)' }}>No trades match these filters</div>
        )}
      </div>

      {selectedTrade && <TradeDetailDrawer trade={selectedTrade} onClose={() => setSelectedTrade(null)} />}
    </div>
  );
}

const tdStyle = {
  textAlign: 'right',
  padding: '8px 12px',
  borderBottom: '1px solid var(--line-soft)',
  fontFamily: 'var(--font-mono)',
  whiteSpace: 'nowrap',
};

const selectStyle = {
  background: 'var(--ink-3)',
  border: '1px solid var(--line)',
  color: 'var(--bone)',
  padding: '7px 10px',
  fontSize: 12.5,
  borderRadius: 2,
};
