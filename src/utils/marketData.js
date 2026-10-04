// Market Data Generator & Universal Stock/Crypto Master Registry

export const ASSETS = [
  // --- Indian Stock Market (NSE / BSE) ---
  { id: 'NIFTY50', name: 'NIFTY 50 Index', category: 'Indian Stock', basePrice: 25150.00, volatility: 0.004, currency: '₹', step: 5 },
  { id: 'BANKNIFTY', name: 'NIFTY Bank Index', category: 'Indian Stock', basePrice: 52400.00, volatility: 0.006, currency: '₹', step: 10 },
  { id: 'RELIANCE', name: 'Reliance Ind.', category: 'Indian Stock', basePrice: 2980.75, volatility: 0.006, currency: '₹', step: 1 },
  { id: 'TATAMOTORS', name: 'Tata Motors', category: 'Indian Stock', basePrice: 965.40, volatility: 0.012, currency: '₹', step: 0.5 },
  { id: 'TATASTEEL', name: 'Tata Steel', category: 'Indian Stock', basePrice: 158.20, volatility: 0.014, currency: '₹', step: 0.2 },
  { id: 'HDFCBANK', name: 'HDFC Bank Ltd', category: 'Indian Stock', basePrice: 1680.50, volatility: 0.007, currency: '₹', step: 0.5 },
  { id: 'INFY', name: 'Infosys Ltd', category: 'Indian Stock', basePrice: 1920.30, volatility: 0.009, currency: '₹', step: 0.5 },
  { id: 'ICICIBANK', name: 'ICICI Bank Ltd', category: 'Indian Stock', basePrice: 1240.10, volatility: 0.008, currency: '₹', step: 0.5 },
  { id: 'SBIN', name: 'State Bank of India', category: 'Indian Stock', basePrice: 790.60, volatility: 0.01, currency: '₹', step: 0.5 },
  { id: 'TCS', name: 'Tata Consultancy Services', category: 'Indian Stock', basePrice: 4250.00, volatility: 0.006, currency: '₹', step: 1 },
  { id: 'ZOMATO', name: 'Zomato Ltd', category: 'Indian Stock', basePrice: 275.80, volatility: 0.018, currency: '₹', step: 0.2 },

  // --- US Tech & Global Stocks ---
  { id: 'NVDA', name: 'NVIDIA Corp', category: 'US Tech', basePrice: 128.40, volatility: 0.012, currency: '$', step: 0.1 },
  { id: 'AAPL', name: 'Apple Inc.', category: 'US Tech', basePrice: 226.50, volatility: 0.007, currency: '$', step: 0.1 },
  { id: 'TSLA', name: 'Tesla Inc.', category: 'US Tech', basePrice: 248.60, volatility: 0.02, currency: '$', step: 0.2 },
  { id: 'MSFT', name: 'Microsoft Corp', category: 'US Tech', basePrice: 415.20, volatility: 0.008, currency: '$', step: 0.2 },
  { id: 'GOOGL', name: 'Alphabet Inc (Google)', category: 'US Tech', basePrice: 165.80, volatility: 0.01, currency: '$', step: 0.1 },
  { id: 'AMZN', name: 'Amazon.com Inc.', category: 'US Tech', basePrice: 186.40, volatility: 0.011, currency: '$', step: 0.1 },
  { id: 'META', name: 'Meta Platforms (FB)', category: 'US Tech', basePrice: 585.30, volatility: 0.014, currency: '$', step: 0.5 },
  { id: 'AMD', name: 'Advanced Micro Devices', category: 'US Tech', basePrice: 162.70, volatility: 0.016, currency: '$', step: 0.2 },

  // --- Crypto Exchanges (Binance Live) ---
  { id: 'BTCUSDT', name: 'Bitcoin', category: 'Crypto', basePrice: 68450.00, volatility: 0.008, currency: '$', step: 10 },
  { id: 'ETHUSDT', name: 'Ethereum', category: 'Crypto', basePrice: 3520.50, volatility: 0.01, currency: '$', step: 0.5 },
  { id: 'SOLUSDT', name: 'Solana', category: 'Crypto', basePrice: 154.20, volatility: 0.015, currency: '$', step: 0.1 },
  { id: 'BNBUSDT', name: 'Binance Coin', category: 'Crypto', basePrice: 580.40, volatility: 0.011, currency: '$', step: 0.2 },
  { id: 'XRPUSDT', name: 'Ripple', category: 'Crypto', basePrice: 0.54, volatility: 0.018, currency: '$', step: 0.001 },
  { id: 'DOGEUSDT', name: 'Dogecoin', category: 'Crypto', basePrice: 0.12, volatility: 0.025, currency: '$', step: 0.001 },
];

export const TIMEFRAMES = [
  { id: '1m', name: '1 Min', intervalMs: 60000, label: 'Scalping' },
  { id: '5m', name: '5 Min', intervalMs: 300000, label: 'Intraday' },
  { id: '15m', name: '15 Min', intervalMs: 900000, label: 'Swing' },
  { id: '1h', name: '1 Hour', intervalMs: 3600000, label: 'Position' },
  { id: '1d', name: '1 Day', intervalMs: 86400000, label: 'Long Term' },
];

export function generateHistoricalCandles(assetId = 'BTCUSDT', count = 350, timeframeId = '15m') {
  const asset = ASSETS.find(a => a.id === assetId) || { basePrice: 100, volatility: 0.01, id: assetId };
  const timeframe = TIMEFRAMES.find(t => t.id === timeframeId) || TIMEFRAMES[2];
  
  const candles = [];
  const now = Date.now();
  let currentPrice = asset.basePrice * (0.92 + Math.random() * 0.16);
  let trend = 0.0002;

  const startTime = now - (count * timeframe.intervalMs);

  for (let i = 0; i < count; i++) {
    const time = startTime + (i * timeframe.intervalMs);
    const cycle = Math.sin(i / 14) * 0.004 + Math.cos(i / 28) * 0.006;
    const randomNoise = (Math.random() - 0.49) * asset.volatility;
    const pctChange = trend + cycle + randomNoise;

    const open = currentPrice;
    const close = Math.max(open * 0.1, open * (1 + pctChange));
    const wickHigh = Math.max(open, close) * (1 + Math.random() * (asset.volatility * 0.8));
    const wickLow = Math.min(open, close) * (1 - Math.random() * (asset.volatility * 0.8));
    
    const high = Math.max(open, close, wickHigh);
    const low = Math.min(open, close, wickLow);
    const volume = Math.floor(Math.abs(close - open) * (1000 + Math.random() * 5000) / asset.basePrice * 100) + 100;

    candles.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
    if (i % 45 === 0) trend = (Math.random() - 0.48) * 0.001;
  }

  return candles;
}

export function generateNextTick(lastCandle, assetId, timeframeId = '15m') {
  const asset = ASSETS.find(a => a.id === assetId) || { basePrice: lastCandle.close, volatility: 0.008 };
  const timeframe = TIMEFRAMES.find(t => t.id === timeframeId) || TIMEFRAMES[2];

  const now = Date.now();
  const timeDiff = now - lastCandle.time;
  const isNewCandle = timeDiff >= timeframe.intervalMs;

  const changePct = (Math.random() - 0.495) * (asset.volatility * 0.3);
  const delta = lastCandle.close * changePct;
  const newPrice = Math.max(0.01, parseFloat((lastCandle.close + delta).toFixed(2)));

  if (isNewCandle) {
    return {
      isNewCandle: true,
      candle: {
        time: lastCandle.time + timeframe.intervalMs,
        open: lastCandle.close,
        high: Math.max(lastCandle.close, newPrice),
        low: Math.min(lastCandle.close, newPrice),
        close: newPrice,
        volume: Math.floor(Math.random() * 500) + 50,
      }
    };
  } else {
    return {
      isNewCandle: false,
      candle: {
        ...lastCandle,
        high: Math.max(lastCandle.high, newPrice),
        low: Math.min(lastCandle.low, newPrice),
        close: newPrice,
        volume: lastCandle.volume + Math.floor(Math.random() * 10),
      }
    };
  }
}

export function formatPrice(price, currency = '$', assetCurrency = '$') {
  if (price === undefined || price === null || isNaN(price)) return '-';
  
  let convertedPrice = price;
  if (currency === '₹' && assetCurrency === '$') {
    convertedPrice = price * 84;
  } else if (currency === '$' && assetCurrency === '₹') {
    convertedPrice = price / 84;
  }

  const decimals = convertedPrice < 10 ? 3 : 2;
  const numStr = convertedPrice.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${currency}${numStr}`;
}

export function formatTime(timestamp, timeframeId = '15m') {
  const d = new Date(timestamp);
  if (timeframeId === '1d') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
