import React, { useState, useEffect } from 'react';
import { fmtCurrency, fmtDate, fmtDuration, fmtNumber, plClass } from '../lib/format.js';
import { loadJournal, saveJournalEntry } from '../lib/storage.js';
import { compressImageFile } from '../lib/imageUtils.js';
import MultiSelectDropdown from './MultiSelectDropdown.jsx';
import LightboxModal from './LightboxModal.jsx';

const SESSION_TAGS = ['NY open', 'London Open', 'Asian'];

const PSYCHOLOGICAL_STATES = [
  'Focused',
  'Confident',
  'Calm',
  'Greedy',
  'Fearful',
  'FOMO',
  'Hope',
  'Bored',
  'Revenge',
  'Impatient',
  'Excited',
  'Frustrated',
  'overconfident',
  'Hesitant',
  'patient',
];

const MISTAKES_OPTIONS = [
  'Early Entry',
  'Late Entry',
  'Early Exit',
  'Ignored trend',
  'Moved stop',
  'Moved TP',
  'Risked too much',
  'Overtraded',
  "Didn't follow plan",
  'Ignored news',
  'Poor RR',
  "Didn't wait for confirmation",
  'Chased price',
  'Held loser',
  'Cut winner early',
  'countertrend',
];

const MARKET_CONDITIONS = [
  'Trending',
  'Ranging',
  'Volatile',
  'Low Volatility',
  'News',
  'Holiday',
  'End of Month',
  'High Spread',
  'Low Liquidity',
];

export default function TradeDetailDrawer({ trade, onClose }) {
  const [note, setNote] = useState('');
  const [entryReason, setEntryReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [emotion, setEmotion] = useState('');
  const [mistakeDetail, setMistakeDetail] = useState('');
  const [riskedAmount, setRiskedAmount] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(null); // 1-10

  const [sessionTags, setSessionTags] = useState([]);
  const [psychologicalStates, setPsychologicalStates] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [marketConditions, setMarketConditions] = useState([]);

  const [screenshots, setScreenshots] = useState([]); // Array of Data URLs
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const journal = loadJournal();
    const entry = journal[trade.id] || {};
    setNote(entry.note || '');
    setEntryReason(entry.entryReason || '');
    setExitReason(entry.exitReason || '');
    setEmotion(entry.emotion || '');
    setMistakeDetail(entry.mistakeDetail || '');
    setRiskedAmount(entry.riskedAmount != null ? String(entry.riskedAmount) : '');
    setConfidenceScore(entry.confidenceScore != null ? Number(entry.confidenceScore) : null);

    setSessionTags(entry.sessionTags || []);
    setPsychologicalStates(entry.psychologicalStates || []);
    setMistakes(entry.mistakes || []);
    setMarketConditions(entry.marketConditions || []);
    setScreenshots(entry.screenshots || []);

    setSaved(false);
  }, [trade.id]);

  const toggleSessionTag = (tag) => {
    setSessionTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    setSaved(false);
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const remainingSlots = 6 - screenshots.length;
    if (remainingSlots <= 0) return;

    setIsUploading(true);
    try {
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const newImages = [];
      for (const file of filesToProcess) {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageFile(file);
          newImages.push(compressed);
        }
      }
      setScreenshots((prev) => [...prev, ...newImages].slice(0, 6));
      setSaved(false);
    } catch (err) {
      console.error('Error processing screenshot upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeScreenshot = (index) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const handleSave = () => {
    // Combine all tag categories into a unified tags array for legacy support
    const allTags = Array.from(
      new Set([
        ...sessionTags,
        ...psychologicalStates,
        ...mistakes,
        ...marketConditions,
      ])
    );

    const journalData = {
      note,
      entryReason,
      exitReason,
      emotion,
      mistakeDetail,
      riskedAmount,
      confidenceScore,
      sessionTags,
      psychologicalStates,
      mistakes,
      marketConditions,
      tags: allTags,
      screenshots,
    };

    saveJournalEntry(trade.id, journalData);
    setSaved(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(2px)' }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 520,
          maxWidth: '94vw',
          background: 'var(--ink-2)',
          borderLeft: '1px solid var(--line)',
          zIndex: 50,
          overflowY: 'auto',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              {trade.symbol}
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: trade.side === 'buy' ? 'rgba(63, 182, 139, 0.15)' : 'rgba(229, 86, 109, 0.15)',
                  color: trade.side === 'buy' ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${trade.side === 'buy' ? 'var(--green-dim)' : 'var(--red-dim)'}`,
                }}
              >
                {trade.side}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--bone-faint)', marginTop: 4 }}>
              {fmtDate(trade.openTime, { withTime: true })} → {fmtDate(trade.closeTime, { withTime: true })}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--ink-3)',
              border: '1px solid var(--line)',
              color: 'var(--bone-dim)',
              fontSize: 18,
              width: 32,
              height: 32,
              borderRadius: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* P/L Banner */}
        <div
          style={{
            background: 'var(--ink-3)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit / Loss</div>
            <div className={`mono ${plClass(trade.pl)}`} style={{ fontSize: 26, fontWeight: 700, marginTop: 2 }}>
              {fmtCurrency(trade.pl, { signed: true })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>R-Multiple</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600, marginTop: 2, color: trade.rMultiple > 0 ? 'var(--green)' : trade.rMultiple < 0 ? 'var(--red)' : 'var(--bone)' }}>
              {trade.rMultiple != null ? `${fmtNumber(trade.rMultiple, 2)}R` : '—'}
            </div>
          </div>
        </div>

        {/* Trade Details Grid */}
        <Grid>
          <Field label="Volume" value={trade.volume} />
          <Field label="Open Price" value={fmtNumber(trade.openPrice, 5)} />
          <Field label="Close Price" value={fmtNumber(trade.closePrice, 5)} />
          <Field label="Pips" value={trade.pips != null ? fmtNumber(trade.pips, 1) : '—'} />
          <Field label="Stop Loss" value={trade.stopLoss != null ? fmtNumber(trade.stopLoss, 5) : '—'} />
          <Field label="Take Profit" value={trade.takeProfit != null ? fmtNumber(trade.takeProfit, 5) : '—'} />
          <Field label="Duration" value={fmtDuration(trade.durationMin)} />
          <Field label="Swap / Comm." value={`${fmtCurrency(trade.swap)} / ${fmtCurrency(trade.commission)}`} />
        </Grid>

        <div style={{ borderBottom: '1px solid var(--line)', margin: '20px 0' }} />

        {/* Section Title */}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📖 Trade Journal & Analysis</span>
        </div>

        {/* Confidence Score (1-10) */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Confidence Score (1 - 10)
            </span>
            {confidenceScore != null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>
                {confidenceScore} / 10
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
              const isSelected = confidenceScore === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => {
                    setConfidenceScore(score);
                    setSaved(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 4,
                    border: `1px solid ${isSelected ? 'var(--amber)' : 'var(--line)'}`,
                    background: isSelected ? 'var(--amber)' : 'var(--ink-3)',
                    color: isSelected ? 'var(--ink)' : 'var(--bone-dim)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {score}
                </button>
              );
            })}
          </div>
        </div>

        {/* Risked Amount */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            Risked Amount
          </div>
          <input
            type="text"
            value={riskedAmount}
            onChange={(e) => {
              setRiskedAmount(e.target.value);
              setSaved(false);
            }}
            placeholder="e.g. $250 or 1.5%"
            style={{
              width: '100%',
              background: 'var(--ink-3)',
              border: '1px solid var(--line)',
              borderRadius: 4,
              color: 'var(--bone)',
              padding: '8px 12px',
              fontSize: 13,
              fontFamily: 'var(--font-ui)',
            }}
          />
        </div>

        {/* Session Tags */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Session Tags
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SESSION_TAGS.map((tag) => {
              const isSelected = sessionTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleSessionTag(tag)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 14,
                    border: `1px solid ${isSelected ? 'var(--amber)' : 'var(--line)'}`,
                    background: isSelected ? 'rgba(232, 163, 61, 0.18)' : 'var(--ink-3)',
                    color: isSelected ? 'var(--amber)' : 'var(--bone-dim)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tag} {isSelected ? '✓' : '+'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Psychological States Dropdown */}
        <div style={{ marginBottom: 16 }}>
          <MultiSelectDropdown
            label="Psychological States"
            options={PSYCHOLOGICAL_STATES}
            selected={psychologicalStates}
            onChange={(val) => {
              setPsychologicalStates(val);
              setSaved(false);
            }}
            placeholder="Select psychological states (e.g. Focused, Calm, FOMO)..."
            accentColor="#3fb68b"
          />
        </div>

        {/* Mistakes Dropdown */}
        <div style={{ marginBottom: 16 }}>
          <MultiSelectDropdown
            label="Mistakes Tags"
            options={MISTAKES_OPTIONS}
            selected={mistakes}
            onChange={(val) => {
              setMistakes(val);
              setSaved(false);
            }}
            placeholder="Select mistake tags (e.g. Early Entry, Overtraded)..."
            accentColor="#e5566d"
          />
        </div>

        {/* Market Condition Tags Dropdown */}
        <div style={{ marginBottom: 20 }}>
          <MultiSelectDropdown
            label="Market Condition Tags"
            options={MARKET_CONDITIONS}
            selected={marketConditions}
            onChange={(val) => {
              setMarketConditions(val);
              setSaved(false);
            }}
            placeholder="Select market conditions (e.g. Trending, Volatile)..."
            accentColor="#e8a33d"
          />
        </div>

        {/* Entry Reason */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            Entry Reason
          </div>
          <textarea
            value={entryReason}
            onChange={(e) => {
              setEntryReason(e.target.value);
              setSaved(false);
            }}
            placeholder="Why did you take this entry? (Setup, indicator confluence, level test...)"
            rows={2}
            style={textareaStyle}
          />
        </div>

        {/* Exit Reason */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            Exit Reason
          </div>
          <textarea
            value={exitReason}
            onChange={(e) => {
              setExitReason(e.target.value);
              setSaved(false);
            }}
            placeholder="Why did you exit? (Target hit, trail stop, market structure shift...)"
            rows={2}
            style={textareaStyle}
          />
        </div>

        {/* Emotion & Mistake Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Emotion Notes
            </div>
            <input
              type="text"
              value={emotion}
              onChange={(e) => {
                setEmotion(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g. Calm during hold"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Mistake Details
            </div>
            <input
              type="text"
              value={mistakeDetail}
              onChange={(e) => {
                setMistakeDetail(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g. Moved SL too early"
              style={inputStyle}
            />
          </div>
        </div>

        {/* General Notes */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
            General Notes & Takeaways
          </div>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            placeholder="Overall thoughts, lessons learned, or trade review..."
            rows={3}
            style={textareaStyle}
          />
        </div>

        {/* Screenshots Section (Up to 6) */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Screenshots ({screenshots.length}/6)
            </span>
            {screenshots.length < 6 && (
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--amber)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                + Add Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            )}
          </div>

          {/* Upload Drop Zone */}
          {screenshots.length < 6 && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              style={{
                border: `2px dashed ${dragOver ? 'var(--amber)' : 'var(--line)'}`,
                background: dragOver ? 'rgba(232, 163, 61, 0.08)' : 'var(--ink-3)',
                borderRadius: 6,
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: 12,
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="file"
                id="screenshot-file-input"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <label htmlFor="screenshot-file-input" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                <div style={{ fontSize: 12.5, color: 'var(--bone)', fontWeight: 500 }}>
                  {isUploading ? 'Compressing & uploading image...' : 'Drop chart screenshots here or click to browse'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--bone-faint)', marginTop: 2 }}>
                  Supports PNG, JPG, WEBP (Max 6 screenshots)
                </div>
              </label>
            </div>
          )}

          {/* Screenshot Thumbnails Grid */}
          {screenshots.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {screenshots.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    aspectRatio: '16/9',
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid var(--line)',
                    background: '#000',
                  }}
                >
                  <img
                    src={src}
                    alt={`Screenshot ${idx + 1}`}
                    onClick={() => setLightboxIndex(idx)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(idx)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      color: 'var(--red)',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      fontSize: 14,
                      lineHeight: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            marginTop: 'auto',
            width: '100%',
            background: saved ? 'var(--green)' : 'var(--amber)',
            color: 'var(--ink)',
            border: 'none',
            padding: '12px',
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 4,
            transition: 'background 0.2s ease',
          }}
        >
          {saved ? '✓ Journal Entry Saved' : 'Save Journal Entry'}
        </button>
      </div>

      {/* Lightbox for screenshots */}
      {lightboxIndex !== null && (
        <LightboxModal
          images={screenshots}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </>
  );
}

function Grid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px 12px' }}>{children}</div>;
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--bone-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 12.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--ink-3)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  color: 'var(--bone)',
  padding: '8px 10px',
  fontSize: 12.5,
  fontFamily: 'var(--font-ui)',
};

const textareaStyle = {
  width: '100%',
  background: 'var(--ink-3)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  color: 'var(--bone)',
  padding: '8px 10px',
  fontSize: 12.5,
  fontFamily: 'var(--font-ui)',
  resize: 'vertical',
};
