import React, { useState } from 'react';
import { X, Bot, Sparkles, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { formatPrice } from '../utils/marketData';

export default function AIAssistantModal({ isOpen, onClose, selectedAsset, activeSignal, currency }) {
  const [activeQuestion, setActiveQuestion] = useState(null);

  if (!isOpen) return null;

  const faqs = [
    {
      q: "Bhai, Stop Loss (SL) aur Take Profit (TP) kaise set kare?",
      a: "Bhai hamesha entry lete hi SL & TP mark karo. Stop loss entry price se 1.5% ya 2% niche hona chahiye (support zone ke niche), aur Target kam se kam 3.5% se 5% hona chahiye taaki tumhara Risk-to-Reward ratio minimum 1:2 rahe."
    },
    {
      q: "EMA 9 aur EMA 21 Crossover strategy kaise kaam karti hai?",
      a: "Jab fast moving average (EMA 9) slow moving average (EMA 21) ko niche se upar cross karti hai, toh yeh Golden Crossover hota hai (BUY Signal). Aur jab EMA 9 upar se niche cross karti hai toh Bearish Cross hota hai (SELL Signal)."
    },
    {
      q: "Intraday trading ke liye kaunsa Timeframe best hai?",
      a: "Intraday ke liye 5 Min aur 15 Min timeframe sabse popular hain. 15m trend direction batata hai aur 5m precise entry & exit spots deta hai."
    },
    {
      q: "Supertrend indicator ko kaise read kare?",
      a: "Supertrend indicator jab green line banaye price ke niche, toh market Bullish trend me hota hai. Jab red line upar banaye, toh Bearish trend me hota hai. High volatility assets (jaise Crypto & Tech stocks) me Supertrend bohot solid kaam karta hai."
    }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #00f094)', padding: '6px', borderRadius: '8px' }}>
              <Bot size={22} color="#07090e" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Apex AI Trading Advisor</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Smart Insights & Strategy Education</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Real-time Market Analysis Summary Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(0, 240, 148, 0.08))', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '16px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f094', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
            <Sparkles size={14} /> Live AI Market Scan: {selectedAsset.id}
          </div>
          <p style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.5 }}>
            {activeSignal ? (
              <>
                Bhai, <strong>{selectedAsset.name}</strong> me abhi ek <strong>{activeSignal.type}</strong> signal ban raha hai! Entry price <strong>{formatPrice(activeSignal.entryPrice, currency)}</strong> par hai. Rationale: <em>"{activeSignal.reason}"</em>.
              </>
            ) : (
              <>
                Bhai, <strong>{selectedAsset.name}</strong> me abhi price consolidate kar rahi hai. Key EMA lines test ho rahi hain. Agle breakout tak patience rakho aur Risk Manager tool use karke ready raho!
              </>
            )}
          </p>
        </div>

        {/* Interactive Trading Knowledge Q&A */}
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={14} /> Trading Strategy Guide & FAQs:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveQuestion(activeQuestion === idx ? null : idx)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                  <span>{faq.q}</span>
                  <ArrowRight size={14} style={{ transform: activeQuestion === idx ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {activeQuestion === idx && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Close AI Advisor
        </button>

      </div>
    </div>
  );
}
