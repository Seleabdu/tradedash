import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { fmtCurrency, fmtDate, plClass } from '../lib/format.js';
import { loadJournal } from '../lib/storage.js';
import TradeDetailDrawer from '../components/TradeDetailDrawer.jsx';

export default function JournalPage({ analytics }) {
  const { enriched } = analytics;
  const [journal, setJournal] = useState(loadJournal());
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [tagFilter, setTagFilter] = useState('all');

  useEffect(() => {
    if (!selectedTrade) setJournal(loadJournal());
  }, [selectedTrade]);

  const journaled = useMemo(() => {
    return enriched
      .filter((t) => {
        const entry = journal[t.id];
        if (!entry) return false;
        return (
          entry.note?.trim() ||
          entry.entryReason?.trim() ||
          entry.exitReason?.trim() ||
          entry.emotion?.trim() ||
          entry.mistakeDetail?.trim() ||
          entry.tags?.length ||
          entry.screenshots?.length ||
          entry.confidenceScore != null
        );
      })
      .map((t) => ({ ...t, entry: journal[t.id] }))
      .sort((a, b) => new Date(b.closeTime) - new Date(a.closeTime));
  }, [enriched, journal]);

  const allTags = useMemo(() => {
    const set = new Set();
    Object.values(journal).forEach((e) => {
      if (e.tags) e.tags.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [journal]);

  const tagStats = useMemo(() => {
    const stats = {};
    enriched.forEach((t) => {
      const tags = journal[t.id]?.tags || [];
      tags.forEach((tag) => {
        if (!stats[tag]) stats[tag] = { count: 0, pl: 0 };
        stats[tag].count += 1;
        stats[tag].pl += t.pl;
      });
    });
    return stats;
  }, [enriched, journal]);

  const filtered = tagFilter === 'all' ? journaled : journaled.filter((t) => t.entry.tags?.includes(tagFilter));

  return (
    <div>
      <PageHeader title="Journal" subtitle={`${journaled.length} trades with notes & analysis · ${allTags.length} active tags`}>
        {allTags.length > 0 && (
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={selectStyle}>
            <option value="all">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </PageHeader>

      <div style={{ padding: '0 28px 28px' }}>
        {allTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {Object.entries(tagStats).map(([tag, s]) => (
              <div
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? 'all' : tag)}
                style={{
                  background: tagFilter === tag ? 'rgba(232, 163, 61, 0.15)' : 'var(--ink-2)',
                  border: `1px solid ${tagFilter === tag ? 'var(--amber)' : 'var(--line)'}`,
                  padding: '6px 12px',
                  fontSize: 12,
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontWeight: 600, color: tagFilter === tag ? 'var(--amber)' : 'var(--bone)' }}>{tag}</span>
                <span style={{ color: 'var(--bone-faint)', marginLeft: 8 }}>{s.count}×</span>
                <span className={`mono ${plClass(s.pl)}`} style={{ marginLeft: 8 }}>
                  {fmtCurrency(s.pl, { signed: true })}
                </span>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ color: 'var(--bone-faint)', fontSize: 13.5, padding: '40px 0', textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 6 }}>
            No journal entries match. Click any trade in the Trades tab to add screenshots, confidence ratings, and entry/exit reasons!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((t) => {
              const { entry } = t;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrade(t)}
                  style={{
                    background: 'var(--ink-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--amber)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{t.symbol}</span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: t.side === 'buy' ? 'rgba(63, 182, 139, 0.15)' : 'rgba(229, 86, 109, 0.15)',
                          color: t.side === 'buy' ? 'var(--green)' : 'var(--red)',
                        }}
                      >
                        {t.side}
                      </span>
                      <span style={{ color: 'var(--bone-faint)', fontSize: 12 }}>{fmtDate(t.closeTime, { withTime: true })}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {entry.confidenceScore != null && (
                        <span
                          style={{
                            background: 'rgba(232, 163, 61, 0.15)',
                            border: '1px solid var(--amber-dim)',
                            color: 'var(--amber)',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ★ {entry.confidenceScore}/10 Confidence
                        </span>
                      )}
                      <span className={`mono ${plClass(t.pl)}`} style={{ fontWeight: 700, fontSize: 16 }}>
                        {fmtCurrency(t.pl, { signed: true })}
                      </span>
                    </div>
                  </div>

                  {/* Tags Row */}
                  {entry.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {entry.sessionTags?.map((tag) => (
                        <span key={tag} style={tagBadgeStyle('var(--amber)')}>
                          🕒 {tag}
                        </span>
                      ))}
                      {entry.psychologicalStates?.map((tag) => (
                        <span key={tag} style={tagBadgeStyle('var(--green)')}>
                          🧠 {tag}
                        </span>
                      ))}
                      {entry.mistakes?.map((tag) => (
                        <span key={tag} style={tagBadgeStyle('var(--red)')}>
                          ⚠️ {tag}
                        </span>
                      ))}
                      {entry.marketConditions?.map((tag) => (
                        <span key={tag} style={tagBadgeStyle('var(--bone-dim)')}>
                          📊 {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Structured Details Grid */}
                  {(entry.entryReason || entry.exitReason || entry.emotion || entry.mistakeDetail || entry.riskedAmount) && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 10,
                        background: 'var(--ink-3)',
                        padding: '10px 14px',
                        borderRadius: 4,
                        marginBottom: 10,
                        fontSize: 12,
                      }}
                    >
                      {entry.entryReason && (
                        <div>
                          <span style={{ color: 'var(--bone-faint)', fontWeight: 600 }}>Entry Reason: </span>
                          <span style={{ color: 'var(--bone)' }}>{entry.entryReason}</span>
                        </div>
                      )}
                      {entry.exitReason && (
                        <div>
                          <span style={{ color: 'var(--bone-faint)', fontWeight: 600 }}>Exit Reason: </span>
                          <span style={{ color: 'var(--bone)' }}>{entry.exitReason}</span>
                        </div>
                      )}
                      {entry.emotion && (
                        <div>
                          <span style={{ color: 'var(--bone-faint)', fontWeight: 600 }}>Emotion: </span>
                          <span style={{ color: 'var(--bone)' }}>{entry.emotion}</span>
                        </div>
                      )}
                      {entry.mistakeDetail && (
                        <div>
                          <span style={{ color: 'var(--red)', fontWeight: 600 }}>Mistake Note: </span>
                          <span style={{ color: 'var(--bone)' }}>{entry.mistakeDetail}</span>
                        </div>
                      )}
                      {entry.riskedAmount && (
                        <div>
                          <span style={{ color: 'var(--bone-faint)', fontWeight: 600 }}>Risked: </span>
                          <span className="mono" style={{ color: 'var(--amber)' }}>{entry.riskedAmount}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* General Note */}
                  {entry.note && (
                    <div style={{ fontSize: 13, color: 'var(--bone-dim)', lineHeight: 1.5, marginBottom: entry.screenshots?.length ? 12 : 0 }}>
                      {entry.note}
                    </div>
                  )}

                  {/* Screenshots Thumbnail Preview */}
                  {entry.screenshots?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 4 }}>
                      {entry.screenshots.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`Screenshot preview ${i + 1}`}
                          style={{
                            height: 60,
                            width: 100,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid var(--line)',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTrade && <TradeDetailDrawer trade={selectedTrade} onClose={() => setSelectedTrade(null)} />}
    </div>
  );
}

const tagBadgeStyle = (color) => ({
  background: 'var(--ink-3)',
  border: `1px solid ${color}44`,
  borderRadius: 12,
  padding: '2px 8px',
  fontSize: 10.5,
  color: color,
  fontWeight: 500,
});

const selectStyle = {
  background: 'var(--ink-3)',
  border: '1px solid var(--line)',
  color: 'var(--bone)',
  padding: '7px 10px',
  fontSize: 12.5,
  borderRadius: 2,
};
