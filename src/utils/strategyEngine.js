// Strategy & Backtesting Engine for ApexTrader Pro
import { calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateSupertrend } from './indicators';

export const STRATEGIES = [
  {
    id: 'ema_rsi',
    name: 'EMA Crossover + RSI Filter',
    description: 'Generates Long signals when EMA 9 crosses above EMA 21 with RSI > 45, Short when EMA 9 crosses below EMA 21.',
    recommendedTimeframe: '15m',
    defaultParams: { fastEma: 9, slowEma: 21, rsiPeriod: 14, rsiMinBuy: 45, stopLossPct: 1.5, takeProfitPct: 3.5 }
  },
  {
    id: 'supertrend_macd',
    name: 'Supertrend Trend Breakout',
    description: 'Rides strong market trends. Enters when Supertrend flips color and MACD Histogram confirms momentum.',
    recommendedTimeframe: '1h',
    defaultParams: { atrPeriod: 10, atrMultiplier: 3.0, stopLossPct: 2.0, takeProfitPct: 5.0 }
  },
  {
    id: 'bollinger_reversion',
    name: 'Bollinger Band Mean Reversion',
    description: 'Catches oversold/overbought price bounces off Bollinger outer bands confirmed with RSI extremity.',
    recommendedTimeframe: '5m',
    defaultParams: { bbPeriod: 20, bbStdDev: 2.0, rsiOversold: 32, rsiOverbought: 68, stopLossPct: 1.2, takeProfitPct: 2.8 }
  }
];

/**
 * Analyzes market data array and generates active signals + clean filtered candle annotations
 */
export function analyzeSignals(candles, strategyId = 'ema_rsi', customParams = {}) {
  if (!candles || candles.length < 30) return { activeSignal: null, signalHistory: [] };

  const strategy = STRATEGIES.find(s => s.id === strategyId) || STRATEGIES[0];
  const params = { ...strategy.defaultParams, ...customParams };

  const emaFast = calculateEMA(candles, params.fastEma || 9);
  const emaSlow = calculateEMA(candles, params.slowEma || 21);
  const rsi = calculateRSI(candles, params.rsiPeriod || 14);
  const macd = calculateMACD(candles);
  const bb = calculateBollingerBands(candles, params.bbPeriod || 20, params.bbStdDev || 2);
  const supertrendObj = calculateSupertrend(candles, params.atrPeriod || 10, params.atrMultiplier || 3);

  const signalHistory = [];
  let lastSignalType = null;
  let lastSignalIndex = -20; // prevent rapid duplicate triggers within 8 candles

  for (let i = 25; i < candles.length; i++) {
    const candle = candles[i];
    let type = null;
    let reason = '';
    let confidence = 0;

    if (strategyId === 'ema_rsi') {
      const fastPrev = emaFast[i - 1];
      const fastCurr = emaFast[i];
      const slowPrev = emaSlow[i - 1];
      const slowCurr = emaSlow[i];
      const currRsi = rsi[i];

      // Bullish Cross (Fresh Crossover)
      if (fastPrev <= slowPrev && fastCurr > slowCurr && currRsi >= (params.rsiMinBuy || 45) && currRsi <= 70) {
        type = 'BUY';
        reason = `EMA ${params.fastEma} crossed above EMA ${params.slowEma} with healthy RSI (${currRsi.toFixed(1)})`;
        confidence = Math.min(96, Math.floor(78 + (currRsi - 40) * 0.4 + Math.random() * 6));
      }
      // Bearish Cross (Fresh Crossover)
      else if (fastPrev >= slowPrev && fastCurr < slowCurr && currRsi <= 55 && currRsi >= 30) {
        type = 'SELL';
        reason = `EMA ${params.fastEma} crossed below EMA ${params.slowEma} with declining RSI (${currRsi.toFixed(1)})`;
        confidence = Math.min(94, Math.floor(75 + (60 - currRsi) * 0.4 + Math.random() * 6));
      }
    } else if (strategyId === 'supertrend_macd') {
      const prevTrend = supertrendObj.trend[i - 1];
      const currTrend = supertrendObj.trend[i];
      const hist = macd.histogram[i];

      if (prevTrend === -1 && currTrend === 1 && hist > 0) {
        type = 'BUY';
        reason = `Supertrend flipped Bullish & MACD Histogram positive (+${hist.toFixed(2)})`;
        confidence = Math.min(98, Math.floor(84 + Math.random() * 8));
      } else if (prevTrend === 1 && currTrend === -1 && hist < 0) {
        type = 'SELL';
        reason = `Supertrend flipped Bearish & MACD Histogram negative (${hist.toFixed(2)})`;
        confidence = Math.min(95, Math.floor(82 + Math.random() * 8));
      }
    } else if (strategyId === 'bollinger_reversion') {
      const currRsi = rsi[i];
      const lowerBand = bb.lower[i];
      const upperBand = bb.upper[i];

      const prevCandle = candles[i - 1];
      const prevLower = bb.lower[i - 1];
      const prevUpper = bb.upper[i - 1];

      // Only trigger on initial touch/breakout, not 20 candles in a row!
      if (candle.low <= lowerBand && prevCandle.low > prevLower && currRsi < (params.rsiOversold || 35)) {
        type = 'BUY';
        reason = `Price touched Lower Bollinger Band with oversold RSI (${currRsi.toFixed(1)})`;
        confidence = Math.min(92, Math.floor(80 + (35 - currRsi) * 0.6));
      } else if (candle.high >= upperBand && prevCandle.high < prevUpper && currRsi > (params.rsiOverbought || 65)) {
        type = 'SELL';
        reason = `Price touched Upper Bollinger Band with overbought RSI (${currRsi.toFixed(1)})`;
        confidence = Math.min(91, Math.floor(78 + (currRsi - 65) * 0.6));
      }
    }

    // Filter out rapid duplicate signals within 6 candles unless signal direction flipped
    if (type && (type !== lastSignalType || (i - lastSignalIndex) >= 6)) {
      const entryPrice = candle.close;
      const slPct = (params.stopLossPct || 1.5) / 100;
      const tpPct = (params.takeProfitPct || 3.5) / 100;

      const stopLoss = type === 'BUY' ? entryPrice * (1 - slPct) : entryPrice * (1 + slPct);
      const takeProfit = type === 'BUY' ? entryPrice * (1 + tpPct) : entryPrice * (1 - tpPct);
      const riskReward = (Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss)).toFixed(2);

      signalHistory.push({
        id: `sig_${i}_${candle.time}`,
        candleIndex: i,
        time: candle.time,
        type,
        entryPrice: parseFloat(entryPrice.toFixed(2)),
        stopLoss: parseFloat(stopLoss.toFixed(2)),
        takeProfit: parseFloat(takeProfit.toFixed(2)),
        riskReward,
        reason,
        confidence,
        strategyName: strategy.name
      });

      lastSignalType = type;
      lastSignalIndex = i;
    }
  }

  const activeSignal = signalHistory.length > 0 ? signalHistory[signalHistory.length - 1] : null;

  return { activeSignal, signalHistory };
}

/**
 * Runs backtest simulation
 */
export function runBacktest(candles, strategyId = 'ema_rsi', initialBalance = 10000, customParams = {}) {
  const { signalHistory } = analyzeSignals(candles, strategyId, customParams);
  
  let balance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdown = 0;
  
  const executedTrades = [];
  const equityCurve = [{ time: candles[0].time, balance: initialBalance }];

  let openTrade = null;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];

    if (openTrade) {
      let closed = false;
      let exitPrice = 0;
      let exitReason = '';

      if (openTrade.type === 'BUY') {
        if (candle.low <= openTrade.stopLoss) {
          closed = true;
          exitPrice = openTrade.stopLoss;
          exitReason = 'Stop Loss Hit 🛑';
        } else if (candle.high >= openTrade.takeProfit) {
          closed = true;
          exitPrice = openTrade.takeProfit;
          exitReason = 'Take Profit Hit 🎯';
        }
      } else if (openTrade.type === 'SELL') {
        if (candle.high >= openTrade.stopLoss) {
          closed = true;
          exitPrice = openTrade.stopLoss;
          exitReason = 'Stop Loss Hit 🛑';
        } else if (candle.low <= openTrade.takeProfit) {
          closed = true;
          exitPrice = openTrade.takeProfit;
          exitReason = 'Take Profit Hit 🎯';
        }
      }

      if (closed) {
        const pnlPct = openTrade.type === 'BUY'
          ? (exitPrice - openTrade.entryPrice) / openTrade.entryPrice
          : (openTrade.entryPrice - exitPrice) / openTrade.entryPrice;

        const pnlAmount = openTrade.positionSize * pnlPct;
        balance += pnlAmount;

        executedTrades.push({
          ...openTrade,
          exitTime: candle.time,
          exitPrice,
          exitReason,
          pnlAmount: parseFloat(pnlAmount.toFixed(2)),
          pnlPct: parseFloat((pnlPct * 100).toFixed(2)),
          finalBalance: parseFloat(balance.toFixed(2))
        });

        openTrade = null;
      }
    }

    const signalOnCandle = signalHistory.find(s => s.candleIndex === i);
    if (signalOnCandle && !openTrade) {
      const positionSize = balance * 0.5;

      openTrade = {
        id: `bt_${signalOnCandle.id}`,
        entryTime: candle.time,
        type: signalOnCandle.type,
        entryPrice: signalOnCandle.entryPrice,
        stopLoss: signalOnCandle.stopLoss,
        takeProfit: signalOnCandle.takeProfit,
        positionSize,
        reason: signalOnCandle.reason,
      };
    }

    if (balance > peakBalance) peakBalance = balance;
    const currentDd = ((peakBalance - balance) / peakBalance) * 100;
    if (currentDd > maxDrawdown) maxDrawdown = currentDd;

    if (i % 5 === 0 || i === candles.length - 1) {
      equityCurve.push({ time: candle.time, balance: parseFloat(balance.toFixed(2)) });
    }
  }

  const winningTrades = executedTrades.filter(t => t.pnlAmount > 0);
  const losingTrades = executedTrades.filter(t => t.pnlAmount <= 0);

  const totalTrades = executedTrades.length;
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  const totalPnl = balance - initialBalance;
  const totalPnlPct = (totalPnl / initialBalance) * 100;

  const totalWinsSum = winningTrades.reduce((acc, t) => acc + t.pnlAmount, 0);
  const totalLossesSum = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnlAmount, 0));
  const profitFactor = totalLossesSum > 0 ? (totalWinsSum / totalLossesSum) : totalWinsSum > 0 ? 99 : 0;

  return {
    initialBalance,
    finalBalance: parseFloat(balance.toFixed(2)),
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    totalPnlPct: parseFloat(totalPnlPct.toFixed(2)),
    totalTrades,
    winRate: parseFloat(winRate.toFixed(1)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    executedTrades,
    equityCurve
  };
}
