// Real-Time Binance WebSocket Stream Integration Helper

/**
 * Connects directly to Binance Public WebSocket API for 100% real live market ticks.
 * Requires NO API key for public market data streaming.
 */
export function connectBinanceLiveTicks(symbol = 'btcusdt', timeframe = '1m', onTickReceived) {
  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${timeframe}`;
  
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log(`[Binance WS] Connected to live tick stream for ${symbol.toUpperCase()}`);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.e === 'kline') {
      const k = message.k;
      const liveCandle = {
        time: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
        isClosed: k.x // boolean indicating if 1-minute candle finalized
      };
      onTickReceived(liveCandle);
    }
  };

  ws.onerror = (err) => {
    console.error('[Binance WS] Error:', err);
  };

  ws.onclose = () => {
    console.log('[Binance WS] Stream closed');
  };

  return () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}
