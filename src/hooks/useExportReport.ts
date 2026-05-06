/**
 * useExportReport Hook
 * ---------------------------------------------------
 * จัดการการ Export รายงาน Case เป็น PNG (Long Image)
 * และ PDF (Multi-page A4) โดยใช้ html2canvas + jsPDF
 *
 * ขั้นตอนการทำงาน:
 * 1. รอให้รูปภาพทุกรูปโหลดเสร็จ (Image Preload)
 * 2. ใช้ html2canvas จับภาพ Ghost Template (ที่ซ่อนอยู่)
 * 3. สร้างไฟล์ PNG หรือ PDF พร้อมดาวน์โหลดอัตโนมัติ
 * ---------------------------------------------------
 */

import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { fetchImageDataUrl } from '../services/api';
import { toCorsProxyUrl, toDisplayImageUrl } from '../utils/imageUrls';

// ===== ค่าคงที่สำหรับการ Export =====
const PNG_SCALE = 2;           // ความละเอียดรูป PNG (2x = คมชัดมาก)
const PDF_SCALE = 2;           // ความละเอียดรูป PDF (2x)
const A4_WIDTH_MM = 210;       // กว้างกระดาษ A4 (mm)
const A4_HEIGHT_MM = 297;      // สูงกระดาษ A4 (mm)
const PDF_MARGIN_MM = 10;      // ขอบรอบกระดาษ (mm)

// คำนวณพื้นที่ใช้งานจริงบนกระดาษ A4
const CONTENT_WIDTH_MM = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;

/**
 * แปลง URL ของรูปภาพเป็น Base64
 * เพื่อแก้ปัญหา CORS ตอนที่ html2canvas พยายามวาดรูปลง canvas
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const decodedUrl = url.includes('corsproxy.io/?')
    ? decodeURIComponent(url.split('corsproxy.io/?')[1] || '')
    : url;
  const displayUrl = toDisplayImageUrl(decodedUrl, 1600);
  const urlsToTry = [displayUrl, toCorsProxyUrl(displayUrl)];

  try {
    return await fetchImageDataUrl(decodedUrl);
  } catch {
    // Fall back to browser fetch strategies for non-Drive or legacy URLs.
  }

  for (const candidateUrl of urlsToTry) {
    try {
      const response = await fetch(candidateUrl);
      if (!response.ok) {
        throw new Error(`Image fetch error: ${response.status}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      // Try the next URL strategy.
    }
  }

  return displayUrl;
}

/**
 * รอให้รูปภาพทุกรูปใน Element โหลดเสร็จ
 * และแอบแปลง External Image เป็น Base64 ให้หมดเพื่อแก้ปัญหาภาพกลวง (Empty Box)
 */
async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  
  // 1. แปลง External URLs เป็น Base64
  for (const img of images) {
    if (img.src.startsWith('http') && !img.src.startsWith('data:')) {
      const originalSrc = img.getAttribute('data-original-src') || img.src;
      const base64 = await fetchImageAsBase64(originalSrc);
      img.src = base64;
    }
  }

  // 2. รอให้ Browser render รูป (แม้จะเป็น Base64 ก็ควรรอ onload)
  const promises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // ถ้าโหลดไม่ได้ก็ข้ามไป (ไม่ block)
    });
  });

  await Promise.all(promises);
}

/**
 * ===== Hook หลัก =====
 */
export function useExportReport() {
  // ref ชี้ไปยัง Ghost Template (Component ที่ซ่อนอยู่ใน DOM)
  const exportRef = useRef<HTMLDivElement>(null);

  // สถานะการ Export
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  /**
   * Export เป็น PNG (Long Image แนวตั้ง)
   * ภาพจะยาวตามจำนวน Item ที่อยู่ใน Case
   */
  const exportPNG = useCallback(async (caseId: string) => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setExportProgress('กำลังเตรียมข้อมูล...');

    try {
      // Step 1: แสดง Ghost Template ชั่วคราวเพื่อให้ html2canvas จับภาพได้
      const el = exportRef.current;
      el.style.display = 'block';
      el.style.position = 'absolute';
      el.style.left = '-9999px'; // ซ่อนไว้นอกหน้าจอ (ผู้ใช้ไม่เห็น)
      el.style.top = '0';
      el.style.width = '800px'; // กว้างคงที่เพื่อให้ Layout สม่ำเสมอ

      // Step 2: รอรูปภาพโหลดครบ + แปลงเป็น Base64
      setExportProgress('กำลังโหลดรูปภาพ...');
      await waitForImages(el);

      // Step 2.5: รอโหลด Fonts ให้สมบูรณ์ก่อน (สำคัญสำหรับฟอนต์ภาษาไทย)
      setExportProgress('กำลังประมวลผลฟอนต์...');
      await document.fonts.ready;

      // บังคับให้ Container แสดงผลทั้งหมดแบบไม่ซ่อน
      el.style.overflow = 'visible';

      // Step 3: จับภาพด้วย html2canvas
      setExportProgress('กำลังสร้างรูปภาพ...');
      const canvas = await html2canvas(el, {
        scale: PNG_SCALE,
        useCORS: true,        // รองรับรูปจาก Google Drive
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        // @ts-ignore: Legacy option requested by user
        letterRendering: true, // ช่วยเรื่องการจัดเรียงตัวอักษร
        onclone: (clonedDoc) => {
          // บังคับให้ Element ที่ซ่อนอยู่แสดงผลในตัว Clone
          const clonedEl = clonedDoc.querySelector('[data-export-template="true"]') as HTMLElement;
          if (clonedEl) {
            clonedEl.style.display = 'block';
            clonedEl.style.width = '800px';
          }
        },
      });

      // Step 4: แปลง Canvas → PNG แล้วดาวน์โหลด
      setExportProgress('กำลังดาวน์โหลด...');
      const link = document.createElement('a');
      link.download = `Rework_Report_${caseId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Step 5: ซ่อน Ghost Template กลับ
      el.style.display = 'none';
    } catch (error) {
      console.error('❌ PNG Export failed:', error);
      alert('ไม่สามารถ Export PNG ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      if (exportRef.current) {
        exportRef.current.style.display = 'none';
      }
      setIsExporting(false);
      setExportProgress('');
    }
  }, []);

  /**
   * Export เป็น PDF (Multi-page A4)
   * ถ้าข้อมูลยาวเกินหน้ากระดาษ จะแบ่งหน้าอัตโนมัติ
   */
  const exportPDF = useCallback(async (caseId: string) => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setExportProgress('กำลังเตรียมข้อมูล...');

    try {
      // Step 1: แสดง Ghost Template
      const el = exportRef.current;
      el.style.display = 'block';
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      el.style.top = '0';
      el.style.width = '800px';

      // Step 2: รอรูปภาพโหลดครบ + แปลงเป็น Base64
      setExportProgress('กำลังโหลดรูปภาพ...');
      await waitForImages(el);

      // Step 2.5: รอโหลด Fonts ให้สมบูรณ์ก่อน
      setExportProgress('กำลังประมวลผลฟอนต์...');
      await document.fonts.ready;

      // บังคับให้ Container แสดงผลทั้งหมดแบบไม่ซ่อน
      el.style.overflow = 'visible';

      // Step 3: จับภาพเป็น Canvas
      setExportProgress('กำลังสร้าง PDF...');
      const canvas = await html2canvas(el, {
        scale: PDF_SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        // @ts-ignore: Legacy option requested by user
        letterRendering: true,
        onclone: (clonedDoc) => {
          // บังคับให้ Element ที่ซ่อนอยู่แสดงผลในตัว Clone
          const clonedEl = clonedDoc.querySelector('[data-export-template="true"]') as HTMLElement;
          if (clonedEl) {
            clonedEl.style.display = 'block';
            clonedEl.style.width = '800px';
          }
        },
      });

      // Step 4: คำนวณขนาดภาพบนกระดาษ A4
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;

      // อัตราส่วน px ต่อ mm (จากความกว้าง content)
      const pxPerMm = imgWidthPx / CONTENT_WIDTH_MM;
      // ความสูงทั้งหมดเมื่อวางลงบนกระดาษ (mm)
      const totalHeightMm = imgHeightPx / pxPerMm;

      // Step 5: สร้าง PDF + แบ่งหน้า
      const pdf = new jsPDF('p', 'mm', 'a4');
      let offsetMm = 0; // ตำแหน่งที่อ่านถึงแล้ว (mm)
      let pageNum = 0;

      setExportProgress('กำลังจัดหน้ากระดาษ...');

      while (offsetMm < totalHeightMm) {
        if (pageNum > 0) {
          pdf.addPage();
        }

        // คำนวณว่า "ส่วนนี้" ของภาพเริ่มที่ pixel ไหน
        const sourceYPx = offsetMm * pxPerMm;
        // ความสูงที่จะตัดมาใส่ในหน้านี้ (px)
        const sliceHeightPx = Math.min(
          CONTENT_HEIGHT_MM * pxPerMm,
          imgHeightPx - sourceYPx
        );

        // ตัดส่วนของภาพออกมา (Slice)
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidthPx;
        pageCanvas.height = sliceHeightPx;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceYPx,               // ตำแหน่งเริ่มต้นบนภาพต้นฉบับ
            imgWidthPx, sliceHeightPx,   // ขนาดที่จะตัด
            0, 0,                        // ตำแหน่งวาง
            imgWidthPx, sliceHeightPx    // ขนาดที่จะวาง
          );
        }

        // วางภาพลงใน PDF
        const sliceHeightMm = sliceHeightPx / pxPerMm;
        const pageImgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(
          pageImgData,
          'PNG',
          PDF_MARGIN_MM,              // x margin
          PDF_MARGIN_MM,              // y margin
          CONTENT_WIDTH_MM,           // ความกว้างบนกระดาษ
          sliceHeightMm               // ความสูงบนกระดาษ
        );

        offsetMm += CONTENT_HEIGHT_MM;
        pageNum++;
      }

      // Step 6: ดาวน์โหลด PDF
      setExportProgress('กำลังดาวน์โหลด...');
      pdf.save(`Rework_Report_${caseId}.pdf`);

      // Step 7: ซ่อน Ghost Template
      el.style.display = 'none';
    } catch (error) {
      console.error('❌ PDF Export failed:', error);
      alert('ไม่สามารถ Export PDF ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      if (exportRef.current) {
        exportRef.current.style.display = 'none';
      }
      setIsExporting(false);
      setExportProgress('');
    }
  }, []);

  return {
    exportRef,        // ใช้ผูกกับ Ghost Template Component
    isExporting,      // true = กำลัง export อยู่
    exportProgress,   // ข้อความบอกขั้นตอน
    exportPNG,        // เรียกเพื่อ export PNG
    exportPDF,        // เรียกเพื่อ export PDF
  };
}
