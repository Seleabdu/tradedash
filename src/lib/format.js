export function fmtCurrency(n, opts = {}) {
  if (n == null || Number.isNaN(n)) return '—';
  const { signed = false } = opts;
  const sign = signed && n > 0 ? '+' : '';
  return sign + n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtCompactCurrency(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function fmtPercent(n, decimals = 1) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(decimals)}%`;
}

export function fmtNumber(n, decimals = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtDate(iso, opts = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  const { withTime = false, withYear = true } = opts;
  const dateOpts = { month: 'short', day: 'numeric' };
  if (withYear) dateOpts.year = 'numeric';
  let s = d.toLocaleDateString('en-US', dateOpts);
  if (withTime) s += ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return s;
}

export function fmtDuration(minutes) {
  if (minutes == null) return '—';
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}d ${rh}h`;
}

export function plClass(n) {
  if (n > 0) return 'pl-pos';
  if (n < 0) return 'pl-neg';
  return 'pl-flat';
}
