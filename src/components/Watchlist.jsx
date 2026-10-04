import React, { useState, useEffect, useRef } from 'react';
import { Search, Flame, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { ASSETS, formatPrice } from '../utils/marketData';
import AddSymbolModal from './AddSymbolModal';

function MiniSparkline({ isPositive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();

    const points = 10;
    const strokeColor = isPositive ? '#00f094' : '#ff3b69';
    let prevY = height / 2;

    ctx.moveTo(0, prevY);
    for (let i = 1; i <= points; i++) {
      const x = (i / points) * width;
      const change = (Math.random() - (isPositive ? 0.45 : 0.55)) * 10;
      const y = Math.max(3, Math.min(height - 3, prevY + change));
      ctx.lineTo(x, y);
      prevY = y;
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }, [isPositive]);

  return <canvas ref={canvasRef} width={50} height={20} style={{ display: 'block' }} />;
}

export default function Watchlist({ selectedAsset, onSelectAsset, currency }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // User's active watchlist symbol IDs (default 7 core assets)
  const [watchlistIds, setWatchlistIds] = useState([
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'NIFTY50', 'RELIANCE', 'NVDA', 'AAPL'
  ]);

  const [assetPrices, setAssetPrices] = useState({});

  // Live simulation tick updates for active watchlist items
  useEffect(() => {
    const initialMap = {};
    ASSETS.forEach(a => {
      const change = parseFloat(((Math.random() - 0.48) * 4).toFixed(2));
      initialMap[a.id] = {
        price: a.basePrice,
        change,
        isPositive: change >= 0
      };
    });
    setAssetPrices(initialMap);

    const interval = setInterval(() => {
      setAssetPrices(prev => {
        const next = { ...prev };
        ASSETS.forEach(a => {
          if (next[a.id]) {
            const deltaPct = (Math.random() - 0.495) * 0.003;
            const newPrice = next[a.id].price * (1 + deltaPct);
            next[a.id] = {
              ...next[a.id],
              price: newPrice,
            };
          }
        });
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleToggleSymbol = (symbolId) => {
    if (watchlistIds.includes(symbolId)) {
      setWatchlistIds(watchlistIds.filter(id => id !== symbolId));
    } else {
      setWatchlistIds([...watchlistIds, symbolId]);
    }
  };

  const activeWatchlistAssets = ASSETS.filter(a => watchlistIds.includes(a.id));

  const filteredAssets = activeWatchlistAssets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || (filter === 'CRYPTO' && a.category === 'Crypto') || (filter === 'STOCKS' && a.category !== 'Crypto');
    return matchesSearch && matchesFilter;
  });

  return (
    <aside className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', maxHeight: 'calc(100vh - 90px)', overflow: 'hidden' }}>
      
      {/* Header & Add Symbol Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={16} color="#f59e0b" />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Watchlist</h3>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-ghost active"
          title="Add Symbol (TradingView Search)"
          style={{ padding: '4px 8px', fontSize: '0.72rem', gap: '4px' }}
        >
          <Plus size={14} /> Add Symbol
        </button>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text"
          placeholder="Filter watchlist..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px 6px 28px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.75rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '3px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
        {['ALL', 'CRYPTO', 'STOCKS'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`btn-ghost ${filter === cat ? 'active' : ''}`}
            style={{ flex: 1, padding: '3px 0', fontSize: '0.68rem', textAlign: 'center', justifyContent: 'center' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Compact Scrollable List (Fixed Height, No Page Overflow!) */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
        {filteredAssets.map(asset => {
          const info = assetPrices[asset.id] || { price: asset.basePrice, change: 1.2, isPositive: true };
          const isSelected = selectedAsset.id === asset.id;

          return (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <strong style={{ fontSize: '0.8rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>{asset.id}</strong>
                    <span style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', color: 'var(--text-dim)' }}>
                      {asset.currency === '₹' ? 'NSE' : asset.category === 'Crypto' ? 'BINANCE' : 'NASDAQ'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {asset.name}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MiniSparkline isPositive={info.isPositive} />
                <div>
                  <div className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>
                    {formatPrice(info.price, currency, asset.currency)}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: info.isPositive ? 'var(--bullish)' : 'var(--bearish)' }}>
                    {info.isPositive ? '+' : ''}{info.change}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TradingView Add Symbol Modal */}
      <AddSymbolModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        watchlistIds={watchlistIds}
        onToggleWatchlistSymbol={handleToggleSymbol}
      />

    </aside>
  );
}
