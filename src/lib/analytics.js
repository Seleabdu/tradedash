// Analytics engine — turns raw parsed trades into every metric the dashboard shows.
// Pure functions, no side effects, so they're easy to test and reuse.

const MS_DAY = 24 * 60 * 60 * 1000;

export function netPL(trade) {
  return trade.profit + trade.commission + trade.swap;
}

function pipSize(symbol) {
  const s = (symbol || '').toUpperCase();
  const core = s.replace(/[^A-Z]/g, '');
  if (core.includes('JPY')) return 0.01;
  if (core.includes('XAU') || core.includes('GOLD')) return 0.1;
  if (core.includes('XAG') || core.includes('SILVER')) return 0.01;
  const FX_CODES = ['EUR', 'GBP', 'USD', 'AUD', 'NZD', 'CAD', 'CHF'];
  const isForexPair = core.length === 6 && FX_CODES.includes(core.slice(0, 3)) && FX_CODES.includes(core.slice(3, 6));
  if (!isForexPair) return null; // indices, crypto, stocks: pip math isn't meaningful here
  return 0.0001;
}

export function tradeRMultiple(trade) {
  // R-multiple: risk-adjusted return relative to the initial stop distance.
  // Requires a stop loss to have been set at entry.
  if (trade.stopLoss == null || trade.openPrice == null) return null;
  const riskPerUnit = Math.abs(trade.openPrice - trade.stopLoss);
  if (riskPerUnit === 0) return null;
  const direction = trade.side === 'buy' ? 1 : -1;
  const priceMove = (trade.closePrice - trade.openPrice) * direction;
  return priceMove / riskPerUnit;
}

export function tradePips(trade) {
  if (trade.closePrice == null || trade.openPrice == null) return null;
  const size = pipSize(trade.symbol);
  if (size == null) return null;
  const direction = trade.side === 'buy' ? 1 : -1;
  const move = (trade.closePrice - trade.openPrice) * direction;
  return move / size;
}

export function durationMinutes(trade) {
  if (!trade.openTime || !trade.closeTime) return null;
  return (new Date(trade.closeTime) - new Date(trade.openTime)) / 60000;
}

function sessionForHour(utcHour) {
  // Rough FX session bands in UTC. A trade can span sessions; classified by open hour.
  if (utcHour >= 0 && utcHour < 7) return 'Tokyo';
  if (utcHour >= 7 && utcHour < 12) return 'London';
  if (utcHour >= 12 && utcHour < 16) return 'London/NY Overlap';
  if (utcHour >= 16 && utcHour < 21) return 'New York';
  return 'Sydney';
}

export function enrichTrades(trades) {
  return trades
    .filter((t) => t.closeTime) // only closed trades have a verdict
    .map((t) => {
      const pl = netPL(t);
      const open = new Date(t.openTime);
      return {
        ...t,
        pl,
        isWin: pl > 0,
        isLoss: pl < 0,
        isScratch: pl === 0,
        rMultiple: tradeRMultiple(t),
        pips: tradePips(t),
        durationMin: durationMinutes(t),
        session: sessionForHour(open.getUTCHours()),
        dayOfWeek: open.getUTCDay(), // 0 = Sunday
        dateKey: t.closeTime.slice(0, 10),
        hourOfDay: new Date(t.closeTime).getUTCHours(),
      };
    })
    .sort((a, b) => new Date(a.closeTime) - new Date(b.closeTime));
}

export function computeSummary(enriched) {
  const n = enriched.length;
  if (n === 0) {
    return {
      totalTrades: 0, winRate: 0, totalPL: 0, grossProfit: 0, grossLoss: 0,
      profitFactor: null, expectancy: 0, avgWin: 0, avgLoss: 0, avgRR: null,
      largestWin: 0, largestLoss: 0, avgDurationMin: 0, winners: 0, losers: 0, scratches: 0,
    };
  }
  const winners = enriched.filter((t) => t.isWin);
  const losers = enriched.filter((t) => t.isLoss);
  const scratches = enriched.filter((t) => t.isScratch);
  const grossProfit = winners.reduce((s, t) => s + t.pl, 0);
  const grossLoss = losers.reduce((s, t) => s + t.pl, 0); // negative
  const totalPL = enriched.reduce((s, t) => s + t.pl, 0);
  const avgWin = winners.length ? grossProfit / winners.length : 0;
  const avgLoss = losers.length ? grossLoss / losers.length : 0;
  const winRate = (winners.length / n) * 100;
  const lossRate = 1 - winners.length / n;
  const expectancy = (winners.length / n) * avgWin + (losers.length / n) * avgLoss;
  const durations = enriched.map((t) => t.durationMin).filter((d) => d != null);
  return {
    totalTrades: n,
    winners: winners.length,
    losers: losers.length,
    scratches: scratches.length,
    winRate,
    totalPL,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss !== 0 ? Math.abs(grossProfit / grossLoss) : null,
    expectancy,
    avgWin,
    avgLoss,
    avgRR: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : null,
    largestWin: winners.length ? Math.max(...winners.map((t) => t.pl)) : 0,
    largestLoss: losers.length ? Math.min(...losers.map((t) => t.pl)) : 0,
    avgDurationMin: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
  };
}

export function computeEquityCurve(enriched, startingBalance = 0) {
  let running = startingBalance;
  return enriched.map((t) => {
    running += t.pl;
    return { date: t.closeTime, dateKey: t.dateKey, equity: running, pl: t.pl, symbol: t.symbol, id: t.id };
  });
}

export function computeDrawdown(equityCurve) {
  let peak = equityCurve.length ? equityCurve[0].equity : 0;
  let maxDDAbs = 0;
  let maxDDPct = 0;
  const series = equityCurve.map((point) => {
    peak = Math.max(peak, point.equity);
    const ddAbs = peak - point.equity;
    // Guard against runaway percentages when peak is near zero (e.g. starting
    // balance wasn't set and early equity is tiny) — percent isn't meaningful there.
    const ddPct = Math.abs(peak) > 1 ? (ddAbs / peak) * 100 : 0;
    maxDDAbs = Math.max(maxDDAbs, ddAbs);
    if (Math.abs(peak) > 1) maxDDPct = Math.max(maxDDPct, ddPct);
    return { ...point, peak, drawdown: ddAbs, drawdownPct: ddPct };
  });
  return { series, maxDrawdownAbs: maxDDAbs, maxDrawdownPct: maxDDPct };
}

export function computeStreaks(enriched) {
  let curWinStreak = 0, curLossStreak = 0;
  let maxWinStreak = 0, maxLossStreak = 0;
  let maxWinStreakPL = 0, maxLossStreakPL = 0;
  let runWinPL = 0, runLossPL = 0;
  for (const t of enriched) {
    if (t.isWin) {
      curWinStreak += 1;
      curLossStreak = 0;
      runWinPL += t.pl;
      runLossPL = 0;
      if (curWinStreak > maxWinStreak || (curWinStreak === maxWinStreak && runWinPL > maxWinStreakPL)) {
        maxWinStreak = curWinStreak;
        maxWinStreakPL = runWinPL;
      }
    } else if (t.isLoss) {
      curLossStreak += 1;
      curWinStreak = 0;
      runLossPL += t.pl;
      runWinPL = 0;
      if (curLossStreak > maxLossStreak || (curLossStreak === maxLossStreak && runLossPL < maxLossStreakPL)) {
        maxLossStreak = curLossStreak;
        maxLossStreakPL = runLossPL;
      }
    } else {
      curWinStreak = 0;
      curLossStreak = 0;
      runWinPL = 0;
      runLossPL = 0;
    }
  }
  return {
    currentStreak: curWinStreak > 0 ? curWinStreak : curLossStreak > 0 ? -curLossStreak : 0,
    maxWinStreak, maxLossStreak, maxWinStreakPL, maxLossStreakPL,
  };
}

export function groupBy(enriched, keyFn) {
  const map = new Map();
  for (const t of enriched) {
    const key = keyFn(t);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(t);
  }
  return map;
}

export function summarizeGroups(enriched, keyFn) {
  const groups = groupBy(enriched, keyFn);
  return Array.from(groups.entries())
    .map(([key, trades]) => {
      const s = computeSummary(trades);
      return { key, ...s };
    })
    .sort((a, b) => b.totalPL - a.totalPL);
}

export function computeBySymbol(enriched) {
  return summarizeGroups(enriched, (t) => t.symbol);
}

export function computeBySession(enriched) {
  const order = ['Sydney', 'Tokyo', 'London', 'London/NY Overlap', 'New York'];
  const rows = summarizeGroups(enriched, (t) => t.session);
  return rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

export function computeByDayOfWeek(enriched) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const rows = summarizeGroups(enriched, (t) => names[t.dayOfWeek]);
  return rows.sort((a, b) => names.indexOf(a.key) - names.indexOf(b.key));
}

export function computeByHour(enriched) {
  const rows = summarizeGroups(enriched, (t) => t.hourOfDay);
  return rows.sort((a, b) => a.key - b.key);
}

export function computeBySide(enriched) {
  return summarizeGroups(enriched, (t) => (t.side === 'buy' ? 'Long' : 'Short'));
}

export function computeCalendarDaily(enriched) {
  const map = groupBy(enriched, (t) => t.dateKey);
  const result = new Map();
  for (const [date, trades] of map.entries()) {
    const pl = trades.reduce((s, t) => s + t.pl, 0);
    const wins = trades.filter((t) => t.isWin).length;
    result.set(date, { date, pl, trades: trades.length, wins, losses: trades.filter((t) => t.isLoss).length });
  }
  return result;
}

export function computeMonthlyPL(enriched) {
  const map = groupBy(enriched, (t) => t.dateKey.slice(0, 7));
  return Array.from(map.entries())
    .map(([month, trades]) => ({ month, pl: trades.reduce((s, t) => s + t.pl, 0), trades: trades.length }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function computeRDistribution(enriched) {
  const buckets = [
    { label: '< -2R', min: -Infinity, max: -2 },
    { label: '-2R to -1R', min: -2, max: -1 },
    { label: '-1R to 0R', min: -1, max: 0 },
    { label: '0R to 1R', min: 0, max: 1 },
    { label: '1R to 2R', min: 1, max: 2 },
    { label: '2R to 3R', min: 2, max: 3 },
    { label: '> 3R', min: 3, max: Infinity },
  ];
  const withR = enriched.filter((t) => t.rMultiple != null);
  return buckets.map((b) => ({
    label: b.label,
    count: withR.filter((t) => t.rMultiple >= b.min && t.rMultiple < b.max).length,
  }));
}

export function computeKellyPercent(summary) {
  // Kelly % = W - (1-W)/R, where W = win rate (decimal), R = avg win/avg loss ratio
  if (!summary.totalTrades || summary.avgRR == null || summary.avgRR === 0) return null;
  const W = summary.winRate / 100;
  const R = summary.avgRR;
  const kelly = W - (1 - W) / R;
  return kelly * 100;
}

export function computeStdDev(values) {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

export function computeSharpe(enriched) {
  // Simplified per-trade Sharpe (not annualized): mean(pl) / stdev(pl)
  const pls = enriched.map((t) => t.pl);
  if (pls.length < 2) return null;
  const mean = pls.reduce((a, b) => a + b, 0) / pls.length;
  const sd = computeStdDev(pls);
  return sd !== 0 ? mean / sd : null;
}

export function buildFullAnalytics(trades, startingBalance = 0) {
  const enriched = enrichTrades(trades);
  const summary = computeSummary(enriched);
  const equityCurve = computeEquityCurve(enriched, startingBalance);
  const drawdown = computeDrawdown(equityCurve);
  const streaks = computeStreaks(enriched);
  const bySymbol = computeBySymbol(enriched);
  const bySession = computeBySession(enriched);
  const byDayOfWeek = computeByDayOfWeek(enriched);
  const byHour = computeByHour(enriched);
  const bySide = computeBySide(enriched);
  const calendarDaily = computeCalendarDaily(enriched);
  const monthlyPL = computeMonthlyPL(enriched);
  const rDistribution = computeRDistribution(enriched);
  const kellyPercent = computeKellyPercent(summary);
  const sharpe = computeSharpe(enriched);
  return {
    enriched, summary, equityCurve, drawdown, streaks, bySymbol, bySession,
    byDayOfWeek, byHour, bySide, calendarDaily, monthlyPL, rDistribution,
    kellyPercent, sharpe,
  };
}
