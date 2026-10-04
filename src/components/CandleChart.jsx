import React, { useRef, useEffect, useState } from 'react';
import { TIMEFRAMES, formatPrice, formatTime } from '../utils/marketData';
import { calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateSupertrend } from '../utils/indicators';
import { 
  ZoomIn, ZoomOut, TrendingUp, TrendingDown, 
  Slash, Minus, Trash2, Move, MoveVertical, RefreshCw
} from 'lucide-react';

export default function CandleChart({ 
  candles, 
  selectedAsset, 
  timeframe, 
  setTimeframe, 
  signals, 
  currency,
  onQuickTrade
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Overlay & Sub-panel toggles
  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [activeSubPanel, setActiveSubPanel] = useState('RSI');

  // Drawing Mode
  const [activeTool, setActiveTool] = useState('NONE');
  const [drawings, setDrawings] = useState([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState(null);

  // Dragging & Panning state
  const [dragging, setDragging] = useState(null); 
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartOffset, setPanStartOffset] = useState(0);

  // Pan offset for historical scrolling (0 = latest candles)
  const [scrollOffset, setScrollOffset] = useState(0);
  const [drawingPreview, setDrawingPreview] = useState(null);

  // Quick Order Margin
  const [tradeAmount, setTradeAmount] = useState(1000);

  // Visible Candle Zoom Count (20 to 250)
  const [visibleCount, setVisibleCount] = useState(65);
  const [hoverData, setHoverData] = useState(null);
  const [cursorStyle, setCursorStyle] = useState('default');

  // Reset view when asset changes
  useEffect(() => {
    setScrollOffset(0);
    setDrawings([]);
    setSelectedDrawingId(null);
  }, [selectedAsset.id, timeframe]);

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const hasSubPanel = activeSubPanel !== 'NONE';
    const mainHeight = hasSubPanel ? height * 0.68 : height - 30;
    const subHeight = hasSubPanel ? height * 0.22 : 0;
    const subTop = mainHeight + (height * 0.02);

    ctx.clearRect(0, 0, width, height);

    // Calculate slice with pan offset
    const maxOffset = Math.max(0, candles.length - visibleCount);
    const clampedOffset = Math.min(maxOffset, Math.max(0, scrollOffset));

    const endIndex = candles.length - clampedOffset;
    const startIndex = Math.max(0, endIndex - visibleCount);

    const visibleCandles = candles.slice(startIndex, endIndex);
    const count = visibleCandles.length;

    if (count === 0) return;

    // --- CRITICAL FIX: Price bounds calculated STRICTLY from visible candles ---
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    visibleCandles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    // 8% padding top and bottom to avoid candles clipping edge
    const pricePadding = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;

    const candleWidth = (width - 80) / count;
    const barWidth = Math.max(1, candleWidth * 0.72);

    // Indicators calculations
    const ema9All = calculateEMA(candles, 9);
    const ema21All = calculateEMA(candles, 21);
    const bbAll = calculateBollingerBands(candles, 20, 2);
    const stObjAll = calculateSupertrend(candles, 10, 3);

    const ema9 = ema9All.slice(startIndex, endIndex);
    const ema21 = ema21All.slice(startIndex, endIndex);
    const bbUpper = bbAll.upper.slice(startIndex, endIndex);
    const bbLower = bbAll.lower.slice(startIndex, endIndex);
    const stLine = stObjAll.supertrend.slice(startIndex, endIndex);
    const stTrend = stObjAll.trend.slice(startIndex, endIndex);

    // Coordinate conversion helper
    const priceToY = (p) => mainHeight - ((p - minPrice) / (maxPrice - minPrice)) * (mainHeight - 30) - 15;
    const idxToX = (idxInVisible) => idxInVisible * candleWidth + (candleWidth / 2);

    // --- 1. Y-Axis Price Grid & Clean Axis Labels ---
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = '#64748b';

    const gridSteps = 6;
    for (let i = 0; i <= gridSteps; i++) {
      const p = minPrice + (i / gridSteps) * (maxPrice - minPrice);
      const y = priceToY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 80, y);
      ctx.stroke();

      ctx.fillText(formatPrice(p, currency, selectedAsset.currency), width - 74, y + 3);
    }

    // --- 2. X-Axis Time Grid & Date Labels ---
    const timeStep = Math.max(1, Math.floor(count / 6));
    for (let i = 0; i < count; i += timeStep) {
      const x = idxToX(i);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 25);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.stroke();

      const timeLabel = formatTime(visibleCandles[i].time, timeframe);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(timeLabel, x - 15, height - 8);
    }

    ctx.beginPath();
    ctx.moveTo(0, height - 25);
    ctx.lineTo(width - 80, height - 25);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    // --- 3. Volume Histogram ---
    let maxVol = 0;
    visibleCandles.forEach(c => { if (c.volume > maxVol) maxVol = c.volume; });

    visibleCandles.forEach((c, idx) => {
      const x = idxToX(idx);
      const volH = (c.volume / (maxVol || 1)) * (mainHeight * 0.18);
      const volY = mainHeight - volH;
      const isBull = c.close >= c.open;

      ctx.fillStyle = isBull ? 'rgba(0, 240, 148, 0.12)' : 'rgba(255, 59, 105, 0.12)';
      ctx.fillRect(x - (barWidth / 2), volY, barWidth, volH);
    });

    // --- 4. Technical Indicators ---
    if (showSupertrend) {
      for (let i = 1; i < count; i++) {
        if (stLine[i] !== null && stLine[i - 1] !== null) {
          ctx.beginPath();
          ctx.moveTo(idxToX(i - 1), priceToY(stLine[i - 1]));
          ctx.lineTo(idxToX(i), priceToY(stLine[i]));
          ctx.strokeStyle = stTrend[i] === 1 ? '#00f094' : '#ff3b69';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    if (showBB) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        if (bbUpper[i] !== null) {
          const x = idxToX(i);
          const y = priceToY(bbUpper[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        if (bbLower[i] !== null) {
          const x = idxToX(i);
          const y = priceToY(bbLower[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    if (showEMA) {
      ctx.beginPath();
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count; i++) {
        if (ema9[i] !== null) {
          const x = idxToX(i);
          const y = priceToY(ema9[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#ff9f43';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < count; i++) {
        if (ema21[i] !== null) {
          const x = idxToX(i);
          const y = priceToY(ema21[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // --- 5. Candlesticks ---
    visibleCandles.forEach((c, idx) => {
      const x = idxToX(idx);
      const openY = priceToY(c.open);
      const closeY = priceToY(c.close);
      const highY = priceToY(c.high);
      const lowY = priceToY(c.low);

      const isBull = c.close >= c.open;
      const candleColor = isBull ? '#00f094' : '#ff3b69';

      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const top = Math.min(openY, closeY);
      const bodyH = Math.max(2, Math.abs(closeY - openY));
      ctx.fillStyle = candleColor;
      ctx.fillRect(x - (barWidth / 2), top, barWidth, bodyH);
    });

    // --- 6. REAL-TIME GLOWING LIVE PRICE LINE ---
    const latestCandle = candles[candles.length - 1];
    if (latestCandle) {
      const currentPrice = latestCandle.close;
      const liveY = priceToY(currentPrice);
      const isBullish = latestCandle.close >= latestCandle.open;
      const priceColor = isBullish ? '#00f094' : '#ff3b69';

      // Live Dotted Line across chart
      ctx.beginPath();
      ctx.moveTo(0, liveY);
      ctx.lineTo(width - 80, liveY);
      ctx.strokeStyle = priceColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulsing Price Badge on Y-Axis
      ctx.fillStyle = priceColor;
      ctx.fillRect(width - 78, liveY - 10, 76, 20);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText(formatPrice(currentPrice, currency, selectedAsset.currency), width - 73, liveY + 4);
    }

    // --- 7. AI Signal Markers ---
    if (signals && signals.length > 0) {
      signals.forEach(sig => {
        const cIndex = sig.candleIndex - startIndex;
        if (cIndex >= 0 && cIndex < count) {
          const x = idxToX(cIndex);
          const candle = visibleCandles[cIndex];
          const isBuy = sig.type === 'BUY';
          const y = isBuy ? priceToY(candle.low) + 16 : priceToY(candle.high) - 16;

          ctx.fillStyle = isBuy ? '#00f094' : '#ff3b69';
          ctx.beginPath();
          if (isBuy) {
            ctx.moveTo(x, y - 6);
            ctx.lineTo(x - 5, y + 4);
            ctx.lineTo(x + 5, y + 4);
          } else {
            ctx.moveTo(x, y + 6);
            ctx.lineTo(x - 5, y - 4);
            ctx.lineTo(x + 5, y - 4);
          }
          ctx.fill();

          ctx.font = 'bold 9px Plus Jakarta Sans';
          ctx.fillText(isBuy ? 'BUY' : 'SELL', x - 9, isBuy ? y + 14 : y - 8);
        }
      });
    }

    // --- 8. FREE-FLOATING INTERACTIVE DRAWINGS RENDERING ---
    drawings.forEach(d => {
      const isSelected = selectedDrawingId === d.id;

      if (d.type === 'HORIZONTAL') {
        const y = priceToY(d.price);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width - 80, y);
        ctx.strokeStyle = isSelected ? '#ffffff' : (d.color || '#f59e0b');
        ctx.lineWidth = isSelected ? 2.5 : 1.8;
        ctx.setLineDash(isSelected ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isSelected ? '#ffffff' : (d.color || '#f59e0b');
        ctx.fillRect(width - 78, y - 9, 74, 18);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(formatPrice(d.price, currency, selectedAsset.currency), width - 73, y + 3);

        if (isSelected) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(width / 2, y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.stroke();
        }
      } 
      else if (d.type === 'TRENDLINE') {
        const x1 = idxToX(d.startIdx - startIndex);
        const y1 = priceToY(d.startPrice);
        const x2 = idxToX(d.endIdx - startIndex);
        const y2 = priceToY(d.endPrice);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isSelected ? '#ffffff' : '#38bdf8';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#ffffff' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, Math.PI * 2);
        ctx.arc(x2, y2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
      } 
      else if (d.type === 'LONG_BOX' || d.type === 'SHORT_BOX') {
        const startX = idxToX(d.startIdx - startIndex);
        const entryY = priceToY(d.entryPrice);
        const tpY = priceToY(d.targetPrice);
        const slY = priceToY(d.stopLossPrice);
        const boxWidth = d.widthCandles * candleWidth;

        const greenTop = Math.min(entryY, tpY);
        const greenH = Math.abs(tpY - entryY);
        ctx.fillStyle = isSelected ? 'rgba(0, 240, 148, 0.28)' : 'rgba(0, 240, 148, 0.18)';
        ctx.strokeStyle = isSelected ? '#ffffff' : '#00f094';
        ctx.fillRect(startX, greenTop, boxWidth, greenH);
        ctx.strokeRect(startX, greenTop, boxWidth, greenH);

        const redTop = Math.min(entryY, slY);
        const redH = Math.abs(slY - entryY);
        ctx.fillStyle = isSelected ? 'rgba(255, 59, 105, 0.28)' : 'rgba(255, 59, 105, 0.18)';
        ctx.strokeStyle = isSelected ? '#ffffff' : '#ff3b69';
        ctx.fillRect(startX, redTop, boxWidth, redH);
        ctx.strokeRect(startX, redTop, boxWidth, redH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px JetBrains Mono';
        ctx.fillText(`Target: ${formatPrice(d.targetPrice, currency, selectedAsset.currency)}`, startX + 8, greenTop + 14);
        ctx.fillText(`Stop Loss: ${formatPrice(d.stopLossPrice, currency, selectedAsset.currency)}`, startX + 8, redTop + redH - 6);

        if (isSelected) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(startX + boxWidth / 2, entryY, 5, 0, Math.PI * 2);
          ctx.arc(startX + boxWidth / 2, tpY, 5, 0, Math.PI * 2);
          ctx.arc(startX + boxWidth / 2, slY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // --- 9. Drawing Preview ---
    if (drawingPreview && drawingPreview.type === 'TRENDLINE') {
      ctx.beginPath();
      ctx.moveTo(drawingPreview.x1, drawingPreview.y1);
      ctx.lineTo(drawingPreview.x2, drawingPreview.y2);
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // --- 10. Sub Panel (RSI or MACD) ---
    if (hasSubPanel) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(0, subTop, width - 80, subHeight);

      if (activeSubPanel === 'RSI') {
        const rsiValsAll = calculateRSI(candles, 14);
        const rsiVals = rsiValsAll.slice(startIndex, endIndex);
        const rsiToY = (v) => subTop + subHeight - ((v / 100) * subHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, rsiToY(70)); ctx.lineTo(width - 80, rsiToY(70));
        ctx.moveTo(0, rsiToY(30)); ctx.lineTo(width - 80, rsiToY(30));
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#94a3b8';
        ctx.fillText('RSI (14)', 10, subTop + 14);

        ctx.beginPath();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < count; i++) {
          if (rsiVals[i] !== null) {
            const x = idxToX(i);
            const y = rsiToY(rsiVals[i]);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      } else if (activeSubPanel === 'MACD') {
        const macdObj = calculateMACD(candles);
        const hist = macdObj.histogram.slice(startIndex, endIndex);

        let maxMacd = 0;
        hist.forEach(h => { if (h !== null && Math.abs(h) > maxMacd) maxMacd = Math.abs(h); });
        const macdToY = (v) => subTop + (subHeight / 2) - ((v / (maxMacd || 1)) * (subHeight * 0.4));

        ctx.fillStyle = '#94a3b8';
        ctx.fillText('MACD (12, 26, 9)', 10, subTop + 14);

        for (let i = 0; i < count; i++) {
          if (hist[i] !== null) {
            const x = idxToX(i);
            const zeroY = macdToY(0);
            const valY = macdToY(hist[i]);
            ctx.fillStyle = hist[i] >= 0 ? 'rgba(0, 240, 148, 0.6)' : 'rgba(255, 59, 105, 0.6)';
            ctx.fillRect(x - (barWidth / 2), Math.min(zeroY, valY), barWidth, Math.abs(zeroY - valY));
          }
        }
      }
    }

  }, [candles, visibleCount, scrollOffset, showEMA, showBB, showSupertrend, activeSubPanel, signals, drawings, selectedDrawingId, drawingPreview, currency, selectedAsset]);

  // Coordinate Conversion Mapper
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, price: 0, candleIdx: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hasSubPanel = activeSubPanel !== 'NONE';
    const mainHeight = hasSubPanel ? rect.height * 0.68 : rect.height - 30;

    const maxOffset = Math.max(0, candles.length - visibleCount);
    const clampedOffset = Math.min(maxOffset, Math.max(0, scrollOffset));
    const endIndex = candles.length - clampedOffset;
    const startIndex = Math.max(0, endIndex - visibleCount);

    const visibleCandles = candles.slice(startIndex, endIndex);
    
    let minPrice = Infinity, maxPrice = -Infinity;
    visibleCandles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    const pricePadding = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= pricePadding; maxPrice += pricePadding;

    const price = maxPrice - ((y - 15) / (mainHeight - 30)) * (maxPrice - minPrice);
    const candleWidth = (rect.width - 80) / visibleCandles.length;
    const relIdx = Math.floor(x / candleWidth);
    const candleIdx = startIndex + Math.max(0, Math.min(visibleCandles.length - 1, relIdx));

    return { x, y, price: parseFloat(price.toFixed(2)), candleIdx, relIdx };
  };

  // --- MOUSE WHEEL & TRACKPAD PINCH-ZOOM + SCROLL PANNING ---
  const handleWheel = (e) => {
    e.preventDefault();

    // Horizontal wheel scroll or Shift + wheel -> Pan back/forth in history
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      const panDelta = e.deltaX > 0 ? -3 : 3;
      setScrollOffset(prev => {
        const maxOffset = Math.max(0, candles.length - visibleCount);
        return Math.min(maxOffset, Math.max(0, prev + panDelta));
      });
      return;
    }

    // Vertical wheel / Pinch -> Zoom In / Zoom Out
    const zoomDelta = e.deltaY > 0 ? 6 : -6;
    setVisibleCount(prev => Math.min(240, Math.max(20, prev + zoomDelta)));
  };

  // Attach wheel listener with passive: false so e.preventDefault() works
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [candles, visibleCount, scrollOffset]);

  // --- MOUSE EVENT HANDLERS FOR DRAWINGS & DRAG PANNING ---

  const handleMouseDown = (e) => {
    const { x, y, price, candleIdx } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const startIndex = Math.max(0, candles.length - visibleCount);
    const candleWidth = (rect.width - 80) / visibleCount;

    let minPrice = Infinity, maxPrice = -Infinity;
    candles.slice(startIndex).forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });
    const pricePadding = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= pricePadding; maxPrice += pricePadding;
    const priceToY = (p) => (rect.height * 0.68) - ((p - minPrice) / (maxPrice - minPrice)) * (rect.height * 0.68 - 30) - 15;
    const idxToX = (i) => i * candleWidth + (candleWidth / 2);

    // 1. Check if clicking an existing drawing
    let hitFound = false;
    for (let i = drawings.length - 1; i >= 0; i--) {
      const d = drawings[i];

      if (d.type === 'HORIZONTAL') {
        const drawY = priceToY(d.price);
        if (Math.abs(y - drawY) < 12) {
          setSelectedDrawingId(d.id);
          setDragging({ id: d.id, handle: 'BODY' });
          hitFound = true; break;
        }
      } 
      else if (d.type === 'TRENDLINE') {
        const x1 = idxToX(d.startIdx - startIndex);
        const y1 = priceToY(d.startPrice);
        const x2 = idxToX(d.endIdx - startIndex);
        const y2 = priceToY(d.endPrice);

        if (Math.hypot(x - x1, y - y1) < 12) {
          setSelectedDrawingId(d.id); setDragging({ id: d.id, handle: 'P1' }); hitFound = true; break;
        } else if (Math.hypot(x - x2, y - y2) < 12) {
          setSelectedDrawingId(d.id); setDragging({ id: d.id, handle: 'P2' }); hitFound = true; break;
        }
      }
      else if (d.type === 'LONG_BOX' || d.type === 'SHORT_BOX') {
        const startX = idxToX(d.startIdx - startIndex);
        const boxWidth = d.widthCandles * candleWidth;
        const entryY = priceToY(d.entryPrice);
        const tpY = priceToY(d.targetPrice);
        const slY = priceToY(d.stopLossPrice);

        if (x >= startX && x <= startX + boxWidth) {
          if (Math.abs(y - entryY) < 10) {
            setSelectedDrawingId(d.id); setDragging({ id: d.id, handle: 'ENTRY' }); hitFound = true; break;
          } else if (Math.abs(y - tpY) < 10) {
            setSelectedDrawingId(d.id); setDragging({ id: d.id, handle: 'TP' }); hitFound = true; break;
          } else if (Math.abs(y - slY) < 10) {
            setSelectedDrawingId(d.id); setDragging({ id: d.id, handle: 'SL' }); hitFound = true; break;
          } else if (y >= Math.min(tpY, slY) && y <= Math.max(tpY, slY)) {
            setSelectedDrawingId(d.id);
            setDragging({ id: d.id, handle: 'MOVE', startIdx: candleIdx, startPrice: price, initialBox: { ...d } });
            hitFound = true; break;
          }
        }
      }
    }

    if (hitFound) return;

    // Deselect if clicked blank space
    if (activeTool === 'NONE') {
      setSelectedDrawingId(null);

      // Start Mouse Drag Pan
      setIsPanDragging(true);
      setPanStartX(x);
      setPanStartOffset(scrollOffset);
      return;
    }

    // 2. Handle Creation Mode
    if (activeTool === 'HORIZONTAL') {
      const newDraw = { id: `draw_${Date.now()}`, type: 'HORIZONTAL', price, color: '#f59e0b' };
      setDrawings([...drawings, newDraw]);
      setSelectedDrawingId(newDraw.id);
      setActiveTool('NONE');
    } 
    else if (activeTool === 'LONG_BOX' || activeTool === 'SHORT_BOX') {
      const isLong = activeTool === 'LONG_BOX';
      const newDraw = {
        id: `draw_${Date.now()}`,
        type: activeTool,
        startIdx: candleIdx,
        entryPrice: price,
        targetPrice: isLong ? parseFloat((price * 1.035).toFixed(2)) : parseFloat((price * 0.965).toFixed(2)),
        stopLossPrice: isLong ? parseFloat((price * 0.985).toFixed(2)) : parseFloat((price * 1.015).toFixed(2)),
        widthCandles: 24
      };
      setDrawings([...drawings, newDraw]);
      setSelectedDrawingId(newDraw.id);
      setActiveTool('NONE');
    }
    else if (activeTool === 'TRENDLINE') {
      if (!drawingPreview) {
        setDrawingPreview({ type: 'TRENDLINE', startIdx: candleIdx, startPrice: price, x1: x, y1: y, x2: x, y2: y });
      } else {
        const newDraw = {
          id: `draw_${Date.now()}`,
          type: 'TRENDLINE',
          startIdx: drawingPreview.startIdx,
          startPrice: drawingPreview.startPrice,
          endIdx: candleIdx,
          endPrice: price
        };
        setDrawings([...drawings, newDraw]);
        setSelectedDrawingId(newDraw.id);
        setDrawingPreview(null);
        setActiveTool('NONE');
      }
    }
  };

  const handleMouseMove = (e) => {
    const { x, y, price, candleIdx } = getCanvasCoords(e);

    // 1. Mouse Drag Panning
    if (isPanDragging) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const candleWidth = (rect.width - 80) / visibleCount;
        const deltaX = x - panStartX;
        const candleDelta = Math.round(deltaX / candleWidth);
        const maxOffset = Math.max(0, candles.length - visibleCount);
        setScrollOffset(Math.min(maxOffset, Math.max(0, panStartOffset + candleDelta)));
      }
      return;
    }

    // 2. Hover Inspector
    const maxOffset = Math.max(0, candles.length - visibleCount);
    const clampedOffset = Math.min(maxOffset, Math.max(0, scrollOffset));
    const endIndex = candles.length - clampedOffset;
    const startIndex = Math.max(0, endIndex - visibleCount);
    const visibleCandles = candles.slice(startIndex, endIndex);

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const candleWidth = (rect.width - 80) / visibleCandles.length;
      const hoverIdx = Math.floor(x / candleWidth);
      if (hoverIdx >= 0 && hoverIdx < visibleCandles.length) {
        const c = visibleCandles[hoverIdx];
        setHoverData({
          ...c,
          timeStr: new Date(c.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        });
      }
    }

    // 3. Drawing Handle Dragging
    if (dragging) {
      setCursorStyle('grabbing');
      setDrawings(prev => prev.map(d => {
        if (d.id !== dragging.id) return d;

        if (d.type === 'HORIZONTAL') {
          return { ...d, price };
        } 
        else if (d.type === 'TRENDLINE') {
          if (dragging.handle === 'P1') return { ...d, startIdx: candleIdx, startPrice: price };
          if (dragging.handle === 'P2') return { ...d, endIdx: candleIdx, endPrice: price };
        } 
        else if (d.type === 'LONG_BOX' || d.type === 'SHORT_BOX') {
          if (dragging.handle === 'ENTRY') return { ...d, entryPrice: price };
          if (dragging.handle === 'TP') return { ...d, targetPrice: price };
          if (dragging.handle === 'SL') return { ...d, stopLossPrice: price };
          if (dragging.handle === 'MOVE') {
            const priceDelta = price - dragging.startPrice;
            const idxDelta = candleIdx - dragging.startIdx;
            return {
              ...d,
              startIdx: dragging.initialBox.startIdx + idxDelta,
              entryPrice: parseFloat((dragging.initialBox.entryPrice + priceDelta).toFixed(2)),
              targetPrice: parseFloat((dragging.initialBox.targetPrice + priceDelta).toFixed(2)),
              stopLossPrice: parseFloat((dragging.initialBox.stopLossPrice + priceDelta).toFixed(2)),
            };
          }
        }
        return d;
      }));
      return;
    }

    if (drawingPreview && drawingPreview.type === 'TRENDLINE') {
      setDrawingPreview({ ...drawingPreview, x2: x, y2: y });
      return;
    }

    setCursorStyle(activeTool !== 'NONE' ? 'crosshair' : isPanDragging ? 'grabbing' : 'default');
  };

  const handleMouseUp = () => {
    if (dragging) setDragging(null);
    if (isPanDragging) setIsPanDragging(false);
  };

  const handleDeleteSelected = () => {
    if (selectedDrawingId) {
      setDrawings(drawings.filter(d => d.id !== selectedDrawingId));
      setSelectedDrawingId(null);
    }
  };

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : selectedAsset.basePrice;

  return (
    <div className="glass-panel" ref={containerRef} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', position: 'relative' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        
        {/* Timeframe Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`btn-ghost ${timeframe === tf.id ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {tf.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Order Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Order Margin:</span>
          <select 
            value={tradeAmount} 
            onChange={e => setTradeAmount(Number(e.target.value))}
            style={{ background: '#121622', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', padding: '2px 6px' }}
          >
            <option value={500}>$500 Margin</option>
            <option value={1000}>$1,000 Margin</option>
            <option value={2000}>$2,000 Margin</option>
            <option value={5000}>$5,000 Margin</option>
          </select>

          <button 
            onClick={() => onQuickTrade('BUY', currentPrice, tradeAmount)}
            className="btn-bullish"
            style={{ padding: '4px 12px', fontSize: '0.78rem' }}
          >
            <TrendingUp size={12} /> INSTANT BUY @ {formatPrice(currentPrice, currency, selectedAsset.currency)}
          </button>

          <button 
            onClick={() => onQuickTrade('SELL', currentPrice, tradeAmount)}
            className="btn-bearish"
            style={{ padding: '4px 12px', fontSize: '0.78rem' }}
          >
            <TrendingDown size={12} /> INSTANT SELL @ {formatPrice(currentPrice, currency, selectedAsset.currency)}
          </button>
        </div>

        {/* Overlays & Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setShowEMA(!showEMA)} className={`btn-ghost ${showEMA ? 'active' : ''}`} style={{ padding: '4px 8px', fontSize: '0.72rem' }}>EMA</button>
          <button onClick={() => setShowBB(!showBB)} className={`btn-ghost ${showBB ? 'active' : ''}`} style={{ padding: '4px 8px', fontSize: '0.72rem' }}>Bollinger</button>
          <button onClick={() => setShowSupertrend(!showSupertrend)} className={`btn-ghost ${showSupertrend ? 'active' : ''}`} style={{ padding: '4px 8px', fontSize: '0.72rem' }}>Supertrend</button>
          <button onClick={() => setActiveSubPanel(activeSubPanel === 'RSI' ? 'MACD' : activeSubPanel === 'MACD' ? 'NONE' : 'RSI')} className="btn-ghost active" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>Sub: {activeSubPanel}</button>
          
          <div style={{ display: 'flex', gap: '2px' }}>
            {scrollOffset > 0 && (
              <button onClick={() => setScrollOffset(0)} className="btn-ghost" title="Reset View to Latest Ticks" style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#00f094' }}>
                <RefreshCw size={12} /> Real-Time
              </button>
            )}
            <button onClick={() => setVisibleCount(Math.max(20, visibleCount - 15))} className="btn-ghost" style={{ padding: '4px 6px' }}><ZoomIn size={12} /></button>
            <button onClick={() => setVisibleCount(Math.min(240, visibleCount + 15))} className="btn-ghost" style={{ padding: '4px 6px' }}><ZoomOut size={12} /></button>
          </div>
        </div>

      </div>

      {/* Main Chart Body */}
      <div style={{ flex: 1, display: 'flex', gap: '10px', position: 'relative' }}>
        
        {/* Floating Drawing Toolbar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(10, 14, 22, 0.85)', backdropFilter: 'blur(10px)', padding: '8px', borderRadius: '10px', border: '1px solid var(--border-color)', zIndex: 10 }}>
          <button 
            onClick={() => setActiveTool(activeTool === 'TRENDLINE' ? 'NONE' : 'TRENDLINE')}
            className={`btn-ghost ${activeTool === 'TRENDLINE' ? 'active' : ''}`}
            title="Draw Interactive Trendline"
            style={{ padding: '8px' }}
          >
            <Slash size={16} color="#38bdf8" />
          </button>

          <button 
            onClick={() => setActiveTool(activeTool === 'HORIZONTAL' ? 'NONE' : 'HORIZONTAL')}
            className={`btn-ghost ${activeTool === 'HORIZONTAL' ? 'active' : ''}`}
            title="Draw Floating Support/Resistance Line"
            style={{ padding: '8px' }}
          >
            <Minus size={16} color="#f59e0b" />
          </button>

          <button 
            onClick={() => setActiveTool(activeTool === 'LONG_BOX' ? 'NONE' : 'LONG_BOX')}
            className={`btn-ghost ${activeTool === 'LONG_BOX' ? 'active' : ''}`}
            title="Long Position Box"
            style={{ padding: '8px' }}
          >
            <TrendingUp size={16} color="#00f094" />
          </button>

          <button 
            onClick={() => setActiveTool(activeTool === 'SHORT_BOX' ? 'NONE' : 'SHORT_BOX')}
            className={`btn-ghost ${activeTool === 'SHORT_BOX' ? 'active' : ''}`}
            title="Short Position Box"
            style={{ padding: '8px' }}
          >
            <TrendingDown size={16} color="#ff3b69" />
          </button>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />

          {selectedDrawingId && (
            <button 
              onClick={handleDeleteSelected}
              className="btn-ghost"
              title="Delete Selected Drawing"
              style={{ padding: '8px', background: 'rgba(255, 59, 105, 0.2)', color: 'var(--bearish)', borderColor: 'var(--bearish)' }}
            >
              <Trash2 size={16} />
            </button>
          )}

          {drawings.length > 0 && !selectedDrawingId && (
            <button 
              onClick={() => { setDrawings([]); setSelectedDrawingId(null); }}
              className="btn-ghost"
              title="Clear All Drawings"
              style={{ padding: '8px', color: 'var(--text-muted)' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Canvas Area */}
        <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '380px' }} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverData(null)}>
          <canvas 
            ref={canvasRef} 
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            style={{ width: '100%', height: '100%', display: 'block', cursor: cursorStyle }} 
          />

          {/* Pinch Zoom & Scroll Hint */}
          <div style={{ position: 'absolute', bottom: '35px', right: '90px', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Trackpad Pinch / Wheel to Zoom • Drag to Pan History
          </div>

          {/* Active Tool Prompt */}
          {activeTool !== 'NONE' && (
            <div style={{ position: 'absolute', top: '10px', right: '90px', background: 'rgba(99, 102, 241, 0.95)', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Move size={14} /> Active Tool: Click chart to place free-floating {activeTool}
            </div>
          )}

          {/* Hover Inspector Tooltip */}
          {hoverData && (
            <div className="chart-tooltip" style={{ top: '10px', left: '10px', display: 'flex', gap: '12px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Date/Time:</span> <strong>{hoverData.timeStr}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>O:</span> <strong className="font-mono">{formatPrice(hoverData.open, currency, selectedAsset.currency)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>H:</span> <strong className="font-mono" style={{ color: 'var(--bullish)' }}>{formatPrice(hoverData.high, currency, selectedAsset.currency)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>L:</span> <strong className="font-mono" style={{ color: 'var(--bearish)' }}>{formatPrice(hoverData.low, currency, selectedAsset.currency)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>C:</span> <strong className="font-mono">{formatPrice(hoverData.close, currency, selectedAsset.currency)}</strong></div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
