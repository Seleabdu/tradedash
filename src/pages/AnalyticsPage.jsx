import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageHeader from '../components/PageHeader.jsx';
import { fmtCurrency, fmtPercent, fmtNumber, plClass } from '../lib/format.js';

function BreakdownTable({ title, rows, keyLabel }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid var(--line)', padding: '16px 18px' }}>
      <div style={{ fontSize: 12, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr>
            <th style={thLeft}>{keyLabel}</th>
            <th style={thRight}>Trades</th>
            <th style={thRight}>Win %</th>
            <th style={thRight}>P/L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td style={tdLeft}>{r.key}</td>
              <td className="mono" style={tdRight}>{r.totalTrades}</td>
              <td className="mono" style={tdRight}>{fmtPercent(r.winRate)}</td>
              <td className={`mono ${plClass(r.totalPL)}`} style={{ ...tdRight, fontWeight: 700 }}>{fmtCurrency(r.totalPL, { signed: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={{ background: 'var(--ink-3)', border: '1px solid var(--line)', padding: '6px 10px', fontSize: 12 }}>
      <div style={{ color: 'var(--bone-faint)' }}>{label}</div>
      <div className="mono" style={{ fontWeight: 600 }}>{v} trade{v !== 1 ? 's' : ''}</div>
    </div>
  );
}

export default function AnalyticsPage({ analytics }) {
  const { bySymbol, bySession, byDayOfWeek, byHour, bySide, rDistribution, summary, sharpe, drawdown } = analytics;

  const hourData = byHour.map((r) => ({ hour: `${String(r.key).padStart(2, '0')}:00`, trades: r.totalTrades, pl: r.totalPL }));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance broken down by symbol, timing, and risk distribution" />

      <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <MiniStat label="Sharpe (per-trade)" value={sharpe != null ? fmtNumber(sharpe, 3) : '—'} />
          <MiniStat label="Gross profit" value={fmtCurrency(summary.grossProfit)} valueClass="pl-pos" />
          <MiniStat label="Gross loss" value={fmtCurrency(summary.grossLoss)} valueClass="pl-neg" />
          <MiniStat label="Drawdown (rel.)" value={fmtPercent(drawdown.maxDrawdownPct)} valueClass="pl-neg" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <BreakdownTable title="By symbol" rows={bySymbol} keyLabel="Symbol" />
          <BreakdownTable title="By session" rows={bySession} keyLabel="Session" />
          <BreakdownTable title="By day of week" rows={byDayOfWeek} keyLabel="Day" />
          <BreakdownTable title="Long vs short" rows={bySide} keyLabel="Direction" />
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--line)', padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Trades by hour (UTC, close time)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#23272f" vertical={false} />
              <XAxis dataKey="hour" stroke="#5e6470" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={{ stroke: '#2b303a' }} interval={1} />
              <YAxis stroke="#5e6470" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="trades" radius={[2, 2, 0, 0]}>
                {hourData.map((d, i) => (
                  <Cell key={i} fill={d.pl >= 0 ? '#3fb68b' : '#e5566d'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--line)', padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            R-multiple distribution
            <span style={{ marginLeft: 10, color: 'var(--bone-faint)', textTransform: 'none', fontSize: 11 }}>
              (only trades with a stop loss set)
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={rDistribution} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#23272f" vertical={false} />
              <XAxis dataKey="label" stroke="#5e6470" tick={{ fontSize: 10.5, fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={{ stroke: '#2b303a' }} />
              <YAxis stroke="#5e6470" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {rDistribution.map((d, i) => (
                  <Cell key={i} fill={d.label.includes('-') ? '#e5566d' : '#3fb68b'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, valueClass }) {
  return (
    <div style={{ background: 'var(--ink-2)', border: '1px solid var(--line)', padding: '12px 14px' }}>
      <div style={{ fontSize: 10.5, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div className={`mono ${valueClass || ''}`} style={{ fontSize: 17, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const thLeft = { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--line)', color: 'var(--bone-faint)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' };
const thRight = { ...thLeft, textAlign: 'right' };
const tdLeft = { textAlign: 'left', padding: '7px 8px', borderBottom: '1px solid var(--line-soft)' };
const tdRight = { ...tdLeft, textAlign: 'right' };
