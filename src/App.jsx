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
  const [startingBalance, setStartingBalance] = useState(() => {
    const v = localStorage.getItem('tradedash:startingBalance');
    return v ? Number(v) : null;
  });

  useEffect(() => {
    if (startingBalance != null) {
      localStorage.setItem('tradedash:startingBalance', String(startingBalance));
    }
  }, [startingBalance]);

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
    refresh();
  }, [refresh]);

  const allTrades = useMemo(() => mergeAllTrades(storedState), [storedState]);
  const allDeals = useMemo(() => mergeAllDeals(storedState), [storedState]);
  const openPositions = useMemo(() => latestOpenPositions(storedState), [storedState]);

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
    const sorted = [...storedState.reports].sort((a, b) => new Date(b.meta.reportDate || 0) - new Date(a.meta.reportDate || 0));
    return sorted[0].accountSummary;
  }, [storedState]);

  const hasData = allTrades.length > 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        tabs={TABS}
        activeTab={activeTab}
        onSelect={setActiveTab}
        accountMeta={accountMeta}
        hasData={hasData}
      />
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
