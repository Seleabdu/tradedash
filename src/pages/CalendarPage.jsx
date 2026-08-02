import React, { useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { fmtCurrency, fmtCompactCurrency, plClass } from '../lib/format.js';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function intensityColor(pl, maxAbs) {
  if (pl === 0 || maxAbs === 0) return 'var(--ink-3)';
  const ratio = Math.min(Math.abs(pl) / maxAbs, 1);
  const alpha = 0.18 + ratio * 0.55;
  return pl > 0 ? `rgba(63, 182, 139, ${alpha})` : `rgba(229, 86, 109, ${alpha})`;
}

export default function CalendarPage({ analytics }) {
  const { calendarDaily, enriched } = analytics;

  const availableMonths = useMemo(() => {
    const keys = new Set(Array.from(calendarDaily.keys()).map((d) => d.slice(0, 7)));
    return Array.from(keys).sort();
  }, [calendarDaily]);

  const [monthKey, setMonthKey] = useState(availableMonths[availableMonths.length - 1] || '');

  const [year, month] = (monthKey || '2026-01').split('-').map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startDow = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const maxAbsPL = useMemo(() => {
    let max = 0;
    for (const [date, d] of calendarDaily.entries()) {
      if (date.startsWith(monthKey)) max = Math.max(max, Math.abs(d.pl));
    }
    return max;
  }, [calendarDaily, monthKey]);

  const monthSummary = useMemo(() => {
    let pl = 0, trades = 0, wins = 0, tradingDays = 0;
    for (const [date, d] of calendarDaily.entries()) {
      if (date.startsWith(monthKey)) {
        pl += d.pl;
        trades += d.trades;
        wins += d.wins;
        tradingDays += 1;
      }
    }
    return { pl, trades, wins, tradingDays };
  }, [calendarDaily, monthKey]);

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthIdx = availableMonths.indexOf(monthKey);

  if (!availableMonths.length) {
    return (
      <div style={{ padding: 28 }}>
        <PageHeader title="Calendar" />
        <div style={{ color: 'var(--bone-faint)' }}>No closed trades to show yet.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle={`${monthSummary.tradingDays} trading days · ${monthSummary.trades} trades · ${fmtCurrency(monthSummary.pl, { signed: true })}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn disabled={monthIdx <= 0} onClick={() => setMonthKey(availableMonths[monthIdx - 1])}>←</NavBtn>
          <span className="mono" style={{ fontSize: 14, fontWeight: 600, minWidth: 150, textAlign: 'center' }}>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <NavBtn disabled={monthIdx >= availableMonths.length - 1} onClick={() => setMonthKey(availableMonths[monthIdx + 1])}>→</NavBtn>
        </div>
      </PageHeader>

      <div style={{ padding: '0 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
          {DOW.map((d) => (
            <div key={d} style={{ fontSize: 11, color: 'var(--bone-faint)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: 4 }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const d = calendarDaily.get(dateKey);
            return (
              <div
                key={dateKey}
                style={{
                  background: d ? intensityColor(d.pl, maxAbsPL) : 'var(--ink-2)',
                  border: '1px solid var(--line-soft)',
                  minHeight: 86,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 11.5, color: 'var(--bone-faint)' }}>{day}</span>
                {d && (
                  <div>
                    <div className={`mono ${plClass(d.pl)}`} style={{ fontSize: 13.5, fontWeight: 700 }}>
                      {fmtCompactCurrency(d.pl)}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--bone-faint)' }}>{d.trades} trade{d.trades !== 1 ? 's' : ''}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavBtn({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'var(--ink-3)',
        border: '1px solid var(--line)',
        color: disabled ? 'var(--bone-faint)' : 'var(--bone)',
        width: 28,
        height: 28,
        borderRadius: 2,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
