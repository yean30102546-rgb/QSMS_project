import { useCallback, useRef, useState } from 'react';
import React from 'react';

import { fetchImageDataUrl } from '../services/api';
import { toCorsProxyUrl, toDisplayImageUrl } from '../utils/imageUrls';
import { ReworkCase } from '../services/api';

const PNG_SCALE = 2;
const PDF_SCALE = 2;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 10;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;

async function loadExportLibraries() {
  const [{ jsPDF }, htmlToImage, XLSX] = await Promise.all([
    import('jspdf'),
    import('html-to-image'),
    import('xlsx')
  ]);

  return { jsPDF, htmlToImage, XLSX };
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

  return displayUrl; // fallback to URL if all base64 conversion fails
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

// Helper to preload images for React-PDF
async function preloadImagesForCaseData(caseData: ReworkCase, onProgress?: (msg: string) => void): Promise<ReworkCase> {
  const clonedData = JSON.parse(JSON.stringify(caseData)) as ReworkCase;
  let totalImages = 0;
  let loadedImages = 0;

  clonedData.items.forEach(item => {
    if (item.imageUrls) totalImages += item.imageUrls.length;
  });

  const updateProgress = () => {
    if (onProgress) {
      onProgress(`Loading PDF images... (${loadedImages}/${totalImages})`);
    }
  };
  
  updateProgress();

  for (const item of clonedData.items) {
    if (item.imageUrls && item.imageUrls.length > 0) {
      const base64Urls = await Promise.all(
        item.imageUrls.map(async (url) => {
          try {
            const base64 = await fetchImageAsBase64(url);
            loadedImages++;
            updateProgress();
            return base64;
          } catch (error) {
            console.error('Error preloading image:', error);
            loadedImages++;
            updateProgress();
            return url; // fallback to original
          }
        })
      );
      item.imageUrls = base64Urls;
    }
  }

  return clonedData;
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
      const { htmlToImage } = await loadExportLibraries();

      prepareExportElement(el);
      setExportProgress('Loading images...');
      await waitForImages(el, setExportProgress);

      setExportProgress('Loading fonts...');
      await document.fonts.ready;

      setExportProgress('Rendering PNG...');
      
      const clonedEl = el.querySelector('[data-export-template="true"]') as HTMLElement | null;
      if (clonedEl) {
        clonedEl.style.display = 'block';
        clonedEl.style.width = '1000px';
      }

      const dataUrl = await htmlToImage.toPng(el, {
        pixelRatio: PNG_SCALE,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      if (clonedEl) {
        clonedEl.style.display = '';
        clonedEl.style.width = '';
      }

      setExportProgress('Downloading PNG...');
      const sanitizedId = caseId.replace(/[\/\\?%*:|"<>]/g, '-');
      const filename = `Rework_Report_${sanitizedId}.png`;

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

  const exportPDF = useCallback(async (caseData: ReworkCase) => {
    setIsExporting(true);
    setExportProgress('Preparing PDF...');

    try {
      // Preload images into Base64 to ensure reliable PDF rendering
      const preloadedCaseData = await preloadImagesForCaseData(caseData, setExportProgress);

      setExportProgress('Rendering PDF...');
      
      const { pdf } = await import('@react-pdf/renderer');
      const { ExportPDFTemplate } = await import('../components/ui/ExportPDFTemplate');
      
      const blob = await pdf(React.createElement(ExportPDFTemplate, { caseData: preloadedCaseData }) as React.ReactElement<any>).toBlob();
      
      setExportProgress('Downloading PDF...');
      const sanitizedId = caseData.id.replace(/[/\\?%*:|"<>]/g, '-');
      const filename = `Rework_Report_${sanitizedId}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('ไม่สามารถ Export PDF ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  }, []);

  const exportExcel = useCallback(async (caseData: ReworkCase) => {
    setIsExporting(true);
    setExportProgress('Preparing Excel...');

    try {
      const { XLSX } = await loadExportLibraries();

      // Transform caseData into a flat structure for Excel
      const rows = caseData.items.map(item => ({
        'Case ID': caseData.id,
        'Case Name': caseData.caseName || '',
        'Source': caseData.source,
        'Date': caseData.date,
        'Status': caseData.status,
        'Item Number': item.itemNumber,
        'Item Code': item.itemCode,
        'Item Name': item.itemName,
        'Amount': item.amount,
        'Customer Name': item.customerName || '',
        'Reason': item.reason,
        'Reason Subtype': item.reasonSubtype || '',
        'Responsible': item.responsible || '',
        'Responsible Subtype': item.responsibleSubtype || '',
        'Details': item.details || ''
      }));

      // If no items, still export case info
      if (rows.length === 0) {
        rows.push({
          'Case ID': caseData.id,
          'Case Name': caseData.caseName || '',
          'Source': caseData.source,
          'Date': caseData.date,
          'Status': caseData.status,
          'Item Number': '',
          'Item Code': '',
          'Item Name': '',
          'Amount': 0,
          'Customer Name': '',
          'Reason': '',
          'Reason Subtype': '',
          'Responsible': '',
          'Responsible Subtype': '',
          'Details': ''
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rework Items');

      setExportProgress('Downloading Excel...');
      const sanitizedId = caseData.id.replace(/[\/\\?%*:|"<>]/g, '-');
      const filename = `Rework_Report_${sanitizedId}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('ไม่สามารถ Export Excel ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
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
    exportExcel,
  };
}
