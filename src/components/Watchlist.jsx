import React, { useState, useEffect, useRef } from 'react';
import { Search, Flame, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { ASSETS, formatPrice } from '../utils/marketData';

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

    const points = 12;
    const strokeColor = isPositive ? '#00f094' : '#ff3b69';
    let prevY = height / 2;

    ctx.moveTo(0, prevY);
    for (let i = 1; i <= points; i++) {
      const x = (i / points) * width;
      const change = (Math.random() - (isPositive ? 0.45 : 0.55)) * 12;
      const y = Math.max(4, Math.min(height - 4, prevY + change));
      ctx.lineTo(x, y);
      prevY = y;
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [isPositive]);

  return <canvas ref={canvasRef} width={60} height={24} style={{ display: 'block' }} />;
}

export default function Watchlist({ selectedAsset, onSelectAsset, currency }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [assetPrices, setAssetPrices] = useState({});

  useEffect(() => {
    // Initial random prices & 24h change
    const initialMap = {};
    ASSETS.forEach(a => {
      const change = parseFloat(((Math.random() - 0.48) * 4).toFixed(2));
      const mult = currency === '₹' && a.currency === '$' ? 84 : currency === '$' && a.currency === '₹' ? 1/84 : 1;
      initialMap[a.id] = {
        price: a.basePrice * mult,
        change,
        isPositive: change >= 0
      };
    });
    setAssetPrices(initialMap);

    // Live tick simulator for watchlist items
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
  }, [currency]);

  const filteredAssets = ASSETS.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || (filter === 'CRYPTO' && a.category === 'Crypto') || (filter === 'STOCKS' && a.category !== 'Crypto');
    return matchesSearch && matchesFilter;
  });

  return (
    <aside className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Market Watch</h3>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ASSETS.length} Assets</span>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text"
          placeholder="Search BTC, NIFTY..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px 8px 30px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.8rem',
            outline: 'none'
          }}
        />
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
        {['ALL', 'CRYPTO', 'STOCKS'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`btn-ghost ${filter === cat ? 'active' : ''}`}
            style={{ flex: 1, padding: '4px 0', fontSize: '0.7rem', textAlign: 'center', justifyContent: 'center' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Asset List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
        {filteredAssets.map(asset => {
          const info = assetPrices[asset.id] || { price: asset.basePrice, change: 1.2, isPositive: true };
          const isSelected = selectedAsset.id === asset.id;
          const currSymbol = currency;

          return (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '0.85rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>{asset.id}</strong>
                  <span style={{ fontSize: '0.65rem', padding: '1px 4px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', color: 'var(--text-muted)' }}>
                    {asset.category}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>{asset.name}</div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <MiniSparkline isPositive={info.isPositive} />
                <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                  {formatPrice(info.price, currSymbol)}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: info.isPositive ? 'var(--bullish)' : 'var(--bearish)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {info.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {info.isPositive ? '+' : ''}{info.change}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
