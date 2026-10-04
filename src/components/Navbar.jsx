import React, { useState, useEffect } from 'react';
import { TrendingUp, Bot, BarChart3, RefreshCw, DollarSign, ShieldAlert, Zap, Radio, Workflow, Send, Check } from 'lucide-react';
import { formatPrice } from '../utils/marketData';

export default function Navbar({ 
  selectedAsset, 
  currency, 
  setCurrency, 
  balance, 
  resetBalance, 
  onOpenBacktest, 
  onOpenAI, 
  onOpenRiskCalc,
  isLiveStreaming,
  toggleLiveStreaming,
  n8nWebhookUrl,
  setN8nWebhookUrl
}) {
  const [showN8nConfig, setShowN8nConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(n8nWebhookUrl || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const convertedBalance = currency === '₹' ? balance * 84 : balance;

  const handleSaveN8n = () => {
    setN8nWebhookUrl(tempUrl);
    localStorage.setItem('n8n_webhook_url', tempUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, position: 'relative' }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #00f094)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp size={22} color="#07090e" strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(to right, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            ApexTrader <span style={{ color: '#00f094', WebkitTextFillColor: '#00f094', fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(0, 240, 148, 0.15)', borderRadius: '4px', border: '1px solid rgba(0, 240, 148, 0.3)' }}>PRO AI</span>
          </h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Algorithmic Trading & Signal Simulator</p>
        </div>
      </div>

      {/* Ticker & Live Feed Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.03)', padding: '6px 16px', borderRadius: '30px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={toggleLiveStreaming}
            className={`badge ${isLiveStreaming ? 'badge-bullish' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 'none' }}
          >
            <Radio size={12} className={isLiveStreaming ? 'live-pulse' : ''} />
            {isLiveStreaming ? 'LIVE TICKS' : 'PAUSED'}
          </button>
        </div>
        <div style={{ height: '16px', width: '1px', background: 'var(--border-color)' }} />
        <div style={{ fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Asset:</span>
          <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{selectedAsset.name} ({selectedAsset.id})</strong>
        </div>
      </div>

      {/* Balance & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Currency Switcher */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setCurrency('$')}
            className={`btn-ghost ${currency === '$' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            $ USD
          </button>
          <button 
            onClick={() => setCurrency('₹')}
            className={`btn-ghost ${currency === '₹' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            ₹ INR
          </button>
        </div>

        {/* Paper Balance Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 240, 148, 0.08)', border: '1px solid rgba(0, 240, 148, 0.2)', padding: '6px 14px', borderRadius: '10px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paper Balance</div>
            <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--bullish)' }}>
              {formatPrice(convertedBalance, currency)}
            </div>
          </div>
          <button 
            onClick={resetBalance} 
            title="Reset Capital" 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* n8n Automation Config Button */}
        <button 
          onClick={() => setShowN8nConfig(!showN8nConfig)} 
          className={`btn-ghost ${n8nWebhookUrl ? 'active' : ''}`} 
          title="n8n Telegram & Trello Webhook Automation"
          style={{ borderColor: n8nWebhookUrl ? '#ff9f43' : 'var(--border-color)' }}
        >
          <Workflow size={16} color={n8nWebhookUrl ? '#ff9f43' : 'var(--text-muted)'} />
          <span style={{ fontSize: '0.8rem', color: n8nWebhookUrl ? '#ff9f43' : 'inherit' }}>n8n Auto</span>
        </button>

        {/* Action Tool Buttons */}
        <button onClick={onOpenRiskCalc} className="btn-ghost" title="Position Calculator">
          <ShieldAlert size={16} color="#f59e0b" />
          <span style={{ fontSize: '0.8rem' }}>Risk Calc</span>
        </button>

        <button onClick={onOpenBacktest} className="btn-ghost" style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}>
          <BarChart3 size={16} color="#818cf8" />
          <span style={{ fontSize: '0.8rem' }}>Backtest</span>
        </button>

        <button onClick={onOpenAI} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
          <Bot size={16} />
          <span>Apex AI</span>
        </button>
      </div>

      {/* n8n Webhook Configuration Dropdown Drawer */}
      {showN8nConfig && (
        <div className="glass-panel" style={{ position: 'absolute', top: '65px', right: '180px', width: '380px', padding: '16px', zIndex: 1000, boxShadow: '0 15px 35px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <Workflow size={18} color="#ff9f43" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>n8n Telegram & Trello Integration</h4>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Paste your <strong>n8n Webhook URL</strong> below (e.g. <code>http://72.61.149.87:5678/webhook/trading-alert</code>). Real-time AI signals and trade executions will trigger automated Telegram messages and Trello journal cards!
          </p>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              n8n Webhook URL:
            </label>
            <input 
              type="text"
              placeholder="http://72.61.149.87:5678/webhook/..."
              value={tempUrl}
              onChange={e => setTempUrl(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: '#121622', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.78rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleSaveN8n} 
              className="btn-bullish"
              style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem' }}
            >
              {savedSuccess ? <Check size={14} /> : <Send size={14} />}
              {savedSuccess ? 'Saved!' : 'Save Webhook URL'}
            </button>
            <button 
              onClick={() => setShowN8nConfig(false)}
              className="btn-ghost"
              style={{ padding: '8px', fontSize: '0.78rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
