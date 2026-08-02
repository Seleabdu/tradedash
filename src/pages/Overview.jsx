import React, { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import EquityCurveChart from '../components/EquityCurveChart.jsx';
import { fmtCurrency, fmtPercent, fmtNumber, fmtDuration, plClass } from '../lib/format.js';

export default function Overview({ analytics, openPositions, accountSummary, startingBalance, onChangeStartingBalance }) {
  const { summary, equityCurve, drawdown, streaks, bySymbol, kellyPercent } = analytics;
  const [editingBalance, setEditingBalance] = useState(false);
  const [draftBalance, setDraftBalance] = useState(startingBalance);

  const topSymbol = bySymbol[0];
  const worstSymbol = bySymbol[bySymbol.length - 1];

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={`${summary.totalTrades} closed trades · net P/L ${fmtCurrency(summary.totalPL, { signed: true })}`}
      >
        {editingBalance ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--bone-faint)' }}>Starting balance</span>
            <input
              type="number"
              value={draftBalance}
              onChange={(e) => setDraftBalance(Number(e.target.value))}
              className="mono"
              style={{ width: 110, background: 'var(--ink-3)', border: '1px solid var(--line)', color: 'var(--bone)', padding: '5px 8px', fontSize: 13 }}
            />
            <button
              onClick={() => { onChangeStartingBalance(draftBalance); setEditingBalance(false); }}
              style={{ background: 'var(--amber)', color: 'var(--ink)', border: 'none', padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 2 }}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setDraftBalance(startingBalance); setEditingBalance(true); }}
            style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--bone-dim)', padding: '6px 12px', fontSize: 12, borderRadius: 2 }}
          >
            Starting balance: <span className="mono">{fmtCurrency(startingBalance)}</span>
          </button>
        )}
      </PageHeader>

      <div style={{ padding: '0 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
          <StatCard label="Net P/L" value={fmtCurrency(summary.totalPL, { signed: true })} valueClass={plClass(summary.totalPL)} accent={summary.totalPL >= 0 ? '#3fb68b' : '#e5566d'} />
          <StatCard label="Win rate" value={fmtPercent(summary.winRate)} sub={`${summary.winners}W / ${summary.losers}L / ${summary.scratches}S`} />
          <StatCard label="Profit factor" value={summary.profitFactor != null ? fmtNumber(summary.profitFactor) : '—'} />
          <StatCard label="Expectancy / trade" value={fmtCurrency(summary.expectancy, { signed: true })} valueClass={plClass(summary.expectancy)} />
          <StatCard label="Avg win : avg loss" value={summary.avgRR != null ? `${fmtNumber(summary.avgRR, 2)} : 1` : '—'} />
          <StatCard label="Max drawdown" value={fmtCurrency(drawdown.maxDrawdownAbs)} sub={fmtPercent(drawdown.maxDrawdownPct)} valueClass="pl-neg" />
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--line)', padding: '18px 18px 8px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Equity curve</div>
            {accountSummary && (
              <div className="mono" style={{ fontSize: 12, color: 'var(--bone-dim)' }}>
                Live equity {fmtCurrency(accountSummary.equity)}
                {accountSummary.floatingPL !== 0 && (
                  <span className={plClass(accountSummary.floatingPL)} style={{ marginLeft: 8 }}>
                    ({accountSummary.floatingPL >= 0 ? '+' : ''}{fmtCurrency(accountSummary.floatingPL)} floating)
                  </span>
                )}
              </div>
            )}
          </div>
          <EquityCurveChart equityCurve={equityCurve} startingBalance={startingBalance} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <Panel title="Streaks">
            <Row label="Current streak" value={streaks.currentStreak === 0 ? '—' : `${Math.abs(streaks.currentStreak)} ${streaks.currentStreak > 0 ? 'wins' : 'losses'}`} valueClass={streaks.currentStreak > 0 ? 'pl-pos' : streaks.currentStreak < 0 ? 'pl-neg' : ''} />
            <Row label="Best win streak" value={`${streaks.maxWinStreak} trades`} sub={fmtCurrency(streaks.maxWinStreakPL, { signed: true })} valueClass="pl-pos" />
            <Row label="Worst loss streak" value={`${streaks.maxLossStreak} trades`} sub={fmtCurrency(streaks.maxLossStreakPL, { signed: true })} valueClass="pl-neg" />
          </Panel>

          <Panel title="Trade composition">
            <Row label="Largest win" value={fmtCurrency(summary.largestWin)} valueClass="pl-pos" />
            <Row label="Largest loss" value={fmtCurrency(summary.largestLoss)} valueClass="pl-neg" />
            <Row label="Avg trade duration" value={fmtDuration(summary.avgDurationMin)} />
            <Row label="Kelly criterion" value={kellyPercent != null ? fmtPercent(kellyPercent) : '—'} sub="suggested position sizing edge" />
          </Panel>

          <Panel title="Symbol performance">
            {topSymbol && <Row label={`Best: ${topSymbol.key}`} value={fmtCurrency(topSymbol.totalPL, { signed: true })} valueClass="pl-pos" />}
            {worstSymbol && worstSymbol !== topSymbol && <Row label={`Worst: ${worstSymbol.key}`} value={fmtCurrency(worstSymbol.totalPL, { signed: true })} valueClass="pl-neg" />}
            <Row label="Symbols traded" value={String(bySymbol.length)} />
          </Panel>

          <Panel title="Open positions">
            {openPositions.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--bone-faint)', padding: '4px 0' }}>No open positions in latest import</div>
            ) : (
              openPositions.map((p) => (
                <Row
                  key={p.id}
                  label={`${p.symbol} ${p.side.toUpperCase()} ${p.volume}`}
                  value={fmtCurrency(p.profit, { signed: true })}
                  valueClass={plClass(p.profit)}
                />
              ))
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid var(--line)', padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, sub, valueClass }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--bone-dim)' }}>{label}</span>
      <span style={{ textAlign: 'right' }}>
        <span className={`mono ${valueClass || ''}`} style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</span>
        {sub && <div style={{ fontSize: 11, color: 'var(--bone-faint)' }}>{sub}</div>}
      </span>
    </div>
  );
}
