// Real Live Stock Market Feed Adapter (Indian Equities + US Tech Stocks)

/**
 * Yahoo Finance Symbol Map for Live Stock Data
 */
const STOCK_SYMBOL_MAP = {
  'NIFTY50': '^NSEI',      // NIFTY 50 Index
  'RELIANCE': 'RELIANCE.NS', // Reliance Industries (NSE)
  'NVDA': 'NVDA',          // NVIDIA Corp (NASDAQ)
  'AAPL': 'AAPL',          // Apple Inc. (NASDAQ)
};

/**
 * Maps dashboard timeframe ID to Yahoo Finance interval parameters
 */
const TIMEFRAME_MAP_STOCK = {
  '1m': { range: '1d', interval: '1m' },
  '5m': { range: '5d', interval: '5m' },
  '15m': { range: '5d', interval: '15m' },
  '1h': { range: '1mo', interval: '60m' },
  '1d': { range: '3mo', interval: '1d' },
};

/**
 * Fetches 100% REAL Stock Market candles for NIFTY 50, Reliance, NVDA, AAPL from Live Data API
 */
export async function fetchRealStockCandles(assetId = 'RELIANCE', timeframeId = '15m') {
  const symbol = STOCK_SYMBOL_MAP[assetId] || assetId;
  const config = TIMEFRAME_MAP_STOCK[timeframeId] || TIMEFRAME_MAP_STOCK['15m'];

  // Using public Yahoo Finance / AllOrigins CORS Proxy endpoint for real stock data
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
    console.warn(`[Real Stock Feed ⚠️] Stock API fetch failed for ${assetId}, using fallback:`, err);
  }

  return null;
}
