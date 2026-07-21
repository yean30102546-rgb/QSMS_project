import { useCallback, useRef, useState } from 'react';
import React from 'react';

import { fetchImageDataUrl } from '../services/api';
import { toCorsProxyUrl, toDisplayImageUrl, toInternalProxyUrl } from '../utils/imageUrls';
import { ReworkCase } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';


async function loadExportLibraries() {
  const exceljsModule = await import('exceljs');
  const ExcelJS = exceljsModule?.default || (exceljsModule as any)?.ExcelJS || exceljsModule;
  
  return { ExcelJS };
}

const IMAGE_TIMEOUT_MS = 5000; // 5 seconds per image

async function fetchImageAsBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;

  const decodedUrl = url.includes('corsproxy.io/?')
    ? decodeURIComponent(url.split('corsproxy.io/?')[1] || '')
    : url;

  // Handle local public paths (like /images/foo.png) by fetching them relative to current origin
  if (decodedUrl.startsWith('/') || decodedUrl.startsWith('./')) {
    try {
      const response = await fetch(decodedUrl);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn(`Local fetch failed for ${decodedUrl}:`, err);
      return decodedUrl;
    }
  }

  // Don't try to fetch invalid non-http paths through proxy
  if (!decodedUrl.startsWith('http')) {
    return decodedUrl;
  }

  const displayUrl = toDisplayImageUrl(decodedUrl, 1600);
  const urlsToTry = [toInternalProxyUrl(displayUrl), displayUrl, toCorsProxyUrl(displayUrl)];

  try {
    // Add a timeout to the API fetch
    const fetchPromise = fetchImageDataUrl(decodedUrl);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Image fetch timeout')), IMAGE_TIMEOUT_MS)
    );
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    if (result && result.startsWith('data:')) {
      return result;
    } else {
      console.warn(`API image fetch returned a raw URL, falling back to Blob download: ${result}`);
      throw new Error('API fetch did not return base64');
    }
  } catch (err) {
    console.warn(`API image fetch failed for ${decodedUrl}:`, err);
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


export function useExportReport() {
  const { showAlert } = useNotification();
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');


  const exportExcel = useCallback(async (caseData: ReworkCase) => {
    setIsExporting(true);
    setExportProgress('Preparing Excel...');

    try {
      const { ExcelJS } = await loadExportLibraries();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rework Items', {
        pageSetup: { paperSize: 9, orientation: 'landscape' }
      });

      // Define columns
      worksheet.columns = [
        { header: 'Case ID', key: 'caseId', width: 15 },
        { header: 'Case Name', key: 'caseName', width: 20 },
        { header: 'Source', key: 'source', width: 15 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Item Number', key: 'itemNumber', width: 20 },
        { header: 'Item Code', key: 'itemCode', width: 15 },
        { header: 'Item Name', key: 'itemName', width: 30 },
        { header: 'Amount', key: 'amount', width: 10 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Reason', key: 'reason', width: 20 },
        { header: 'Reason Subtype', key: 'reasonSubtype', width: 15 },
        { header: 'Responsible', key: 'responsible', width: 20 },
        { header: 'Responsible Subtype', key: 'responsibleSubtype', width: 15 },
        { header: 'Details', key: 'details', width: 30 },
        { header: 'Missing Boxes', key: 'missingBoxes', width: 15 },
        { header: 'Missing Gallons', key: 'missingGallons', width: 15 },
        { header: 'Missing Oil (L)', key: 'missingOil', width: 15 },
        { header: 'Images', key: 'images', width: 60 }
      ];

      // Style header
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Make sure there is at least one item, otherwise push a blank row for the case
      const items = caseData.items && caseData.items.length > 0 
        ? caseData.items 
        : [{ itemNumber: '', itemCode: '', itemName: '', amount: 0, customerName: '', reason: '', reasonSubtype: '', responsible: '', responsibleSubtype: '', details: '', imageUrls: [] as string[] }];

      let rowNumber = 2; // Starting after header

      for (const item of items) {
        worksheet.addRow({
          caseId: caseData.id,
          caseName: caseData.caseName || '',
          source: caseData.source,
          date: caseData.date,
          status: caseData.status,
          itemNumber: item.itemNumber || '',
          itemCode: item.itemCode || '',
          itemName: item.itemName || '',
          amount: item.amount || 0,
          customerName: item.customerName || '',
          reason: item.reason || '',
          reasonSubtype: item.reasonSubtype || '',
          responsible: item.responsible || '',
          responsibleSubtype: item.responsibleSubtype || '',
          details: item.details || '',
          missingBoxes: caseData.missingBoxes || 0,
          missingGallons: caseData.missingGallons || 0,
          missingOil: caseData.missingOil || 0
        });

        const currentRow = worksheet.getRow(rowNumber);
        currentRow.alignment = { vertical: 'middle', wrapText: true };

        // Process images
        if (item.imageUrls && item.imageUrls.length > 0) {
          currentRow.height = 120; // Set taller row height to accommodate images
          
          let colOffset = 18; // Image column is index 18 (0-indexed logic)
          
          setExportProgress(`Loading images for Excel (Row ${rowNumber - 1})...`);
          
          for (let i = 0; i < Math.min(item.imageUrls.length, 3); i++) {
            const url = item.imageUrls[i];
            try {
              let base64 = await fetchImageAsBase64(url);
              
              if (!base64.startsWith('data:')) {
                console.warn('Could not convert image to base64, skipping Excel embed:', url);
                continue;
              }
              
              let extension = 'png';
              let base64Data = base64;
              
              const match = base64.match(/data:(.*?);base64,(.*)/);
              if (match) {
                 const mimeType = match[1].toLowerCase();
                 extension = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpeg' : mimeType.includes('gif') ? 'gif' : 'png';
                 base64Data = match[2];
              } else {
                console.warn('Invalid base64 data format:', url);
                continue;
              }

              const imageId = workbook.addImage({
                base64: base64Data,
                extension: extension as 'png'|'jpeg'|'gif',
              });

              // Calculate image placement within the cell
              // Instead of overlapping, we use a simple horizontal offset approach inside the Image column
              // In ExcelJS, an image can span cells or just float. To float it nicely, we use fractions.
              worksheet.addImage(imageId, {
                tl: { col: colOffset + (i * 1.8), row: rowNumber - 1 + 0.1 }, 
                ext: { width: 100, height: 100 }
              });
              
            } catch (error) {
              console.error('Failed to load image for Excel export', error);
            }
          }
        } else {
          currentRow.height = 30;
        }
        
        rowNumber++;
      }

      setExportProgress('Downloading Excel...');
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const sanitizedId = caseData.id.replace(/[\\/\\\\?%*:|"<>]/g, '-');
      const filename = `Rework_Report_${sanitizedId}.xlsx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Excel export failed:', error);
      showAlert('ไม่สามารถ Export Excel ได้ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  }, []);

  return {
    exportRef,
    isExporting,
    exportProgress,
    exportExcel,
  };
}
