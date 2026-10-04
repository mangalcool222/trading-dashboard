import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Calculator, DollarSign, CheckCircle2, Sliders, ArrowRight, Wallet, Shield, Sparkles } from 'lucide-react';
import { formatPrice } from '../utils/marketData';

export default function RiskCalculatorModal({ 
  isOpen, 
  onClose, 
  balance, 
  currentPrice, 
  selectedAsset, 
  currency,
  onExecuteTradeWithRisk
}) {
  const currSymbol = currency;
  const isINR = currSymbol === '₹';
  const assetIsINR = selectedAsset.currency === '₹';

  // 1. Dual Main Inputs: Investment Amount & Max Loss Amount
  const [investAmount, setInvestAmount] = useState(isINR ? 25000 : 1000); // Total Capital to Deploy
  const [maxLossAmount, setMaxLossAmount] = useState(isINR ? 1000 : 50);   // Max Loss Capacity

  const [entryPrice, setEntryPrice] = useState(currentPrice || 100);
  const [targetRatio, setTargetRatio] = useState(2.0); // 1:2 Risk-Reward ratio

  // Sync entry price when modal opens or live price ticks
  useEffect(() => {
    if (currentPrice) {
      setEntryPrice(currentPrice);
    }
  }, [currentPrice, isOpen]);

  if (!isOpen) return null;

  const entry = parseFloat(entryPrice) || currentPrice || 1;
  const capital = parseFloat(investAmount) || 1;
  const maxLoss = parseFloat(maxLossAmount) || 1;

  // Conversion factor if asset currency differs from display currency
  const assetMult = (isINR && !assetIsINR) ? 1/84 : (!isINR && assetIsINR) ? 84 : 1;

  // DYNAMIC CALCULATIONS:
  // 1. Quantity based on capital deployed
  const userCapitalInAssetCurrency = capital * assetMult;
  const recommendedQty = entry > 0 ? (userCapitalInAssetCurrency / entry) : 0;

  // 2. Price loss per share allowed to stay strictly within Max Loss Budget
  const maxLossInAssetCurrency = maxLoss * assetMult;
  const priceLossPerShare = recommendedQty > 0 ? (maxLossInAssetCurrency / recommendedQty) : 0;

  // 3. Implied Stop Loss Percentage & Stop Loss Price
  const stopLossPrice = Math.max(0.01, entry - priceLossPerShare);
  const impliedSlPct = entry > 0 ? ((priceLossPerShare / entry) * 100) : 0;

  // 4. Implied Take Profit Price & Estimated Profit
  const priceProfitPerShare = priceLossPerShare * targetRatio;
  const targetPrice = entry + priceProfitPerShare;
  const estimatedProfit = maxLoss * targetRatio;

  const rrr = targetRatio.toFixed(1);

  const handleExecute = () => {
    if (recommendedQty <= 0) return;
    onExecuteTradeWithRisk({
      type: 'BUY',
      assetId: selectedAsset.id,
      entryPrice: parseFloat(entry.toFixed(2)),
      stopLoss: parseFloat(stopLossPrice.toFixed(2)),
      takeProfit: parseFloat(targetPrice.toFixed(2)),
      quantity: parseFloat(recommendedQty.toFixed(4)),
      allocatedMargin: parseFloat(capital.toFixed(2)),
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #00f094)', padding: '8px', borderRadius: '8px' }}>
              <Calculator size={22} color="#07090e" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Unified Dual-Risk & Capital Calculator</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Input Investment Capital AND Max Loss together — dynamic SL/TP auto-computes!</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* DUAL MAIN INPUT CARDS (Simultaneous side-by-side inputs) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          
          {/* Card 1: Investment Amount (Kitna Paisa Lagana Hai) */}
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '14px', borderRadius: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Wallet size={14} /> 1. Kitna Capital Invest Karna Hai ({currSymbol}):
            </label>
            <input 
              type="number" 
              value={investAmount}
              onChange={e => setInvestAmount(e.target.value)}
              placeholder="e.g. 25000"
              style={{ width: '100%', padding: '10px 12px', background: '#121622', border: '1px solid var(--accent)', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {(isINR ? [5000, 10000, 25000, 50000] : [200, 500, 1000, 2500]).map(val => (
                <button
                  key={val}
                  onClick={() => setInvestAmount(val)}
                  className={`btn-ghost ${capital === val ? 'active' : ''}`}
                  style={{ flex: 1, padding: '4px 0', fontSize: '0.68rem', justifyContent: 'center' }}
                >
                  {currSymbol}{val >= 1000 ? `${val/1000}k` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Max Loss Amount (Kitna Loss Seh Sakte Hain) */}
          <div style={{ background: 'rgba(255, 59, 105, 0.08)', border: '1px solid rgba(255, 59, 105, 0.3)', padding: '14px', borderRadius: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--bearish)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Shield size={14} /> 2. Kitna Max Loss Seh Sakte Hain ({currSymbol}):
            </label>
            <input 
              type="number" 
              value={maxLossAmount}
              onChange={e => setMaxLossAmount(e.target.value)}
              placeholder="e.g. 1000"
              style={{ width: '100%', padding: '10px 12px', background: '#121622', border: '1px solid var(--bearish)', borderRadius: '8px', color: 'var(--bearish)', fontWeight: 800, fontSize: '1.1rem' }}
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {(isINR ? [500, 1000, 2000, 5000] : [25, 50, 100, 250]).map(val => (
                <button
                  key={val}
                  onClick={() => setMaxLossAmount(val)}
                  className={`btn-ghost ${maxLoss === val ? 'active' : ''}`}
                  style={{ flex: 1, padding: '4px 0', fontSize: '0.68rem', justifyContent: 'center' }}
                >
                  {currSymbol}{val}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Live Entry Price & Risk:Reward Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Live Entry Price ({selectedAsset.id}):</label>
            <input 
              type="number" 
              value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: '#121622', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target Profit Ratio (Risk : Reward):</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1.5, 2.0, 2.5, 3.0].map(val => (
                <button
                  key={val}
                  onClick={() => setTargetRatio(val)}
                  className={`btn-ghost ${targetRatio === val ? 'active' : ''}`}
                  style={{ flex: 1, padding: '6px 0', fontSize: '0.7rem', justifyContent: 'center' }}
                >
                  1:{val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DYNAMIC AUTO-CALCULATED METRICS DISPLAY */}
        <div style={{ background: 'linear-gradient(135deg, rgba(0, 240, 148, 0.1), rgba(99, 102, 241, 0.1))', border: '1px solid rgba(0, 240, 148, 0.3)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Exact Quantity / Shares to Buy:</span>
            <strong className="font-mono" style={{ fontSize: '1.35rem', color: '#00f094', fontWeight: 800 }}>
              {recommendedQty.toFixed(selectedAsset.category === 'Crypto' ? 4 : 0)} {selectedAsset.category === 'Crypto' ? 'Units' : 'Shares'}
            </strong>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Auto Stop Loss Price: </span>
              <strong className="font-mono" style={{ color: 'var(--bearish)' }}>{formatPrice(stopLossPrice, currSymbol, selectedAsset.currency)}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Auto Take Profit Price: </span>
              <strong className="font-mono" style={{ color: 'var(--bullish)' }}>{formatPrice(targetPrice, currSymbol, selectedAsset.currency)}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Implied SL Gap (%): </span>
              <strong className="font-mono" style={{ color: '#f59e0b' }}>{impliedSlPct.toFixed(2)}% Distance</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Risk : Reward Ratio: </span>
              <strong className="font-mono" style={{ color: '#a5b4fc' }}>1:{rrr}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Strict Guaranteed Max Loss: </span>
              <strong className="font-mono" style={{ color: 'var(--bearish)' }}>-{formatPrice(maxLoss, currSymbol)}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Profit if TP Hits: </span>
              <strong className="font-mono" style={{ color: 'var(--bullish)' }}>+{formatPrice(estimatedProfit, currSymbol)}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
          <button onClick={handleExecute} className="btn-bullish" style={{ flex: 2, justifyContent: 'center', padding: '12px' }}>
            <CheckCircle2 size={18} /> Execute Trade ({formatPrice(capital, currSymbol)})
          </button>
        </div>

      </div>
    </div>
  );
}
