import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { parseReportFile } from './lib/parser.js';
import { getState, saveReport, deleteReport, mergeAllTrades, mergeAllDeals, latestOpenPositions, hashString } from './lib/storage.js';
import { buildFullAnalytics } from './lib/analytics.js';
import Sidebar from './components/Sidebar.jsx';
import ImportPanel from './components/ImportPanel.jsx';
import Overview from './pages/Overview.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import TradesPage from './pages/TradesPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import JournalPage from './pages/JournalPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import EmptyState from './components/EmptyState.jsx';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'trades', label: 'Trades' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'journal', label: 'Journal' },
  { key: 'reports', label: 'Reports' },
];

export default function App() {
  const [storedState, setStoredState] = useState(() => getState());
  const [activeTab, setActiveTab] = useState('overview');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [startingBalance, setStartingBalance] = useState(() => {
    const v = localStorage.getItem('tradedash:startingBalance');
    return v ? Number(v) : null;
  });

  const [selectedReportIds, setSelectedReportIds] = useState(() => {
    return storedState.reports.map((r) => r.id);
  });

  useEffect(() => {
    if (startingBalance != null) {
      localStorage.setItem('tradedash:startingBalance', String(startingBalance));
    }
  }, [startingBalance]);

  useEffect(() => {
    setSelectedReportIds((prev) => {
      const allIds = storedState.reports.map((r) => r.id);
      if (!prev || prev.length === 0) return allIds;
      const valid = prev.filter((id) => allIds.includes(id));
      const newIds = allIds.filter((id) => !prev.includes(id));
      return [...valid, ...newIds];
    });
  }, [storedState.reports]);

  const refresh = useCallback(() => setStoredState(getState()), []);

  const handleImport = useCallback(async (files) => {
    setImporting(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      let importedCount = 0;
      let lastTradeCount = 0;
      for (const file of files) {
        const parsed = await parseReportFile(file);
        const idSeed = `${parsed.meta.account}__${parsed.meta.reportDate}__${parsed.trades.length}`;
        const id = await hashString(idSeed);
        const report = { id, fileName: file.name, importedAt: new Date().toISOString(), ...parsed };
        saveReport(report);
        importedCount += 1;
        lastTradeCount = parsed.trades.length;
      }
      refresh();
      setImportSuccess(
        importedCount === 1
          ? `Imported 1 report — ${lastTradeCount} closed trades found.`
          : `Imported ${importedCount} reports.`
      );
    } catch (err) {
      console.error(err);
      setImportError(err.message || 'Could not read that file. Make sure it\u2019s an MT5 Trade History Report export.');
    } finally {
      setImporting(false);
    }
  }, [refresh]);

  const handleDeleteReport = useCallback((id) => {
    deleteReport(id);
    setSelectedReportIds((prev) => prev.filter((i) => i !== id));
    refresh();
  }, [refresh]);

  const handleToggleSelectReport = useCallback((id) => {
    setSelectedReportIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllReports = useCallback(() => {
    setSelectedReportIds(storedState.reports.map((r) => r.id));
  }, [storedState.reports]);

  const handleDeselectAllReports = useCallback(() => {
    setSelectedReportIds([]);
  }, []);

  const allTrades = useMemo(() => mergeAllTrades(storedState, selectedReportIds), [storedState, selectedReportIds]);
  const allDeals = useMemo(() => mergeAllDeals(storedState, selectedReportIds), [storedState, selectedReportIds]);
  const openPositions = useMemo(() => latestOpenPositions(storedState, selectedReportIds), [storedState, selectedReportIds]);

  // Infer the real starting balance from the earliest "balance" deal (the initial
  // deposit MT5 logs) so the equity curve and drawdown % are meaningful by default.
  const inferredStartingBalance = useMemo(() => {
    const deposits = allDeals
      .filter((d) => d.type === 'balance')
      .sort((a, b) => new Date(a.time) - new Date(b.time));
    return deposits.length ? deposits[0].balance : null;
  }, [allDeals]);
  const effectiveStartingBalance = startingBalance != null ? startingBalance : (inferredStartingBalance ?? 0);

  const analytics = useMemo(() => buildFullAnalytics(allTrades, effectiveStartingBalance), [allTrades, effectiveStartingBalance]);
  const accountMeta = storedState.reports.length ? storedState.reports[storedState.reports.length - 1].meta : null;
  const latestAccountSummary = useMemo(() => {
    if (!storedState.reports.length) return null;
    const selectedReportsList = storedState.reports.filter((r) => selectedReportIds.includes(r.id));
    if (!selectedReportsList.length) return null;
    const sorted = [...selectedReportsList].sort((a, b) => new Date(b.meta.reportDate || 0) - new Date(a.meta.reportDate || 0));
    return sorted[0].accountSummary;
  }, [storedState, selectedReportIds]);

  const hasData = allTrades.length > 0;

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <div className="sidebar-desktop">
        <Sidebar
          tabs={TABS}
          activeTab={activeTab}
          onSelect={setActiveTab}
          accountMeta={accountMeta}
          hasData={hasData}
        />
      </div>

      {/* Mobile Header Bar */}
      <header className="mobile-header-bar">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="hamburger-btn"
          aria-label="Toggle navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--amber)', letterSpacing: '-0.02em' }}>
            LEDGER
          </span>
          <span style={{ fontSize: 12, color: 'var(--bone-dim)', textTransform: 'capitalize' }}>
            · {activeTab}
          </span>
        </div>

        {storedState.reports.length > 0 && (
          <span style={{ fontSize: 11, background: 'var(--ink-3)', border: '1px solid var(--line)', padding: '3px 8px', borderRadius: 12, color: 'var(--bone-dim)' }}>
            {selectedReportIds.length}/{storedState.reports.length} Reports
          </span>
        )}
      </header>

      {/* Mobile Dropdown / Slide-over Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--line-soft)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--amber)' }}>
                  LEDGER
                </div>
                <div style={{ fontSize: 11, color: 'var(--bone-faint)', textTransform: 'uppercase', marginTop: 2 }}>
                  Trading Journal
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--bone-dim)', fontSize: 22, cursor: 'pointer', padding: 4 }}
              >
                ×
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', padding: '12px', gap: 4 }}>
              {TABS.map((tab) => {
                const active = tab.key === activeTab;
                const disabled = !hasData && tab.key !== 'reports';
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (!disabled) {
                        setActiveTab(tab.key);
                        setMobileMenuOpen(false);
                      }
                    }}
                    disabled={disabled}
                    style={{
                      textAlign: 'left',
                      background: active ? 'var(--ink-3)' : 'transparent',
                      color: disabled ? 'var(--bone-faint)' : active ? 'var(--amber)' : 'var(--bone)',
                      border: 'none',
                      borderLeft: active ? '3px solid var(--amber)' : '3px solid transparent',
                      padding: '12px 16px',
                      fontSize: 15,
                      fontWeight: active ? 600 : 500,
                      borderRadius: 4,
                      opacity: disabled ? 0.5 : 1,
                      cursor: disabled ? 'default' : 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {accountMeta && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line-soft)', marginTop: 'auto', fontSize: 12, color: 'var(--bone-faint)' }}>
                <div style={{ color: 'var(--bone-dim)', fontWeight: 600 }}>{accountMeta.name}</div>
                <div className="mono" style={{ marginTop: 2 }}>{accountMeta.account?.split('(')[0].trim()}</div>
                <div>{accountMeta.company}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <ImportPanel
          onImport={handleImport}
          importing={importing}
          error={importError}
          success={importSuccess}
          onDismiss={() => { setImportError(null); setImportSuccess(null); }}
        />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {!hasData ? (
            <EmptyState onImport={handleImport} importing={importing} />
          ) : (
            <>
              {activeTab === 'overview' && (
                <Overview
                  analytics={analytics}
                  openPositions={openPositions}
                  accountSummary={latestAccountSummary}
                  startingBalance={effectiveStartingBalance}
                  onChangeStartingBalance={setStartingBalance}
                />
              )}
              {activeTab === 'calendar' && <CalendarPage analytics={analytics} />}
              {activeTab === 'trades' && <TradesPage analytics={analytics} />}
              {activeTab === 'analytics' && <AnalyticsPage analytics={analytics} />}
              {activeTab === 'journal' && <JournalPage analytics={analytics} />}
              {activeTab === 'reports' && (
                <ReportsPage
                  reports={storedState.reports}
                  selectedReportIds={selectedReportIds}
                  onToggleSelectReport={handleToggleSelectReport}
                  onSelectAllReports={handleSelectAllReports}
                  onDeselectAllReports={handleDeselectAllReports}
                  onDelete={handleDeleteReport}
                  startingBalance={effectiveStartingBalance}
                  onChangeStartingBalance={setStartingBalance}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
