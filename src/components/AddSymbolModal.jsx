import React, { useState } from 'react';
import { X, Search, Plus, Check, Globe, TrendingUp } from 'lucide-react';
import { ASSETS } from '../utils/marketData';

export default function AddSymbolModal({ isOpen, onClose, watchlistIds, onToggleWatchlistSymbol }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | 'STOCKS_IN' | 'STOCKS_US' | 'CRYPTO' | 'INDICES'
  const [selectedCountry, setSelectedCountry] = useState('ALL'); // 'ALL' | 'IN' | 'US'

  if (!isOpen) return null;

  const filteredAssets = ASSETS.filter(a => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch = !searchLower || 
      a.id.toLowerCase().includes(searchLower) || 
      a.name.toLowerCase().includes(searchLower);

    let matchesCategory = true;
    if (selectedCategory === 'CRYPTO') matchesCategory = a.category === 'Crypto';
    else if (selectedCategory === 'STOCKS_IN') matchesCategory = a.category === 'Indian Stock' && a.id !== 'NIFTY50' && a.id !== 'BANKNIFTY';
    else if (selectedCategory === 'STOCKS_US') matchesCategory = a.category === 'US Tech';
    else if (selectedCategory === 'INDICES') matchesCategory = a.id === 'NIFTY50' || a.id === 'BANKNIFTY';

    let matchesCountry = true;
    if (selectedCountry === 'IN') matchesCountry = a.currency === '₹';
    else if (selectedCountry === 'US') matchesCountry = a.currency === '$' && a.category !== 'Crypto';

    return matchesSearch && matchesCategory && matchesCountry;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '20px', gap: '14px', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="#00f094" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>TradingView Symbol Search</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search Input Box */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Symbol, Stock, ISIN, or Crypto (e.g. RELIANCE, TATAMOTORS, TSLA, BTC)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              background: '#121622',
              border: '1px solid var(--accent)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>

        {/* Filter Pills & Country Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'STOCKS_IN', label: '🇮🇳 India Stocks' },
              { id: 'STOCKS_US', label: '🇺🇸 US Stocks' },
              { id: 'CRYPTO', label: '🪙 Crypto' },
              { id: 'INDICES', label: '📊 Indices' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`btn-ghost ${selectedCategory === tab.id ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="var(--text-muted)" />
            <select 
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              style={{ background: '#121622', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', padding: '3px 8px' }}
            >
              <option value="ALL">All Regions</option>
              <option value="IN">🇮🇳 India (NSE/BSE)</option>
              <option value="US">🇺🇸 USA (NASDAQ/NYSE)</option>
            </select>
          </div>
        </div>

        {/* Symbol List Grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px', maxHeight: '380px' }}>
          {filteredAssets.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No matching symbol found. Type exact ticker (e.g. TATAMOTORS) to add.
            </div>
          ) : (
            filteredAssets.map(asset => {
              const isAdded = watchlistIds.includes(asset.id);
              return (
                <div
                  key={asset.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#a5b4fc' }}>
                      {asset.id.substring(0, 3)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{asset.id}</strong>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                          {asset.currency === '₹' ? 'stock NSE' : asset.category === 'Crypto' ? 'crypto BINANCE' : 'stock NASDAQ'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{asset.name}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleWatchlistSymbol(asset.id)}
                    className={isAdded ? 'btn-ghost active' : 'btn-bullish'}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
                  >
                    {isAdded ? <Check size={14} /> : <Plus size={14} />}
                    {isAdded ? 'Added' : 'Add to Watchlist'}
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
