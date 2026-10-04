import React, { useState } from 'react';
import { Briefcase, History, XCircle, TrendingUp, TrendingDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatPrice } from '../utils/marketData';
import confetti from 'canvas-confetti';

export default function PortfolioPanel({ 
  positions, 
  onClosePosition, 
  tradeHistory, 
  currentAssetPrice, 
  currency 
}) {
  const [activeTab, setActiveTab] = useState('POSITIONS'); // 'POSITIONS' | 'HISTORY'

  const handleClose = (posId) => {
    const result = onClosePosition(posId, currentAssetPrice);
    if (result && result.pnlAmount > 0) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 }
      });
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Tab Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('POSITIONS')}
            className={`btn-ghost ${activeTab === 'POSITIONS' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <Briefcase size={14} />
            Positions ({positions.length})
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`btn-ghost ${activeTab === 'HISTORY' ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <History size={14} />
            History ({tradeHistory.length})
          </button>
        </div>

        {activeTab === 'POSITIONS' && positions.length > 0 && (
          <button 
            onClick={() => positions.forEach(p => handleClose(p.id))}
            className="btn-ghost"
            style={{ padding: '4px 10px', fontSize: '0.7rem', color: 'var(--bearish)', borderColor: 'rgba(255, 59, 105, 0.3)' }}
          >
            Close All Positions
          </button>
        )}
      </div>

      {/* POSITIONS TAB */}
      {activeTab === 'POSITIONS' && (
        <div style={{ overflowX: 'auto' }}>
          {positions.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No active open paper trading positions. Use the AI Signal Panel to execute trades.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>Asset</th>
                  <th style={{ padding: '8px' }}>Type</th>
                  <th style={{ padding: '8px' }}>Entry</th>
                  <th style={{ padding: '8px' }}>Current</th>
                  <th style={{ padding: '8px' }}>SL / TP</th>
                  <th style={{ padding: '8px' }}>Unrealized PnL</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => {
                  const currPrice = currentAssetPrice || pos.entryPrice;
                  const pnlPct = pos.type === 'BUY' 
                    ? ((currPrice - pos.entryPrice) / pos.entryPrice) * 100
                    : ((pos.entryPrice - currPrice) / pos.entryPrice) * 100;
                  const pnlAmount = (pos.allocatedMargin || 1000) * (pnlPct / 100);
                  const isProfit = pnlPct >= 0;

                  return (
                    <tr key={pos.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 700, color: '#fff' }}>{pos.assetId}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className={`badge ${pos.type === 'BUY' ? 'badge-bullish' : 'badge-bearish'}`} style={{ fontSize: '0.65rem' }}>
                          {pos.type}
                        </span>
                      </td>
                      <td className="font-mono" style={{ padding: '10px 8px' }}>{formatPrice(pos.entryPrice, currency)}</td>
                      <td className="font-mono" style={{ padding: '10px 8px', color: '#fff' }}>{formatPrice(currPrice, currency)}</td>
                      <td className="font-mono" style={{ padding: '10px 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        SL: <span style={{ color: 'var(--bearish)' }}>{formatPrice(pos.stopLoss, currency)}</span> | 
                        TP: <span style={{ color: 'var(--bullish)' }}>{formatPrice(pos.takeProfit, currency)}</span>
                      </td>
                      <td className="font-mono" style={{ padding: '10px 8px', fontWeight: 700, color: isProfit ? 'var(--bullish)' : 'var(--bearish)' }}>
                        {isProfit ? '+' : ''}{formatPrice(pnlAmount, currency)} ({isProfit ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleClose(pos.id)}
                          className="btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          <XCircle size={12} /> Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TRADE HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div style={{ overflowX: 'auto', maxHeight: '200px' }}>
          {tradeHistory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No completed trades logged yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>Asset</th>
                  <th style={{ padding: '8px' }}>Type</th>
                  <th style={{ padding: '8px' }}>Entry</th>
                  <th style={{ padding: '8px' }}>Exit</th>
                  <th style={{ padding: '8px' }}>Reason</th>
                  <th style={{ padding: '8px' }}>Realized PnL</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map(trade => {
                  const isProfit = trade.pnlAmount >= 0;
                  return (
                    <tr key={trade.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#fff' }}>{trade.assetId}</td>
                      <td style={{ padding: '8px' }}>
                        <span className={`badge ${trade.type === 'BUY' ? 'badge-bullish' : 'badge-bearish'}`} style={{ fontSize: '0.65rem' }}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="font-mono" style={{ padding: '8px' }}>{formatPrice(trade.entryPrice, currency)}</td>
                      <td className="font-mono" style={{ padding: '8px' }}>{formatPrice(trade.exitPrice, currency)}</td>
                      <td style={{ padding: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{trade.exitReason}</td>
                      <td className="font-mono" style={{ padding: '8px', fontWeight: 700, color: isProfit ? 'var(--bullish)' : 'var(--bearish)' }}>
                        {isProfit ? '+' : ''}{formatPrice(trade.pnlAmount, currency)} ({trade.pnlPct > 0 ? '+' : ''}{trade.pnlPct}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
