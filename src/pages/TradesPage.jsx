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
  const [searchQuery, setSearchQuery] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all', 'single', 'range'
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTrade, setSelectedTrade] = useState(null);

  // List normalized base symbols (e.g. AUDUSD, EURUSD, XAUUSD) so AUDUSD.x, AUDUSDm, AUDUSDz aggregate together
  const baseSymbols = useMemo(() => {
    const set = new Set(enriched.map((t) => t.baseSymbol || t.symbol));
    return Array.from(set).sort();
  }, [enriched]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return enriched.filter((t) => {
      // Symbol filter (matches baseSymbol or raw symbol)
      if (symbolFilter !== 'all') {
        const tBase = t.baseSymbol || t.symbol;
        if (tBase !== symbolFilter && t.symbol !== symbolFilter) return false;
      }

      // Result filter
      if (resultFilter === 'wins' && !t.isWin) return false;
      if (resultFilter === 'losses' && !t.isLoss) return false;

      // Text search query
      if (query) {
        const idMatch = String(t.id).toLowerCase().includes(query);
        const symbolMatch = (t.symbol || '').toLowerCase().includes(query);
        const baseSymbolMatch = (t.baseSymbol || '').toLowerCase().includes(query);
        const sideMatch = (t.side || '').toLowerCase().includes(query);
        const commentMatch = (t.comment || '').toLowerCase().includes(query);
        if (!idMatch && !symbolMatch && !baseSymbolMatch && !sideMatch && !commentMatch) {
          return false;
        }
      }

      // Date filtering
      if (t.closeTime) {
        const closeDay = t.closeTime.slice(0, 10); // YYYY-MM-DD
        if (dateFilterMode === 'single' && singleDate) {
          if (closeDay !== singleDate) return false;
        } else if (dateFilterMode === 'range') {
          if (startDate && closeDay < startDate) return false;
          if (endDate && closeDay > endDate) return false;
        }
      }

      return true;
    });
  }, [enriched, symbolFilter, resultFilter, searchQuery, dateFilterMode, singleDate, startDate, endDate]);

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

  const clearFilters = () => {
    setSearchQuery('');
    setSymbolFilter('all');
    setResultFilter('all');
    setDateFilterMode('all');
    setSingleDate('');
    setStartDate('');
    setEndDate('');
  };

  const totalPL = filtered.reduce((s, t) => s + t.pl, 0);
  const hasActiveFilters = searchQuery || symbolFilter !== 'all' || resultFilter !== 'all' || dateFilterMode !== 'all';

  return (
    <div>
      <PageHeader title="Trades" subtitle={`${filtered.length} of ${enriched.length} trades · ${fmtCurrency(totalPL, { signed: true })}`} />

      <div style={{ padding: '0 28px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {/* Search Input */}
        <div style={{ flex: '1 1 200px', minWidth: 180 }}>
          <input
            type="text"
            placeholder="Search symbol, ID, side..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--ink-3)',
              border: '1px solid var(--line)',
              color: 'var(--bone)',
              padding: '7px 12px',
              fontSize: 12.5,
              borderRadius: 3,
              outline: 'none',
            }}
          />
        </div>

        {/* Symbol Filter Dropdown */}
        <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)} style={selectStyle}>
          <option value="all">All pairs / symbols</option>
          {baseSymbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Result Filter Dropdown */}
        <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} style={selectStyle}>
          <option value="all">All results</option>
          <option value="wins">Wins only</option>
          <option value="losses">Losses only</option>
        </select>

        {/* Date Filter Mode Selector */}
        <select value={dateFilterMode} onChange={(e) => setDateFilterMode(e.target.value)} style={selectStyle}>
          <option value="all">All dates</option>
          <option value="single">Single date</option>
          <option value="range">Date range</option>
        </select>

        {/* Date Pickers */}
        {dateFilterMode === 'single' && (
          <input
            type="date"
            value={singleDate}
            onChange={(e) => setSingleDate(e.target.value)}
            style={dateInputStyle}
          />
        )}

        {dateFilterMode === 'range' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From"
              style={dateInputStyle}
            />
            <span style={{ fontSize: 12, color: 'var(--bone-faint)' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To"
              style={dateInputStyle}
            />
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--amber)',
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 3,
              cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

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
                  {col.label}
                  {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
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
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>
                  <span>{t.symbol}</span>
                  {t.symbol !== t.baseSymbol && (
                    <span style={{ fontSize: 10, color: 'var(--bone-faint)', marginLeft: 6, fontWeight: 400 }}>
                      ({t.baseSymbol})
                    </span>
                  )}
                </td>
                <td style={{ ...tdStyle, color: t.side === 'buy' ? 'var(--green)' : 'var(--red)' }}>{t.side.toUpperCase()}</td>
                <td style={tdStyle}>{t.volume}</td>
                <td style={tdStyle}>{fmtNumber(t.openPrice, 5)}</td>
                <td style={tdStyle}>{fmtNumber(t.closePrice, 5)}</td>
                <td style={tdStyle}>{t.pips != null ? fmtNumber(t.pips, 1) : '—'}</td>
                <td style={tdStyle}>{t.rMultiple != null ? `${fmtNumber(t.rMultiple, 2)}R` : '—'}</td>
                <td style={tdStyle}>{fmtDuration(t.durationMin)}</td>
                <td className={plClass(t.pl)} style={{ ...tdStyle, fontWeight: 700 }}>
                  {fmtCurrency(t.pl, { signed: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--bone-faint)' }}>No trades match these search & filter criteria</div>
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
  borderRadius: 3,
};

const dateInputStyle = {
  background: 'var(--ink-3)',
  border: '1px solid var(--line)',
  color: 'var(--bone)',
  padding: '6px 10px',
  fontSize: 12,
  borderRadius: 3,
  outline: 'none',
  colorScheme: 'dark',
};
