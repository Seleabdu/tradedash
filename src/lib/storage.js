// Local persistence — everything lives in the browser via localStorage.
// No server, no account, no sync. Your data stays on your machine.

const STORAGE_KEY = 'tradedash:v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { reports: [], importedFileHashes: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored data', e);
    return { reports: [], importedFileHashes: [] };
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Failed to save data', e);
    return false;
  }
}

export async function hashString(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getState() {
  return load();
}

export function saveReport(report) {
  const state = load();
  // dedupe by report id (account + report date)
  const existingIdx = state.reports.findIndex((r) => r.id === report.id);
  if (existingIdx >= 0) {
    state.reports[existingIdx] = report;
  } else {
    state.reports.push(report);
  }
  save(state);
  return state;
}

export function deleteReport(reportId) {
  const state = load();
  state.reports = state.reports.filter((r) => r.id !== reportId);
  save(state);
  return state;
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
}

// Merge trades from all stored reports, deduping by trade id (position id is
// stable across exports of the same account, so re-importing a newer report
// that overlaps an older one won't double count).
export function mergeAllTrades(state, selectedIds = null) {
  const seen = new Map();
  const reportsToMerge = selectedIds && selectedIds.length > 0
    ? state.reports.filter((r) => selectedIds.includes(r.id))
    : state.reports;
  for (const report of reportsToMerge) {
    for (const trade of report.trades) {
      seen.set(trade.id, trade);
    }
  }
  return Array.from(seen.values());
}

export function mergeAllDeals(state, selectedIds = null) {
  const seen = new Map();
  const reportsToMerge = selectedIds && selectedIds.length > 0
    ? state.reports.filter((r) => selectedIds.includes(r.id))
    : state.reports;
  for (const report of reportsToMerge) {
    for (const deal of report.deals || []) {
      seen.set(deal.id, deal);
    }
  }
  return Array.from(seen.values());
}

export function latestOpenPositions(state, selectedIds = null) {
  const reportsToMerge = selectedIds && selectedIds.length > 0
    ? state.reports.filter((r) => selectedIds.includes(r.id))
    : state.reports;
  if (!reportsToMerge.length) return [];
  const latest = [...reportsToMerge].sort((a, b) => new Date(b.meta.reportDate || 0) - new Date(a.meta.reportDate || 0))[0];
  return latest ? latest.openPositions : [];
}

// --- Trade notes / tags / screenshots, keyed by trade id, stored separately so
// they survive re-imports of the same report. ---
const JOURNAL_KEY = 'tradedash:journal:v1';

export function loadJournal() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveJournalEntry(tradeId, entry) {
  const journal = loadJournal();
  journal[tradeId] = { ...(journal[tradeId] || {}), ...entry };
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  return journal;
}

export function deleteJournalEntry(tradeId) {
  const journal = loadJournal();
  delete journal[tradeId];
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  return journal;
}
