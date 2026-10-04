// Real Live Stock Market Feed Adapter (Indian Equities + US Tech Stocks)

/**
 * Yahoo Finance Universal Symbol Map for Real Stock Data
 */
const STOCK_SYMBOL_MAP = {
  // Indian Indexes & Equities (NSE)
  'NIFTY50': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'RELIANCE': 'RELIANCE.NS',
  'TATAMOTORS': 'TATAMOTORS.NS',
  'TATASTEEL': 'TATASTEEL.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'INFY': 'INFY.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'SBIN': 'SBIN.NS',
  'TCS': 'TCS.NS',
  'ZOMATO': 'ZOMATO.NS',

  // US Tech Stocks (NASDAQ / NYSE)
  'NVDA': 'NVDA',
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
  'AMZN': 'AMZN',
  'META': 'META',
  'AMD': 'AMD',
};

const TIMEFRAME_MAP_STOCK = {
  '1m': { range: '1d', interval: '1m' },
  '5m': { range: '5d', interval: '5m' },
  '15m': { range: '5d', interval: '15m' },
  '1h': { range: '1mo', interval: '60m' },
  '1d': { range: '3mo', interval: '1d' },
};

/**
 * Fetches 100% REAL Stock Market candles from Yahoo Finance Live Data API
 */
export async function fetchRealStockCandles(assetId = 'RELIANCE', timeframeId = '15m') {
  // Dynamically resolve symbol (if not in map, try adding .NS for Indian or raw symbol for US)
  let symbol = STOCK_SYMBOL_MAP[assetId];
  if (!symbol) {
    symbol = assetId.includes('.') ? assetId : `${assetId}.NS`;
  }

  const config = TIMEFRAME_MAP_STOCK[timeframeId] || TIMEFRAME_MAP_STOCK['15m'];

  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${config.range}&interval=${config.interval}`;
  const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

  try {
    const res = await fetch(corsProxyUrl);
    const json = await res.json();

    const result = json?.chart?.result?.[0];
    if (result && result.timestamp && result.indicators?.quote?.[0]) {
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];

      const candles = [];
      for (let i = 0; i < timestamps.length; i++) {
        const time = timestamps[i] * 1000;
        const open = quote.open[i];
        const high = quote.high[i];
        const low = quote.low[i];
        const close = quote.close[i];
        const volume = quote.volume[i] || 1000;

        if (open !== null && close !== null && high !== null && low !== null) {
          candles.push({
            time,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume: Math.round(volume),
          });
        }
      }

      if (candles.length > 0) {
        console.log(`[Real Stock Feed 📈] Fetched ${candles.length} real stock candles for ${assetId} (${symbol})`);
        return candles;
      }
    }
  } catch (err) {
    console.warn(`[Real Stock Feed ⚠️] Stock API fetch failed for ${assetId}:`, err);
  }

  return null;
}
