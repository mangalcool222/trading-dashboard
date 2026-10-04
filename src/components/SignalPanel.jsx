import React, { useState } from 'react';
import { Zap, Target, Shield, ArrowUpRight, ArrowDownRight, Settings, CheckCircle2 } from 'lucide-react';
import { STRATEGIES } from '../utils/strategyEngine';
import { formatPrice } from '../utils/marketData';

export default function SignalPanel({ 
  activeSignal, 
  strategyId, 
  setStrategyId, 
  onExecuteTrade, 
  selectedAsset, 
  currency,
  customParams,
  setCustomParams
}) {
  const [showSettings, setShowSettings] = useState(false);

  const selectedStrategy = STRATEGIES.find(s => s.id === strategyId) || STRATEGIES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Strategy Selector Header */}
      <div className="glass-panel" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#00f094" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>AI Strategy Engine</h3>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`btn-ghost ${showSettings ? 'active' : ''}`}
            style={{ padding: '4px 8px' }}
          >
            <Settings size={14} />
          </button>
        </div>

        {/* Strategy Dropdown */}
        <select 
          value={strategyId}
          onChange={(e) => setStrategyId(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {STRATEGIES.map(s => (
            <option key={s.id} value={s.id} style={{ background: '#121622', color: '#fff' }}>
              {s.name}
            </option>
          ))}
        </select>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
          {selectedStrategy.description}
        </p>

        {/* Dynamic Parameter Settings Drawer */}
        {showSettings && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stop Loss (%):</label>
              <input 
                type="number" 
                step="0.1" 
                value={customParams.stopLossPct || selectedStrategy.defaultParams.stopLossPct}
                onChange={e => setCustomParams({ ...customParams, stopLossPct: parseFloat(e.target.value) || 1 })}
                style={{ width: '100%', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Take Profit (%):</label>
              <input 
                type="number" 
                step="0.1" 
                value={customParams.takeProfitPct || selectedStrategy.defaultParams.takeProfitPct}
                onChange={e => setCustomParams({ ...customParams, takeProfitPct: parseFloat(e.target.value) || 3 })}
                style={{ width: '100%', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Active Signal Card */}
      {activeSignal ? (
        <div className={`glass-panel ${activeSignal.type === 'BUY' ? 'glow-bullish' : 'glow-bearish'}`} style={{ padding: '16px', position: 'relative' }}>
          {/* Signal Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div className={`badge ${activeSignal.type === 'BUY' ? 'badge-bullish' : 'badge-bearish'}`}>
              {activeSignal.type === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {activeSignal.type === 'BUY' ? 'BUY / LONG SIGNAL' : 'SELL / SHORT SIGNAL'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              Confidence: <strong style={{ color: activeSignal.type === 'BUY' ? 'var(--bullish)' : 'var(--bearish)' }}>{activeSignal.confidence}%</strong>
            </div>
          </div>

          {/* Asset & Entry Price */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended Entry Price:</div>
            <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              {formatPrice(activeSignal.entryPrice, currency)}
            </div>
          </div>

          {/* Targets & Stop Loss Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '10px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Target size={12} color="var(--bullish)" /> Take Profit (TP):
              </div>
              <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--bullish)' }}>
                {formatPrice(activeSignal.takeProfit, currency)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={12} color="var(--bearish)" /> Stop Loss (SL):
              </div>
              <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--bearish)' }}>
                {formatPrice(activeSignal.stopLoss, currency)}
              </div>
            </div>
          </div>

          {/* RRR & Rationale */}
          <div style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px', marginBottom: '14px', borderLeft: `3px solid ${activeSignal.type === 'BUY' ? 'var(--bullish)' : 'var(--bearish)'}` }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>
              Risk:Reward Ratio: <strong style={{ color: '#fff' }}>1:{activeSignal.riskReward}</strong>
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '0.73rem', lineHeight: 1.3 }}>
              "{activeSignal.reason}"
            </div>
          </div>

          {/* Execute Paper Trade Action Button */}
          <button 
            onClick={() => onExecuteTrade(activeSignal)}
            className={activeSignal.type === 'BUY' ? 'btn-bullish' : 'btn-bearish'}
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            <CheckCircle2 size={18} />
            <span>Execute Paper {activeSignal.type} Order</span>
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Zap size={28} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
          <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '4px' }}>Scanning Market...</h4>
          <p style={{ fontSize: '0.72rem' }}>No active signal trigger on the current candle. The AI strategy engine is monitoring live price ticks.</p>
        </div>
      )}
    </div>
  );
}
