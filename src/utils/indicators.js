// Technical Analysis Indicators Engine for ApexTrader Pro

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(data, period) {
  const sma = new Array(data.length).fill(null);
  let sum = 0;
  
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= period) {
      sum -= data[i - period].close;
    }
    if (i >= period - 1) {
      sma[i] = sum / period;
    }
  }
  return sma;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data, period) {
  const ema = new Array(data.length).fill(null);
  if (data.length < period) return ema;

  const k = 2 / (period + 1);
  let sum = 0;

  // First EMA value is SMA
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEma = sum / period;
  ema[period - 1] = prevEma;

  for (let i = period; i < data.length; i++) {
    const currentEma = (data[i].close * k) + (prevEma * (1 - k));
    ema[i] = currentEma;
    prevEma = currentEma;
  }

  return ema;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(data, period = 14) {
  const rsi = new Array(data.length).fill(null);
  if (data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - (100 / (1 + rs));

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEma = calculateEMA(data, fastPeriod);
  const slowEma = calculateEMA(data, slowPeriod);

  const macdLine = new Array(data.length).fill(null);
  const macdObjects = [];

  for (let i = 0; i < data.length; i++) {
    if (fastEma[i] !== null && slowEma[i] !== null) {
      macdLine[i] = fastEma[i] - slowEma[i];
      macdObjects.push({ close: macdLine[i] });
    } else {
      macdObjects.push({ close: 0 });
    }
  }

  // Signal line is EMA of MACD Line
  const signalLineRaw = calculateEMA(macdObjects, signalPeriod);
  const signalLine = new Array(data.length).fill(null);
  const histogram = new Array(data.length).fill(null);

  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] !== null && signalLineRaw[i] !== null && i >= slowPeriod + signalPeriod - 2) {
      signalLine[i] = signalLineRaw[i];
      histogram[i] = macdLine[i] - signalLine[i];
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(data, period = 20, multiplier = 2) {
  const sma = calculateSMA(data, period);
  const upper = new Array(data.length).fill(null);
  const lower = new Array(data.length).fill(null);
  const middle = sma;

  for (let i = period - 1; i < data.length; i++) {
    let varianceSum = 0;
    const mean = sma[i];
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(data[j].close - mean, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper[i] = mean + (multiplier * stdDev);
    lower[i] = mean - (multiplier * stdDev);
  }

  return { upper, middle, lower };
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(data, period = 14) {
  const atr = new Array(data.length).fill(null);
  if (data.length < period) return atr;

  const tr = new Array(data.length).fill(0);
  tr[0] = data[0].high - data[0].low;

  for (let i = 1; i < data.length; i++) {
    const hl = data[i].high - data[i].low;
    const hpc = Math.abs(data[i].high - data[i - 1].close);
    const lpc = Math.abs(data[i].low - data[i - 1].close);
    tr[i] = Math.max(hl, hpc, lpc);
  }

  let sumTR = 0;
  for (let i = 0; i < period; i++) sumTR += tr[i];
  atr[period - 1] = sumTR / period;

  for (let i = period; i < data.length; i++) {
    atr[i] = ((atr[i - 1] * (period - 1)) + tr[i]) / period;
  }

  return atr;
}

/**
 * Calculates Supertrend Indicator
 */
export function calculateSupertrend(data, period = 10, multiplier = 3) {
  const atr = calculateATR(data, period);
  const supertrend = new Array(data.length).fill(null);
  const trend = new Array(data.length).fill(1); // 1 = bullish, -1 = bearish

  let upperBand = 0;
  let lowerBand = 0;
  let prevUpper = 0;
  let prevLower = 0;

  for (let i = 0; i < data.length; i++) {
    if (atr[i] === null) continue;

    const hl2 = (data[i].high + data[i].low) / 2;
    let basicUpper = hl2 + (multiplier * atr[i]);
    let basicLower = hl2 - (multiplier * atr[i]);

    if (i === 0 || supertrend[i - 1] === null) {
      upperBand = basicUpper;
      lowerBand = basicLower;
    } else {
      upperBand = (basicUpper < prevUpper || data[i - 1].close > prevUpper) ? basicUpper : prevUpper;
      lowerBand = (basicLower > prevLower || data[i - 1].close < prevLower) ? basicLower : prevLower;
    }

    let currentTrend = i > 0 ? trend[i - 1] : 1;
    if (currentTrend === 1 && data[i].close < lowerBand) {
      currentTrend = -1;
    } else if (currentTrend === -1 && data[i].close > upperBand) {
      currentTrend = 1;
    }

    trend[i] = currentTrend;
    supertrend[i] = currentTrend === 1 ? lowerBand : upperBand;

    prevUpper = upperBand;
    prevLower = lowerBand;
  }

  return { supertrend, trend };
}
