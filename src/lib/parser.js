// Parser for MetaTrader 5 "Trade History Report" HTML exports.
// Handles the UTF-16LE encoding MT5 uses and pulls out every section:
// Positions (closed round-turns), Orders, Deals (raw ledger), Open Positions, Results.

function stripTags(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function parseNumber(text) {
  if (text == null) return null;
  const cleaned = String(text).replace(/\s/g, '').replace(/,/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function parseDate(text) {
  // Format: 2025.11.28 22:19:26
  const t = text.trim();
  if (!t) return null;
  const m = t.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString();
}

function decodeReportBytes(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  // UTF-16 LE BOM is FF FE; MT5 exports are UTF-16LE
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(arrayBuffer);
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(arrayBuffer);
  }
  // Fall back to utf-8 in case a CSV-saved-as-html sneaks in
  return new TextDecoder('utf-8').decode(arrayBuffer);
}

function extractRows(sectionHtml, { dropHidden = true } = {}) {
  const rowMatches = sectionHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  return rowMatches.map((row) => {
    const cellTagMatches = row.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
    return cellTagMatches
      .filter((c) => !dropHidden || !/class="hidden"/.test(c))
      .map((c) => stripTags(c));
  });
}

function sectionBetween(html, startLabel, endLabel) {
  const startIdx = html.indexOf(`<b>${startLabel}</b>`);
  if (startIdx === -1) return null;
  const afterStart = html.slice(startIdx);
  if (!endLabel) return afterStart;
  const endIdx = afterStart.indexOf(`<b>${endLabel}</b>`);
  return endIdx === -1 ? afterStart : afterStart.slice(0, endIdx);
}

function parseAccountMeta(html) {
  const getField = (label) => {
    const re = new RegExp(`${label}:</th>\\s*<th[^>]*><b>([\\s\\S]*?)</b>`);
    const m = html.match(re);
    return m ? stripTags(m[1]) : null;
  };
  return {
    name: getField('Name'),
    account: getField('Account'),
    company: getField('Company'),
    reportDate: getField('Date'),
  };
}

// --- Positions table: closed round-turn trades, one row per trade ---
function parsePositions(html) {
  const section = sectionBetween(html, 'Positions', 'Orders');
  if (!section) return [];
  const rows = extractRows(section);
  const trades = [];
  for (const cells of rows) {
    // header / spacer rows have <th> not <td>, or wrong cell count (13 after hidden-cell drop)
    if (cells.length < 13) continue;
    const [openTime, position, symbol, type, volume, openPrice, sl, tp, closeTime, closePrice, commission, swap, profit] = cells;
    if (!openTime || !position || isNaN(Number(position))) continue;
    if (!/^\d{4}\./.test(openTime)) continue;
    trades.push({
      id: position,
      openTime: parseDate(openTime),
      closeTime: parseDate(closeTime),
      symbol,
      side: type.toLowerCase(),
      volume: parseNumber(volume),
      openPrice: parseNumber(openPrice),
      closePrice: parseNumber(closePrice),
      stopLoss: parseNumber(sl),
      takeProfit: parseNumber(tp),
      commission: parseNumber(commission) || 0,
      swap: parseNumber(swap) || 0,
      profit: parseNumber(profit) || 0,
    });
  }
  return trades;
}

// --- Deals table: full ledger including balance ops, partial fills ---
function parseDeals(html) {
  const section = sectionBetween(html, 'Deals', 'Open Positions');
  if (!section) return [];
  const rows = extractRows(section);
  const deals = [];
  for (const cells of rows) {
    if (cells.length < 14) continue;
    const [time, deal, symbol, type, direction, volume, price, order, commission, fee, swap, profit, balance, comment] = cells;
    if (!time || !deal || isNaN(Number(deal))) continue;
    if (!/^\d{4}\./.test(time)) continue;
    deals.push({
      id: deal,
      time: parseDate(time),
      symbol: symbol || null,
      type: (type || '').toLowerCase(),
      direction: (direction || '').toLowerCase(),
      volume: parseNumber(volume),
      price: parseNumber(price),
      orderId: order || null,
      commission: parseNumber(commission) || 0,
      fee: parseNumber(fee) || 0,
      swap: parseNumber(swap) || 0,
      profit: parseNumber(profit) || 0,
      balance: parseNumber(balance),
      comment: comment || '',
    });
  }
  return deals;
}

// --- Open Positions: still-running trades at report time ---
function parseOpenPositions(html) {
  const section = sectionBetween(html, 'Open Positions', null);
  if (!section) return [];
  // Cut off right before the account-summary block (Balance: row) to avoid the totals row
  const cut = section.indexOf('Balance:</td>');
  const trimmed = cut === -1 ? section : section.slice(0, cut);
  const rows = extractRows(trimmed);
  const positions = [];
  for (const cells of rows) {
    if (cells.length < 11) continue;
    const [time, position, symbol, type, volume, price, sl, tp, marketPrice, swap, profit] = cells;
    if (!time || !position || isNaN(Number(position))) continue;
    if (!/^\d{4}\./.test(time)) continue;
    positions.push({
      id: position,
      openTime: parseDate(time),
      symbol,
      side: type.toLowerCase(),
      volume: parseNumber(volume),
      openPrice: parseNumber(price),
      stopLoss: parseNumber(sl),
      takeProfit: parseNumber(tp),
      marketPrice: parseNumber(marketPrice),
      swap: parseNumber(swap) || 0,
      profit: parseNumber(profit) || 0,
    });
  }
  return positions;
}

// --- Results summary block at the bottom ---
function parseResults(html) {
  const idx = html.lastIndexOf('<b>Results</b>');
  if (idx === -1) return {};
  const tail = html.slice(idx);
  const get = (label) => {
    const re = new RegExp(`${label}:</td>\\s*<td[^>]*><b>([\\s\\S]*?)</b>`);
    const m = tail.match(re);
    return m ? stripTags(m[1]) : null;
  };
  return {
    totalNetProfit: parseNumber(get('Total Net Profit')),
    grossProfit: parseNumber(get('Gross Profit')),
    grossLoss: parseNumber(get('Gross Loss')),
    profitFactor: parseNumber(get('Profit Factor')),
    expectedPayoff: parseNumber(get('Expected Payoff')),
    recoveryFactor: parseNumber(get('Recovery Factor')),
    sharpeRatio: parseNumber(get('Sharpe Ratio')),
    balanceDrawdownAbsolute: parseNumber(get('Balance Drawdown Absolute')),
    balanceDrawdownMaximalRaw: get('Balance Drawdown Maximal'),
    balanceDrawdownRelativeRaw: get('Balance Drawdown Relative'),
    totalTrades: parseNumber(get('Total Trades')),
    shortTradesRaw: get('Short Trades \\(won %\\)'),
    longTradesRaw: get('Long Trades \\(won %\\)'),
    profitTradesRaw: get('Profit Trades \\(% of total\\)'),
    lossTradesRaw: get('Loss Trades \\(% of total\\)'),
    largestProfitTrade: parseNumber(get('Largest profit trade')),
    largestLossTrade: parseNumber(get('Largest loss trade')),
    averageProfitTrade: parseNumber(get('Average profit trade')),
    averageLossTrade: parseNumber(get('Average loss trade')),
    maxConsecutiveWinsRaw: get('Maximum consecutive wins \\(\\$\\)'),
    maxConsecutiveLossesRaw: get('Maximum consecutive losses \\(\\$\\)'),
  };
}

function parseAccountSummary(html) {
  const idx = html.indexOf('Balance:</td>');
  if (idx === -1) return {};
  const tail = html.slice(Math.max(0, idx - 1), idx + 2500);
  const get = (label) => {
    const re = new RegExp(`>${label}:</td>\\s*<td[^>]*><b>([\\s\\S]*?)</b>`);
    const m = tail.match(re);
    return m ? parseNumber(stripTags(m[1])) : null;
  };
  return {
    balance: get('Balance'),
    freeMargin: get('Free Margin'),
    creditFacility: get('Credit Facility'),
    margin: get('Margin'),
    floatingPL: get('Floating P/L'),
    marginLevelRaw: (() => {
      const m = tail.match(/Margin Level:<\/td>\s*<td[^>]*><b>([\s\S]*?)<\/b>/);
      return m ? stripTags(m[1]) : null;
    })(),
    equity: get('Equity'),
  };
}

export function parseReportHtml(html) {
  const meta = parseAccountMeta(html);
  const trades = parsePositions(html);
  const deals = parseDeals(html);
  const openPositions = parseOpenPositions(html);
  const results = parseResults(html);
  const accountSummary = parseAccountSummary(html);
  return { meta, trades, deals, openPositions, results, accountSummary };
}

export async function parseReportFile(file) {
  const buffer = await file.arrayBuffer();
  const html = decodeReportBytes(buffer);
  if (!html.includes('Trade History Report') && !html.includes('Positions')) {
    throw new Error('This file doesn\u2019t look like an MT5 Trade History Report export.');
  }
  return parseReportHtml(html);
}
