// Real Market Live Data Feed Engine (Crypto + Real Indian & US Stocks)

import { fetchRealStockCandles } from './stockMarketFeed';

const TIMEFRAME_MAP_BINANCE = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '1d': '1d',
};

/**
 * Fetches 100% REAL historical OHLC candlestick data for Crypto or Stocks
 */
export async function fetchRealHistoricalCandles(assetId = 'BTCUSDT', timeframeId = '15m', limit = 300) {
  // 1. Check if Stock Asset (NIFTY50, RELIANCE, NVDA, AAPL)
  if (assetId === 'NIFTY50' || assetId === 'RELIANCE' || assetId === 'NVDA' || assetId === 'AAPL') {
    const stockCandles = await fetchRealStockCandles(assetId, timeframeId);
    if (stockCandles && stockCandles.length > 0) {
      return stockCandles;
    }
  }

  // 2. For Crypto Assets (BTC, ETH, SOL), fetch directly from Binance API
  const binanceInterval = TIMEFRAME_MAP_BINANCE[timeframeId] || '15m';
  const symbol = assetId.endsWith('USDT') ? assetId : `${assetId}USDT`;
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (Array.isArray(data)) {
      return data.map(item => ({
        time: item[0],
        open: parseFloat(parseFloat(item[1]).toFixed(2)),
        high: parseFloat(parseFloat(item[2]).toFixed(2)),
        low: parseFloat(parseFloat(item[3]).toFixed(2)),
        close: parseFloat(parseFloat(item[4]).toFixed(2)),
        volume: Math.round(parseFloat(item[5])),
      }));
    }
  } catch (err) {
    console.warn(`[Real Market Feed] Binance API fetch failed for ${symbol}:`, err);
  }

  return null;
}

/**
 * Subscribes to 100% REAL-TIME WebSocket Tick Stream from Binance (Crypto)
 */
export function subscribeRealLiveTicks(assetId = 'BTCUSDT', timeframeId = '15m', onTickReceived) {
  const binanceInterval = TIMEFRAME_MAP_BINANCE[timeframeId] || '15m';
  const symbol = assetId.toLowerCase().endsWith('usdt') ? assetId.toLowerCase() : `${assetId.toLowerCase()}usdt`;

  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${binanceInterval}`;
  
  let ws = null;
  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`[Real Market Stream 🟢] Connected to live Binance WebSocket stream for ${symbol.toUpperCase()} (${binanceInterval})`);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.e === 'kline') {
          const k = message.k;
          const liveCandle = {
            time: k.t,
            open: parseFloat(parseFloat(k.o).toFixed(2)),
            high: parseFloat(parseFloat(k.h).toFixed(2)),
            low: parseFloat(parseFloat(k.l).toFixed(2)),
            close: parseFloat(parseFloat(k.c).toFixed(2)),
            volume: Math.round(parseFloat(k.v)),
            isClosed: k.x
          };
          onTickReceived(liveCandle);
        }
      } catch (err) {
        console.error('[Real Market Stream] Failed to parse tick message:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('[Real Market Stream ⚠️] WebSocket error:', err);
    };

  } catch (e) {
    console.error('[Real Market Stream] Could not create WebSocket:', e);
  }

  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
      console.log(`[Real Market Stream 🔴] Closed stream for ${symbol.toUpperCase()}`);
    }
  };
}
