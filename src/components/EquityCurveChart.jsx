import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fmtCurrency, fmtDate } from '../lib/format.js';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ background: 'var(--ink-3)', border: '1px solid var(--line)', padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--bone-faint)', marginBottom: 4 }}>{fmtDate(p.date, { withTime: true })}</div>
      <div className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{fmtCurrency(p.equity)}</div>
      {p.symbol && (
        <div className="mono" style={{ marginTop: 4, color: p.pl >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {p.symbol} {p.pl >= 0 ? '+' : ''}{fmtCurrency(p.pl)}
        </div>
      )}
    </div>
  );
}

export default function EquityCurveChart({ equityCurve, startingBalance, height = 280 }) {
  if (!equityCurve.length) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bone-faint)', fontSize: 13 }}>No closed trades yet</div>;
  }

  const data = [{ date: equityCurve[0]?.date, equity: startingBalance, pl: 0 }, ...equityCurve];
  const values = data.map((d) => d.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.08 || Math.abs(max) * 0.05 || 10;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8a33d" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#e8a33d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#23272f" strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => fmtDate(d, { withYear: false })}
          stroke="#5e6470"
          tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          tickLine={false}
          axisLine={{ stroke: '#2b303a' }}
          minTickGap={40}
        />
        <YAxis
          domain={[min - pad, max + pad]}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          stroke="#5e6470"
          tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <ReferenceLine y={startingBalance} stroke="#5e6470" strokeDasharray="3 3" />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="#e8a33d"
          strokeWidth={1.75}
          fill="url(#equityGlow)"
          dot={false}
          activeDot={{ r: 3.5, fill: '#e8a33d', stroke: '#15171c', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
