'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Undo, Trash2, Check, Circle, Edit3, Hand, ZoomIn, ZoomOut, Maximize, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  type: 'freehand' | 'rect' | 'circle';
}

interface ImageEditorProps {
  imageSrc: string;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
  originalFileName: string;
}

const BRUSH_COLORS = [
  { name: 'Red', value: '#FF3B30' },     // Apple Red
  { name: 'Yellow', value: '#FFCC00' },  // Apple Yellow
  { name: 'Blue', value: '#007AFF' },    // Apple Blue
  { name: 'Green', value: '#34C759' },   // Apple Green
];

const BRUSH_SIZES = [
  { name: 'Small', value: 4 },
  { name: 'Medium', value: 10 },
  { name: 'Large', value: 20 },
];

export function ImageEditor({
  imageSrc,
  onSave,
  onCancel,
  originalFileName,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Customization States
  const [color, setColor] = useState('#FF3B30'); 
  const [brushSize, setBrushSize] = useState(10);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [editorMode, setEditorMode] = useState<'pan' | 'draw' | 'rect' | 'circle'>('pan'); // Default: pan

  // Zoom & Pan States
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  // Refs for tracking interactions without triggering re-renders
  const isDrawingRef = useRef(false);
  const draftStrokeRef = useRef<Stroke | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number, y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Create image object to load source
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = 'anonymous'; 
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
  }, [imageSrc]);

  // Center & Fit Image initially
  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const img = imgRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const padding = 40; // 20px padding on each side
    
    const scaleX = (containerRect.width - padding) / img.naturalWidth;
    const scaleY = (containerRect.height - padding) / img.naturalHeight;
    const initialScale = Math.min(scaleX, scaleY, 1); // Don't scale up initially
    
    const initialX = (containerRect.width - (img.naturalWidth * initialScale)) / 2;
    const initialY = (containerRect.height - (img.naturalHeight * initialScale)) / 2;
    
    setZoomScale(initialScale);
    setPanOffset({ x: initialX, y: initialY });
  }, [imgLoaded]);

  // Handle Redrawing Canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const drawStroke = (stroke: Stroke, isDraft: boolean) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (isDraft) {
        ctx.setLineDash([6, 6]); // Dashed line for draft
      } else {
        ctx.setLineDash([]);
      }

      const type = stroke.type || 'freehand';

      if (type === 'freehand') {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (type === 'rect') {
        const start = stroke.points[0];
        const end = stroke.points[1] || start;
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (type === 'circle') {
        const start = stroke.points[0];
        const end = stroke.points[1] || start;
        const radius = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    };

    // Draw all committed strokes
    strokes.forEach(s => drawStroke(s, false));
    
    // Draw draft stroke
    if (draftStrokeRef.current) {
      drawStroke(draftStrokeRef.current, true);
    }
  }, [strokes]);

  const scheduleRedraw = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(() => {
      redraw();
      animFrameRef.current = null;
    });
  }, [redraw]);

  // Adjust canvas size to match image dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth || 1024;
    canvas.height = img.naturalHeight || 768;

    redraw();
  }, [imgLoaded, redraw]);

  // Trigger redraw on strokes update
  useEffect(() => {
    redraw();
  }, [strokes, redraw]);

  // Zoom logic
  const handleZoom = useCallback((clientX: number, clientY: number, deltaY: number) => {
    setZoomScale(prevScale => {
      const zoomFactor = deltaY < 0 ? 0.15 : -0.15;
      const newScale = Math.min(5.0, Math.max(0.5, prevScale + zoomFactor));
      
      if (newScale !== prevScale && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate pointer position relative to container
        const pointerX = clientX - containerRect.left;
        const pointerY = clientY - containerRect.top;
        
        setPanOffset(prevOffset => {
          // pointer pos relative to the unscaled canvas origin
          const unscaledX = (pointerX - prevOffset.x) / prevScale;
          const unscaledY = (pointerY - prevOffset.y) / prevScale;
          
          // new offset to keep the pointer over the same unscaled coordinate
          return {
            x: pointerX - unscaledX * newScale,
            y: pointerY - unscaledY * newScale
          };
        });
      }
      return newScale;
    });
  }, []);

  // Handle mouse scroll wheel zoom inside active listener to prevent default page scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleZoom(e.clientX, e.clientY, e.deltaY);
    };

    container.addEventListener('wheel', handleScrollWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleScrollWheel);
    };
  }, [handleZoom]);

  const handleZoomButton = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'reset') {
       // Re-calculate fit
       if (!imgRef.current || !containerRef.current) return;
       const container = containerRef.current;
       const img = imgRef.current;
       const containerRect = container.getBoundingClientRect();
       const padding = 40;
       const scaleX = (containerRect.width - padding) / img.naturalWidth;
       const scaleY = (containerRect.height - padding) / img.naturalHeight;
       const initialScale = Math.min(scaleX, scaleY, 1);
       const initialX = (containerRect.width - (img.naturalWidth * initialScale)) / 2;
       const initialY = (containerRect.height - (img.naturalHeight * initialScale)) / 2;
       setZoomScale(initialScale);
       setPanOffset({ x: initialX, y: initialY });
       return;
    }
    
    setZoomScale((prevScale) => {
      const newScale = direction === 'in' 
        ? Math.min(5.0, parseFloat((prevScale + 0.5).toFixed(1)))
        : Math.max(0.5, parseFloat((prevScale - 0.5).toFixed(1)));
        
      if (newScale !== prevScale && containerRef.current) {
         // zoom towards center of container
         const containerRect = containerRef.current.getBoundingClientRect();
         const pointerX = containerRect.width / 2;
         const pointerY = containerRect.height / 2;
         
         setPanOffset(prevOffset => {
          const unscaledX = (pointerX - prevOffset.x) / prevScale;
          const unscaledY = (pointerY - prevOffset.y) / prevScale;
          return {
            x: pointerX - unscaledX * newScale,
            y: pointerY - unscaledY * newScale
          };
        });
      }
      return newScale;
    });
  };

  // Translate screen coordinate to canvas coordinate
  const getCanvasCoordinates = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  // pointer event handlers for unified pan/draw
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If middle click or space+click (simulated pan) or mode is pan
    if (e.button === 1 || editorMode === 'pan') {
      isPanningRef.current = true;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.pointerType === 'touch') {
       // let touch handlers deal with it
       return;
    }

    // Drawing
    const pt = getCanvasCoordinates(e.clientX, e.clientY);
    if (!pt) return;

    isDrawingRef.current = true;
    draftStrokeRef.current = {
      points: [pt],
      color,
      width: brushSize,
      type: editorMode === 'draw' ? 'freehand' : editorMode,
    };
    scheduleRedraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanningRef.current && lastPanPointRef.current) {
      const dx = e.clientX - lastPanPointRef.current.x;
      const dy = e.clientY - lastPanPointRef.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.pointerType === 'touch') return;

    if (isDrawingRef.current && draftStrokeRef.current) {
      const pt = getCanvasCoordinates(e.clientX, e.clientY);
      if (!pt) return;

      const activeStroke = draftStrokeRef.current;
      if (activeStroke.type === 'freehand') {
        const lastPoint = activeStroke.points[activeStroke.points.length - 1];
        if (lastPoint) {
          const dist = Math.hypot(pt.x - lastPoint.x, pt.y - lastPoint.y);
          if (dist < 1.5) return; 
        }
        activeStroke.points.push(pt);
      } else {
        activeStroke.points[1] = pt;
      }
      scheduleRedraw();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      lastPanPointRef.current = null;
    }

    if (isDrawingRef.current && draftStrokeRef.current) {
      isDrawingRef.current = false;
      setStrokes(prev => [...prev, draftStrokeRef.current!]);
      draftStrokeRef.current = null;
      scheduleRedraw();
    }
  };

  // Touch handlers for Pinch-to-Zoom and Pan/Draw
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch start
      isPanningRef.current = false;
      isDrawingRef.current = false;
      draftStrokeRef.current = null;
      scheduleRedraw();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      lastPinchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      if (editorMode === 'pan') {
         isPanningRef.current = true;
         lastPanPointRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
         const pt = getCanvasCoordinates(e.touches[0].clientX, e.touches[0].clientY);
         if (pt) {
            isDrawingRef.current = true;
            draftStrokeRef.current = {
              points: [pt],
              color,
              width: brushSize,
              type: editorMode === 'draw' ? 'freehand' : editorMode,
            };
            scheduleRedraw();
         }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Prevent default to stop scrolling handled by CSS touch-action: none
    if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const delta = dist - lastPinchDistRef.current;
      
      // zoom center
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      handleZoom(centerX, centerY, -delta * 0.5); // scale delta
      lastPinchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      if (isPanningRef.current && lastPanPointRef.current) {
        const dx = e.touches[0].clientX - lastPanPointRef.current.x;
        const dy = e.touches[0].clientY - lastPanPointRef.current.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPanPointRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (isDrawingRef.current && draftStrokeRef.current) {
        const pt = getCanvasCoordinates(e.touches[0].clientX, e.touches[0].clientY);
        if (!pt) return;

        const activeStroke = draftStrokeRef.current;
        if (activeStroke.type === 'freehand') {
          const lastPoint = activeStroke.points[activeStroke.points.length - 1];
          if (lastPoint) {
            const dist = Math.hypot(pt.x - lastPoint.x, pt.y - lastPoint.y);
            if (dist < 1.5) return; 
          }
          activeStroke.points.push(pt);
        } else {
          activeStroke.points[1] = pt;
        }
        scheduleRedraw();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      lastPinchDistRef.current = null;
    }
    if (e.touches.length === 0) {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        lastPanPointRef.current = null;
      }
      if (isDrawingRef.current && draftStrokeRef.current) {
        isDrawingRef.current = false;
        setStrokes(prev => [...prev, draftStrokeRef.current!]);
        draftStrokeRef.current = null;
        scheduleRedraw();
      }
    }
  };

  // Canvas Action functions
  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // To save without dashed lines from draft
    scheduleRedraw(); // ensures no draft is drawn

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        
        const finalFile = new File([blob], originalFileName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        onSave(finalFile);
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex flex-col md:p-6 select-none">
      
      {/* Top Navbar */}
      <div className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-accent">
            <Hand size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">แก้ไขภาพหลักฐาน</h3>
            <p className="text-[10px] text-white/40 font-medium truncate max-w-[200px] md:max-w-xs">{originalFileName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 border border-white/5 transition-colors"
            title="ย้อนกลับ"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={handleClear}
            disabled={strokes.length === 0}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/5 transition-colors"
            title="ล้างทั้งหมด"
          >
            <Trash2 size={16} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-white font-bold text-xs hover:bg-white hover:text-black transition-all shadow-lg shadow-accent/15"
          >
            <Check size={14} /> นำไปใช้ (Apply)
          </button>
        </div>
      </div>

      {/* Editor Center Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative touch-none bg-slate-950"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/50 font-medium">กำลังโหลดรูปภาพ...</p>
          </div>
        )}
        
        {/* Transform Layer */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
            transformOrigin: '0 0',
            width: 'fit-content',
            height: 'fit-content'
          }}
          className="absolute top-0 left-0"
        >
          <canvas
            ref={canvasRef}
            className={`object-contain rounded-sm shadow-2xl border border-white/10 bg-slate-900 select-none ${
              editorMode === 'pan' 
                ? isPanningRef.current 
                  ? 'cursor-grabbing' 
                  : 'cursor-grab'
                : 'cursor-crosshair'
            }`}
            style={{ 
              display: imgLoaded ? 'block' : 'none',
            }}
          />
        </div>
      </div>

      {/* Bottom Tool bar - Canvas Controls & Customizations */}
      <div className="p-6 border-t border-white/10 bg-black/60 backdrop-blur-md flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
        
        {/* Toggle Mode (Draw vs Pan vs Shapes) */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest text-center md:text-left">โหมดเครื่องมือ (ดึงปุ่มวาดเพื่อร่าง)</span>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-fit gap-1 flex-wrap justify-center">
            <button
              onClick={() => setEditorMode('pan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                editorMode === 'pan'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Hand size={12} /> เลื่อนภาพ (Pan)
            </button>
            <button
              onClick={() => setEditorMode('draw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                editorMode === 'draw'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Edit3 size={12} /> พู่กัน (Draw)
            </button>
            <button
              onClick={() => setEditorMode('rect')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                editorMode === 'rect'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Square size={12} /> สี่เหลี่ยม (Rect)
            </button>
            <button
              onClick={() => setEditorMode('circle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                editorMode === 'circle'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Circle size={10} className="fill-none text-current border-2" /> วงกลม (Circle)
            </button>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10 hidden md:block" />

        {/* Zoom Controls */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest text-center md:text-left">การซูม (หรือใช้ลูกกลิ้งเมาส์)</span>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-fit items-center gap-1">
            <button
              onClick={() => handleZoomButton('out')}
              disabled={zoomScale <= 0.5}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="ซูมออก"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] font-bold text-white px-2.5 min-w-[54px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => handleZoomButton('in')}
              disabled={zoomScale >= 5.0}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="ซูมเข้า"
            >
              <ZoomIn size={14} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => handleZoomButton('reset')}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-[9px] font-bold"
              title="พอดีหน้าจอ"
            >
              <Maximize size={12} />
            </button>
          </div>
        </div>

        {editorMode !== 'pan' && <div className="w-px h-10 bg-white/10 hidden md:block" />}

        {/* Colors Selector */}
        {editorMode !== 'pan' && (
          <div className="flex flex-col gap-2 transition-all">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest text-center md:text-left">เลือกสีร่าง</span>
            <div className="flex gap-3">
              {BRUSH_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className="w-8 h-8 rounded-full border flex items-center justify-center relative transition-transform duration-200 hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    borderColor: color === c.value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.1)',
                    boxShadow: color === c.value ? `0 0 12px ${c.value}` : 'none'
                  }}
                >
                  {color === c.value && (
                    <Circle size={10} className="fill-white text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {editorMode !== 'pan' && <div className="w-px h-10 bg-white/10 hidden md:block" />}

        {/* Sizes Selector */}
        {editorMode !== 'pan' && (
          <div className="flex flex-col gap-2 transition-all">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest text-center md:text-left">ขนาดลายเส้น</span>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 w-fit">
              {BRUSH_SIZES.map((sz) => (
                <button
                  key={sz.value}
                  onClick={() => setBrushSize(sz.value)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    brushSize === sz.value
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {sz.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
