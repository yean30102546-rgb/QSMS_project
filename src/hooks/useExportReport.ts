import { useCallback, useRef, useState } from 'react';

import { fetchImageDataUrl } from '../services/api';
import { toCorsProxyUrl, toDisplayImageUrl } from '../utils/imageUrls';

const PNG_SCALE = 2;
const PDF_SCALE = 2;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 10;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;

async function loadExportLibraries() {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  return { html2canvas, jsPDF };
}

const IMAGE_TIMEOUT_MS = 5000; // 5 seconds per image

async function fetchImageAsBase64(url: string): Promise<string> {
  const decodedUrl = url.includes('corsproxy.io/?')
    ? decodeURIComponent(url.split('corsproxy.io/?')[1] || '')
    : url;

  // Don't try to fetch local paths through remote proxy or GAS
  if (decodedUrl.startsWith('/') || decodedUrl.startsWith('./') || !decodedUrl.startsWith('http')) {
    return decodedUrl;
  }

  const displayUrl = toDisplayImageUrl(decodedUrl, 1600);
  const urlsToTry = [displayUrl, toCorsProxyUrl(displayUrl)];

  try {
    // Add a timeout to the GAS fetch
    const fetchPromise = fetchImageDataUrl(decodedUrl);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Image fetch timeout')), IMAGE_TIMEOUT_MS)
    );
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    console.warn(`GAS image fetch failed for ${decodedUrl}:`, err);
  }

  for (const candidateUrl of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
      
      const response = await fetch(candidateUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Image fetch error: ${response.status}`);
      }

      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn(`Candidate fetch failed for ${candidateUrl}:`, err);
    }
  }

  return displayUrl;
}

async function waitForImages(container: HTMLElement, onProgress?: (msg: string) => void): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  const total = images.length;
  let loaded = 0;

  const updateProgress = () => {
    if (onProgress) {
      onProgress(`Loading images... (${loaded}/${total})`);
    }
  };

  updateProgress();

  for (const img of images) {
    if (img.src && !img.src.startsWith('data:')) {
      const originalSrc = img.getAttribute('data-original-src') || img.src;
      try {
        const base64 = await fetchImageAsBase64(originalSrc);
        img.src = base64;
      } catch (err) {
        console.warn('Failed to convert image to base64:', originalSrc, err);
      }
    }
    loaded++;
    updateProgress();
  }

  // Final wait for browser to decode all set srcs
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        // Safety timeout for individual image load
        setTimeout(resolve, 2000);
      });
    }),
  );
}

function prepareExportElement(el: HTMLDivElement) {
  el.style.display = 'block';
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.top = '0';
  el.style.width = '1000px';
  el.style.overflow = 'visible';
}

function hideExportElement(el: HTMLDivElement | null) {
  if (!el) return;
  el.style.display = 'none';
}

export function useExportReport() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  const exportPNG = useCallback(async (caseId: string) => {
    const el = exportRef.current;
    if (!el) return;

    setIsExporting(true);
    setExportProgress('Preparing export...');

    try {
      const { html2canvas } = await loadExportLibraries();

      prepareExportElement(el);
      setExportProgress('Loading images...');
      await waitForImages(el, setExportProgress);

      setExportProgress('Loading fonts...');
      await document.fonts.ready;

      setExportProgress('Rendering PNG...');
      const canvas = await html2canvas(el, {
        scale: PNG_SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        // @ts-ignore legacy option
        letterRendering: true,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.querySelector('[data-export-template="true"]') as HTMLElement | null;
          if (clonedEl) {
            clonedEl.style.display = 'block';
            clonedEl.style.width = '1000px';
          }
        },
      });

      setExportProgress('Downloading PNG...');
      const sanitizedId = caseId.replace(/[/\\?%*:|"<>]/g, '-');
      const filename = `Rework_Report_${sanitizedId}.png`;

      // Use toDataURL synchronously to maintain user activation for the 'download' attribute
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('ไม่สามารถ Export PNG ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      hideExportElement(exportRef.current);
      setIsExporting(false);
      setExportProgress('');
    }
  }, []);

  const exportPDF = useCallback(async (caseId: string) => {
    const el = exportRef.current;
    if (!el) return;

    setIsExporting(true);
    setExportProgress('Preparing export...');

    try {
      const { html2canvas, jsPDF } = await loadExportLibraries();

      prepareExportElement(el);
      setExportProgress('Loading images...');
      await waitForImages(el, setExportProgress);

      setExportProgress('Loading fonts...');
      await document.fonts.ready;

      setExportProgress('Rendering PDF...');
      const canvas = await html2canvas(el, {
        scale: PDF_SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        // @ts-ignore legacy option kept for compatibility
        letterRendering: true,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.querySelector('[data-export-template="true"]') as HTMLElement | null;
          if (clonedEl) {
            clonedEl.style.display = 'block';
            clonedEl.style.width = '1000px';
          }
        },
      });

      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const pxPerMm = imgWidthPx / CONTENT_WIDTH_MM;
      const totalHeightMm = imgHeightPx / pxPerMm;
      const pdf = new jsPDF('p', 'mm', 'a4');

      let offsetMm = 0;
      let pageNum = 0;

      setExportProgress('Building PDF pages...');

      while (offsetMm < totalHeightMm) {
        if (pageNum > 0) {
          pdf.addPage();
        }

        const sourceYPx = offsetMm * pxPerMm;
        const sliceHeightPx = Math.min(CONTENT_HEIGHT_MM * pxPerMm, imgHeightPx - sourceYPx);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidthPx;
        pageCanvas.height = sliceHeightPx;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            sourceYPx,
            imgWidthPx,
            sliceHeightPx,
            0,
            0,
            imgWidthPx,
            sliceHeightPx,
          );
        }

        const sliceHeightMm = sliceHeightPx / pxPerMm;
        const pageImgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', PDF_MARGIN_MM, PDF_MARGIN_MM, CONTENT_WIDTH_MM, sliceHeightMm);

        offsetMm += CONTENT_HEIGHT_MM;
        pageNum++;
      }

      setExportProgress('Downloading PDF...');
      const sanitizedId = caseId.replace(/[/\\?%*:|"<>]/g, '-');
      pdf.save(`Rework_Report_${sanitizedId}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('ไม่สามารถ Export PDF ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      hideExportElement(exportRef.current);
      setIsExporting(false);
      setExportProgress('');
    }
  }, []);

  return {
    exportRef,
    isExporting,
    exportProgress,
    exportPNG,
    exportPDF,
  };
}
