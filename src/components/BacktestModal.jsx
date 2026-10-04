import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Award, TrendingUp, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { runBacktest, STRATEGIES } from '../utils/strategyEngine';
import { ASSETS, generateHistoricalCandles, formatPrice } from '../utils/marketData';

function EquityCurveCanvas({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    let minVal = Infinity;
    let maxVal = -Infinity;
    data.forEach(d => {
      if (d.balance < minVal) minVal = d.balance;
      if (d.balance > maxVal) maxVal = d.balance;
    });

    const pad = (maxVal - minVal) * 0.1 || 100;
    minVal -= pad;
    maxVal += pad;

    const isProfit = data[data.length - 1].balance >= data[0].balance;
    const strokeColor = isProfit ? '#00f094' : '#ff3b69';

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.balance - minVal) / (maxVal - minVal)) * height;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill gradient
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, isProfit ? 'rgba(0, 240, 148, 0.25)' : 'rgba(255, 59, 105, 0.25)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

  }, [data]);

  return <canvas ref={canvasRef} width={500} height={120} style={{ width: '100%', height: '120px', display: 'block' }} />;
}

export default function BacktestModal({ isOpen, onClose, selectedAsset, currency }) {
  const [strategyId, setStrategyId] = useState('ema_rsi');
  const [assetId, setAssetId] = useState(selectedAsset.id);
  const [candleCount, setCandleCount] = useState(350);
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const testCandles = generateHistoricalCandles(assetId, candleCount, '15m');
      const res = runBacktest(testCandles, strategyId, 10000);
      setResults(res);
      setIsRunning(false);
    }, 400);
  };

  useEffect(() => {
    if (isOpen) handleRun();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={24} color="#818cf8" />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Quant Backtest Laboratory</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Simulate strategy performance across historical market candles</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target Asset:</label>
            <select 
              value={assetId} 
              onChange={e => setAssetId(e.target.value)}
              style={{ width: '100%', padding: '8px', background: '#121622', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            >
              {ASSETS.map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Strategy:</label>
            <select 
              value={strategyId} 
              onChange={e => setStrategyId(e.target.value)}
              style={{ width: '100%', padding: '8px', background: '#121622', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            >
              {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Candles Sample:</label>
            <select 
              value={candleCount} 
              onChange={e => setCandleCount(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', background: '#121622', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            >
              <option value={200}>200 Candles (~2 Days)</option>
              <option value={350}>350 Candles (~4 Days)</option>
              <option value={500}>500 Candles (~1 Week)</option>
            </select>
          </div>

          <button onClick={handleRun} className="btn-primary" style={{ padding: '8px 18px' }} disabled={isRunning}>
            <Play size={16} /> Run Backtest
          </button>
        </div>

        {/* Results Overview Cards */}
        {results && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Win Rate</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: results.winRate >= 50 ? 'var(--bullish)' : 'var(--bearish)' }}>
                  {results.winRate}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{results.executedTrades.filter(t => t.pnlAmount > 0).length} W / {results.executedTrades.filter(t => t.pnlAmount <= 0).length} L</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Net Return</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: results.totalPnl >= 0 ? 'var(--bullish)' : 'var(--bearish)' }}>
                  {results.totalPnl >= 0 ? '+' : ''}{results.totalPnlPct}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Final: {formatPrice(results.finalBalance, currency)}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Profit Factor</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a5b4fc' }}>
                  {results.profitFactor}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Win / Loss Ratio</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Max Drawdown</div>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--bearish)' }}>
                  -{results.maxDrawdown}%
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Peak Peak Risk</div>
              </div>
            </div>

            {/* Equity Curve Graph */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Portfolio Equity Curve</div>
              <EquityCurveCanvas data={results.equityCurve} />
            </div>

            {/* Executed Trades Table */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Recent Simulated Executions ({results.executedTrades.length})</h4>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Type</th>
                      <th style={{ padding: '6px' }}>Entry</th>
                      <th style={{ padding: '6px' }}>Exit</th>
                      <th style={{ padding: '6px' }}>Reason</th>
                      <th style={{ padding: '6px' }}>PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.executedTrades.slice(-10).map((t, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px' }}>
                          <span className={`badge ${t.type === 'BUY' ? 'badge-bullish' : 'badge-bearish'}`} style={{ fontSize: '0.6rem' }}>{t.type}</span>
                        </td>
                        <td className="font-mono" style={{ padding: '6px' }}>{formatPrice(t.entryPrice, currency)}</td>
                        <td className="font-mono" style={{ padding: '6px' }}>{formatPrice(t.exitPrice, currency)}</td>
                        <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{t.exitReason}</td>
                        <td className="font-mono" style={{ padding: '6px', fontWeight: 700, color: t.pnlAmount >= 0 ? 'var(--bullish)' : 'var(--bearish)' }}>
                          {t.pnlAmount >= 0 ? '+' : ''}${t.pnlAmount} ({t.pnlPct}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
