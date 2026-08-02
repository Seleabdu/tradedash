# Ledger — a local trading journal for MT5

A trading dashboard that reads MetaTrader 5 "Trade History Report" HTML exports
and turns them into a full journal: equity curve, calendar heatmap, win-rate
and expectancy stats, R-multiple distribution, session/symbol breakdowns, and
per-trade notes and tags.

Everything runs on your machine. There's no server, no account, no data leaving
your browser — reports and notes are stored in localStorage.

## Running it

You need [Node.js](https://nodejs.org) 18 or newer installed. Then, from this folder:

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). That's it — the app
runs entirely client-side from there.

To build a static version you can open without running a dev server:

```bash
npm run build
npm run preview
```

`npm run build` writes finished files to `dist/`. You can also open
`dist/index.html` directly from disk in most browsers, though `npm run preview`
is more reliable since some browsers restrict local file access for ES modules.

## Importing reports

In MetaTrader 5: go to the **Toolbox → History** tab, right-click anywhere in
the trade list, choose **Report → HTML**, and save the file. Drop that file
onto the app (or click **Import report**).

You can import as many reports as you like. Trades are de-duplicated by their
MT5 position ID, so re-importing a more recent export to pick up new trades
won't double-count anything that overlaps with a previous import.

The app reads three things out of the report:

- **Positions** — your closed round-turn trades (this is what powers every
  stat and chart)
- **Deals** — the raw ledger, used to detect your actual starting balance
- **Open Positions** — whatever was still running at export time, shown on
  the Overview page

## What's in each tab

- **Overview** — net P/L, win rate, profit factor, expectancy, avg win:loss,
  max drawdown, equity curve, streaks, and a quick read on your best/worst
  symbols
- **Calendar** — daily P/L heatmap, month by month
- **Trades** — every closed trade, sortable and filterable, with pips,
  R-multiple, and duration. Click any row to open notes/tags for that trade
- **Analytics** — performance by symbol, session (Tokyo/London/NY/etc.), day
  of week, hour, and long vs. short, plus Sharpe ratio and an R-multiple
  distribution histogram
- **Journal** — every trade you've tagged or written a note on, with
  aggregate P/L per tag so you can see which habits actually cost or make you
  money
- **Reports** — manage imported files, set your starting balance, clear data

## A couple of things worth knowing

**R-multiples can be misleading.** The R-multiple column uses the stop-loss
value MT5 logged at the time the position closed — not necessarily the stop
you originally set. If you moved your stop (trailing, breakeven, manual
adjustment), the R shown reflects the *final* stop distance, not your original
risk. Treat it as a rough signal, not a precise figure, especially for trades
where R looks unusually large or small.

**Pips aren't shown for non-forex instruments.** Indices, and anything else
that isn't a standard 6-letter currency pair or gold/silver, show `—` in the
pips column since pip math doesn't apply to them. Dollar P/L is still accurate
for these.

**Kelly % and Sharpe are simplified.** Kelly % uses your actual win rate and
average win:loss ratio — it's a reasonable position-sizing reference point,
not investment advice. Sharpe is computed per-trade (not annualized), so use
it to compare your own periods against each other rather than against
published annualized Sharpe ratios elsewhere.

## Data and privacy

Nothing is uploaded anywhere. Reports, derived stats, and journal notes all
live in your browser's localStorage under this app's origin. Clearing your
browser data (or using a different browser/profile) will clear the journal
too — there's no cloud backup. If you want a backup, your safest bet is to
keep the original exported HTML report files somewhere, since you can
re-import them at any time.

## Project structure

```
src/
  lib/
    parser.js       — reads the MT5 HTML export format
    analytics.js     — all derived stats (win rate, drawdown, R-multiples, etc.)
    storage.js        — localStorage persistence and merge logic
    format.js         — currency/date/duration formatting helpers
  components/         — shared UI pieces (sidebar, charts, trade drawer)
  pages/              — the six tabs
  App.jsx             — top-level state and layout
```
