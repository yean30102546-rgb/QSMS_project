# Title: Image Annotation Canvas, Zooming & Panning
อัปเดตเมื่อ: 2026-05-27

## 1. Summary & Current Implementation
เพิ่มระบบขีดเขียนทำเครื่องหมายจุดเสียของสินค้า (Image Annotation) ลงบนรูปภาพหลักฐานก่อนบันทึกเคส พร้อมระบบการซูมด้วยลูกกลิ้งเมาส์ (Zoom toward cursor) และการแพนรูปภาพ รวมถึงเพิ่มรูปทรงเรขาคณิต (สี่เหลี่ยม, วงกลม) เป็นทางเลือกในการไฮไลต์ 
โดยระบบมีการปรับแก้เรื่อง Transform Scale และ Offset แทนการย่อขยายขนาด Container (Width/Height) เพื่อให้สามารถซูมได้อย่างเสถียรและลื่นไหล (รองรับ Multi-touch Pinch to Zoom ด้วย)

## 2. Technical Code Snippet (Best Practice)
- การคำนวณการซูมแบบเจาะจงจุดเมาส์ (Zoom towards cursor) อ้างอิงจุดจากหน้าจอมาเป็นสัดส่วนของการ Scale
```typescript
const handleZoom = useCallback((clientX: number, clientY: number, deltaY: number) => {
  setZoomScale(prevScale => {
    const zoomFactor = deltaY < 0 ? 0.15 : -0.15;
    const newScale = Math.min(5.0, Math.max(0.5, prevScale + zoomFactor));
    
    if (newScale !== prevScale && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const pointerX = clientX - containerRect.left;
      const pointerY = clientY - containerRect.top;
      
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
}, []);
```

- การวาดร่างเส้นโดยใช้ RequestAnimationFrame (`draftStrokeRef`) แทนการ SetState ทันทีทุกครั้งที่เมาส์ขยับเพื่อลดการกระตุก (Render blocking):
```typescript
  const scheduleRedraw = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(() => {
      redraw();
      animFrameRef.current = null;
    });
  }, [redraw]);
```

- การใช้ CSS CSS transform property แทน Width/Height scaling เพื่อให้ได้ความละเอียดที่ดีที่สุด:
```tsx
<div
  style={{
    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
    transformOrigin: '0 0',
  }}
>
  <canvas ref={canvasRef} />
</div>
```

## 3. Knowledge Relationships
Depends On (ต้องพึ่งพา): 
- [[components/ImageUpload.tsx]] สำหรับเปิดหน้าต่างแก้ไขรูปภาพ
- [[components/layout/MainLayout.tsx]] สำหรับประมวลผลโมดอลสิทธิ์และการแสดงผลบทบาทผู้ใช้
- [[config/auth.config.ts]] สำหรับใช้ดูแผนผังการกำหนดสิทธิ์ของแต่ละบทบาทผู้ใช้ (QSMS, OPERATOR, FINANCE)
