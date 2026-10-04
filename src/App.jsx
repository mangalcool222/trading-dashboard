import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Watchlist from './components/Watchlist';
import CandleChart from './components/CandleChart';
import SignalPanel from './components/SignalPanel';
import PortfolioPanel from './components/PortfolioPanel';
import BacktestModal from './components/BacktestModal';
import RiskCalculatorModal from './components/RiskCalculatorModal';
import AIAssistantModal from './components/AIAssistantModal';

import { ASSETS, generateHistoricalCandles, generateNextTick } from './utils/marketData';
import { analyzeSignals } from './utils/strategyEngine';
import confetti from 'canvas-confetti';

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [timeframe, setTimeframe] = useState('15m');
  const [currency, setCurrency] = useState('$');
  const [balance, setBalance] = useState(100000);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Strategy & Signal state
  const [strategyId, setStrategyId] = useState('ema_rsi');
  const [customParams, setCustomParams] = useState({});

  // Market Candles state
  const [candles, setCandles] = useState([]);
  const [activeSignal, setActiveSignal] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);

  // Paper Trading Portfolio
  const [positions, setPositions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);

  // Modals state
  const [isBacktestOpen, setIsBacktestOpen] = useState(false);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Initialize candles when asset or timeframe changes
  useEffect(() => {
    const initialCandles = generateHistoricalCandles(selectedAsset.id, 320, timeframe);
    setCandles(initialCandles);
  }, [selectedAsset.id, timeframe]);

  // Recalculate AI signals whenever candles or strategy settings change
  useEffect(() => {
    if (candles.length > 0) {
      const { activeSignal: sig, signalHistory: history } = analyzeSignals(candles, strategyId, customParams);
      setActiveSignal(sig);
      setSignalHistory(history);
    }
  }, [candles, strategyId, customParams]);

  // Real-time Ticks & Order Monitoring Loop
  useEffect(() => {
    if (!isLiveStreaming || candles.length === 0) return;

    const timer = setInterval(() => {
      setCandles(prevCandles => {
        if (prevCandles.length === 0) return prevCandles;
        const last = prevCandles[prevCandles.length - 1];
        const tick = generateNextTick(last, selectedAsset.id, timeframe);

        let nextCandles;
        if (tick.isNewCandle) {
          nextCandles = [...prevCandles.slice(1), tick.candle];
        } else {
          nextCandles = [...prevCandles.slice(0, prevCandles.length - 1), tick.candle];
        }

        // Auto-check Stop Loss / Take Profit for open positions on this asset
        const currentPrice = tick.candle.close;
        setPositions(prevPos => {
          const remainingPos = [];
          prevPos.forEach(pos => {
            if (pos.assetId === selectedAsset.id) {
              let hit = false;
              let exitReason = '';
              let exitPrice = currentPrice;

              if (pos.type === 'BUY') {
                if (currentPrice <= pos.stopLoss) {
                  hit = true;
                  exitReason = 'Stop Loss Hit 🛑';
                  exitPrice = pos.stopLoss;
                } else if (currentPrice >= pos.takeProfit) {
                  hit = true;
                  exitReason = 'Take Profit Hit 🎯';
                  exitPrice = pos.takeProfit;
                }
              } else if (pos.type === 'SELL') {
                if (currentPrice >= pos.stopLoss) {
                  hit = true;
                  exitReason = 'Stop Loss Hit 🛑';
                  exitPrice = pos.stopLoss;
                } else if (currentPrice <= pos.takeProfit) {
                  hit = true;
                  exitReason = 'Take Profit Hit 🎯';
                  exitPrice = pos.takeProfit;
                }
              }

              if (hit) {
                const pnlPct = pos.type === 'BUY'
                  ? ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100
                  : ((pos.entryPrice - exitPrice) / pos.entryPrice) * 100;
                const pnlAmount = (pos.allocatedMargin || 1000) * (pnlPct / 100);

                if (pnlAmount > 0) {
                  confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                }

                setBalance(b => b + pnlAmount);
                setTradeHistory(th => [{
                  id: `th_${Date.now()}_${Math.random()}`,
                  assetId: pos.assetId,
                  type: pos.type,
                  entryPrice: pos.entryPrice,
                  exitPrice,
                  exitReason,
                  pnlAmount: parseFloat(pnlAmount.toFixed(2)),
                  pnlPct: parseFloat(pnlPct.toFixed(2)),
                  time: Date.now()
                }, ...th]);

              } else {
                remainingPos.push(pos);
              }
            } else {
              remainingPos.push(pos);
            }
          });
          return remainingPos;
        });

        return nextCandles;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isLiveStreaming, selectedAsset.id, timeframe, candles.length]);

  // Execute Signal Paper Trade
  const handleExecuteTrade = (signal) => {
    const allocatedMargin = 2000;
    const newPos = {
      id: `pos_${Date.now()}`,
      assetId: selectedAsset.id,
      type: signal.type,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      allocatedMargin,
      time: Date.now()
    };
    setPositions([newPos, ...positions]);
  };

  // Instant Quick Market Trade from Chart Header
  const handleQuickTrade = (type, price, marginAmount) => {
    const slPct = 0.015;
    const tpPct = 0.035;
    const stopLoss = type === 'BUY' ? price * (1 - slPct) : price * (1 + slPct);
    const takeProfit = type === 'BUY' ? price * (1 + tpPct) : price * (1 - tpPct);

    const newPos = {
      id: `pos_quick_${Date.now()}`,
      assetId: selectedAsset.id,
      type,
      entryPrice: price,
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      takeProfit: parseFloat(takeProfit.toFixed(2)),
      allocatedMargin: marginAmount,
      time: Date.now()
    };
    setPositions([newPos, ...positions]);
  };

  // Execute Trade from Risk Calculator Modal
  const handleExecuteTradeWithRisk = (tradeData) => {
    const newPos = {
      id: `pos_risk_${Date.now()}`,
      assetId: tradeData.assetId,
      type: tradeData.type,
      entryPrice: tradeData.entryPrice,
      stopLoss: tradeData.stopLoss,
      takeProfit: tradeData.takeProfit,
      allocatedMargin: tradeData.allocatedMargin,
      quantity: tradeData.quantity,
      time: Date.now()
    };
    setPositions([newPos, ...positions]);
  };

  // Close Position Manually
  const handleClosePosition = (posId, currentPrice) => {
    const pos = positions.find(p => p.id === posId);
    if (!pos) return null;

    const exitPrice = currentPrice || pos.entryPrice;
    const pnlPct = pos.type === 'BUY'
      ? ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100
      : ((pos.entryPrice - exitPrice) / pos.entryPrice) * 100;
    const pnlAmount = (pos.allocatedMargin || 1000) * (pnlPct / 100);

    setBalance(b => b + pnlAmount);
    setPositions(positions.filter(p => p.id !== posId));

    const historyItem = {
      id: `th_${Date.now()}`,
      assetId: pos.assetId,
      type: pos.type,
      entryPrice: pos.entryPrice,
      exitPrice,
      exitReason: 'Manual Close ⚡',
      pnlAmount: parseFloat(pnlAmount.toFixed(2)),
      pnlPct: parseFloat(pnlPct.toFixed(2)),
      time: Date.now()
    };

    setTradeHistory([historyItem, ...tradeHistory]);
    return historyItem;
  };

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : selectedAsset.basePrice;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar 
        selectedAsset={selectedAsset}
        currency={currency}
        setCurrency={setCurrency}
        balance={balance}
        resetBalance={() => setBalance(100000)}
        onOpenBacktest={() => setIsBacktestOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
        isLiveStreaming={isLiveStreaming}
        toggleLiveStreaming={() => setIsLiveStreaming(!isLiveStreaming)}
      />

      {/* Main Trading Terminal Layout */}
      <main className="dashboard-grid">
        {/* Left Sidebar: Market Watchlist */}
        <Watchlist 
          selectedAsset={selectedAsset}
          onSelectAsset={setSelectedAsset}
          currency={currency}
        />

        {/* Center: Main Candlestick Chart & Portfolio Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
          <div style={{ flex: 1, minHeight: '480px' }}>
            <CandleChart 
              candles={candles}
              selectedAsset={selectedAsset}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              signals={signalHistory}
              currency={currency}
              onQuickTrade={handleQuickTrade}
            />
          </div>

          {/* Bottom Portfolio Drawer */}
          <PortfolioPanel 
            positions={positions}
            onClosePosition={handleClosePosition}
            tradeHistory={tradeHistory}
            currentAssetPrice={currentPrice}
            currency={currency}
          />
        </div>

        {/* Right Sidebar: AI Signal Radar */}
        <SignalPanel 
          activeSignal={activeSignal}
          strategyId={strategyId}
          setStrategyId={setStrategyId}
          onExecuteTrade={handleExecuteTrade}
          selectedAsset={selectedAsset}
          currency={currency}
          customParams={customParams}
          setCustomParams={setCustomParams}
        />
      </main>

      {/* Interactive Tool Modals */}
      <BacktestModal 
        isOpen={isBacktestOpen}
        onClose={() => setIsBacktestOpen(false)}
        selectedAsset={selectedAsset}
        currency={currency}
      />

      <RiskCalculatorModal 
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        balance={balance}
        currentPrice={currentPrice}
        selectedAsset={selectedAsset}
        currency={currency}
        onExecuteTradeWithRisk={handleExecuteTradeWithRisk}
      />

      <AIAssistantModal 
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        selectedAsset={selectedAsset}
        activeSignal={activeSignal}
        currency={currency}
      />
    </div>
  );
}
