import React, { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { fmtCurrency, fmtDate } from '../lib/format.js';
import { clearAll } from '../lib/storage.js';

export default function ReportsPage({
  reports,
  selectedReportIds = [],
  onToggleSelectReport,
  onSelectAllReports,
  onDeselectAllReports,
  onDelete,
  startingBalance,
  onChangeStartingBalance,
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const sorted = [...reports].sort((a, b) => new Date(b.meta.reportDate || 0) - new Date(a.meta.reportDate || 0));

  const allSelected = reports.length > 0 && selectedReportIds.length === reports.length;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={`${reports.length} report${reports.length !== 1 ? 's' : ''} imported · ${selectedReportIds.length} selected for analysis`}
      >
        {reports.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={allSelected ? onDeselectAllReports : onSelectAllReports}
              style={{
                background: 'var(--ink-3)',
                border: '1px solid var(--line)',
                color: 'var(--amber)',
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        )}
      </PageHeader>

      <div style={{ padding: '0 28px 28px' }}>
        {reports.length === 0 ? (
          <div style={{ color: 'var(--bone-faint)', fontSize: 13.5 }}>No reports imported yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {sorted.map((r) => {
              const isSelected = selectedReportIds.includes(r.id);
              return (
                <div
                  key={r.id}
                  style={{
                    background: isSelected ? 'var(--ink-3)' : 'var(--ink-2)',
                    border: `1px solid ${isSelected ? 'var(--amber)' : 'var(--line)'}`,
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                    borderRadius: 3,
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectReport(r.id)}
                      style={{ accentColor: 'var(--amber)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {r.fileName}
                        {isSelected && (
                          <span style={{ fontSize: 10, background: 'var(--amber-dim)', color: 'var(--bone)', padding: '1px 6px', borderRadius: 2, textTransform: 'uppercase' }}>
                            Analyzing
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--bone-faint)', marginTop: 3 }}>
                        {r.meta.name ? `${r.meta.name} (${r.meta.account?.split('(')[0].trim()}) · ` : ''}Report date {r.meta.reportDate} · Imported {fmtDate(r.importedAt, { withTime: true })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="mono" style={{ fontSize: 12.5, color: 'var(--bone-dim)' }}>
                      {r.trades.length} trades · {r.deals.length} deals
                    </div>
                    <div className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>
                      {fmtCurrency(r.results.totalNetProfit)}
                    </div>
                    <button
                      onClick={() => onDelete(r.id)}
                      style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--red)', padding: '6px 12px', fontSize: 11.5, borderRadius: 2 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--line)', padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Settings</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--bone-dim)' }}>Starting balance used for the equity curve</span>
            <input
              type="number"
              value={startingBalance}
              onChange={(e) => onChangeStartingBalance(Number(e.target.value))}
              className="mono"
              style={{ width: 130, background: 'var(--ink-3)', border: '1px solid var(--line)', color: 'var(--bone)', padding: '6px 10px', fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ background: 'var(--ink-2)', border: '1px solid var(--red-dim)', padding: '16px 18px' }}>
          <div style={{ fontSize: 12, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Danger zone</div>
          <p style={{ fontSize: 12.5, color: 'var(--bone-faint)', marginBottom: 12 }}>
            Removes every imported report and journal note from this browser. This can't be undone.
          </p>
          {confirmClear ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { clearAll(); window.location.reload(); }}
                style={{ background: 'var(--red)', color: 'var(--ink)', border: 'none', padding: '7px 14px', fontSize: 12.5, fontWeight: 700, borderRadius: 2 }}
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--bone-dim)', padding: '7px 14px', fontSize: 12.5, borderRadius: 2 }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{ background: 'transparent', border: '1px solid var(--red-dim)', color: 'var(--red)', padding: '7px 14px', fontSize: 12.5, borderRadius: 2 }}
            >
              Clear all data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
