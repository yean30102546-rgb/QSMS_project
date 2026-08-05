import { useState, useRef, useEffect, useCallback } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';

export interface UploadInitialData {
  type?: 'drawing' | 'master';
  drawing_number?: string;
  revision?: string;
  part_name?: string;
  customer_name?: string;
  item_code?: string;
  item_number?: string;
  issue_date?: string;
  package_size?: string;
  oil_group?: string;
  pallet_type?: string;
  boxes_per_pallet?: string;
  shelf_life?: string;
}

export interface UploadItem {
  id: string;
  file: File;
  base64: string;
  previewUrl?: string;
  status: 'pending' | 'parsing' | 'ready' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  lowConfidenceFields?: string[];
  formData: {
    drawing_number: string;
    revision: string;
    part_name: string;
    customer_name: string;
    item_code: string;
    item_number: string;
    issue_date: string;
    package_size: string;
    oil_group: string;
    pallet_type: string;
    boxes_per_pallet: string;
    shelf_life: string;
    type: 'drawing' | 'master';
  };
}

export function useUploadQueue(initialData?: UploadInitialData) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [aiModel, setAiModel] = useState<string>('gemini-3.1-flash');
  
  const [isQuotaPaused, setIsQuotaPaused] = useState(false);
  const [quotaCountdown, setQuotaCountdown] = useState(0);
  
  const { showToast } = useNotification();
  
  // Ref to track if processing was cancelled by user
  const isCancelledRef = useRef(false);

  const triggerAiParsing = async (id: string, base64Data: string, currentModel: string): Promise<{ success: boolean; isQuotaError: boolean }> => {
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse_drawing',
          base64Data,
          aiModel: currentModel
        })
      });
      const data = await res.json();

      if (data.success && data.data) {
        const metadata = data.data;
        setItems(prev => prev.map(i => {
          if (i.id === id) {
            return {
              ...i,
              status: 'ready',
              lowConfidenceFields: metadata.low_confidence_fields || [],
              formData: {
                ...i.formData,
                type: (metadata.document_type?.toLowerCase() as 'drawing' | 'master') || i.formData.type,
                drawing_number: metadata.drawing_number || i.formData.drawing_number,
                revision: metadata.revision || i.formData.revision,
                part_name: metadata.part_name || i.formData.part_name,
                customer_name: metadata.customer_name || i.formData.customer_name,
                item_code: metadata.item_code || i.formData.item_code,
                item_number: metadata.item_number || i.formData.item_number,
                issue_date: metadata.issue_date || i.formData.issue_date,
                package_size: metadata.package_size || i.formData.package_size,
                oil_group: metadata.oil_group || i.formData.oil_group,
                pallet_type: metadata.pallet_type || i.formData.pallet_type,
                boxes_per_pallet: metadata.boxes_per_pallet || i.formData.boxes_per_pallet,
                shelf_life: metadata.shelf_life || i.formData.shelf_life,
              }
            };
          }
          return i;
        }));
        return { success: true, isQuotaError: false };
      } else {
        const isQuotaError = !!(data.error && (
          data.error.includes('ติดลิมิต') || 
          data.error.includes('RESOURCE_EXHAUSTED') || 
          data.error.includes('429') ||
          data.error.includes('503') ||
          data.error.includes('404')
        ));
        setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'ready', errorMessage: data.error } : i));
        
        if (isQuotaError && !isCancelledRef.current) {
          showToast(data.error || 'AI Quota limit or Service error reached.', 'error');
        } else if (data.error && !isCancelledRef.current) {
          showToast(data.error, 'error');
        }
        return { success: false, isQuotaError };
      }
    } catch (err: unknown) {
      console.error('Error calling parse_drawing API:', err);
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'error', errorMessage: 'AI parsing failed' } : i));
      if (!isCancelledRef.current) showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาลองใหม่', 'error');
      return { success: false, isQuotaError: false };
    }
  };

  const processSequentially = useCallback(async (newItems: UploadItem[], currentModel: string) => {
    setIsQuotaPaused(false);
    setQuotaCountdown(0);
    
    for (const item of newItems) {
      if (isCancelledRef.current) break; // Circuit breaker if user cancels
      
      const result = await triggerAiParsing(item.id, item.base64, currentModel);
      
      if (result.isQuotaError) {
        setIsQuotaPaused(true);
        setQuotaCountdown(60);
        
        setItems(currentItems => currentItems.map(i => {
          if (i.status === 'parsing') {
            return { ...i, status: 'ready', errorMessage: 'Quota paused' };
          }
          return i;
        }));
        break; 
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }, []);

  const resumePausedParsing = async () => {
    isCancelledRef.current = false;
    setIsQuotaPaused(false);
    setQuotaCountdown(0);
    
    let pausedItems: UploadItem[] = [];
    setItems(current => {
      pausedItems = current.filter(i => i.status === 'ready' && i.errorMessage === 'Quota paused');
      return current.map(i => pausedItems.some(p => p.id === i.id) ? { ...i, status: 'parsing', errorMessage: undefined } : i);
    });
    
    if (pausedItems.length === 0) return;
    
    await processSequentially(pausedItems, aiModel);
  };

  useEffect(() => {
    if (!isQuotaPaused) return;
    
    if (quotaCountdown > 0) {
      const timer = setTimeout(() => {
        if (!isCancelledRef.current) setQuotaCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!isCancelledRef.current) {
      resumePausedParsing();
    }
  }, [isQuotaPaused, quotaCountdown]);

  const toBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const addFiles = async (filesArray: File[]) => {
    if (filesArray.length === 0) return;
    
    isCancelledRef.current = false;

    const newItems: UploadItem[] = [];

    for (const file of filesArray) {
      if (file.type !== 'application/pdf') {
        showToast(`Skipped ${file.name} - Not a PDF`, 'warning');
        continue;
      }

      const id = Math.random().toString(36).substring(7);
      const b64 = await toBase64(file);
      const base64Data = b64.split(',')[1];
      
      const match = file.name.match(/^([a-zA-Z0-9-]+)_([a-zA-Z0-9-]+)_rev\.([a-zA-Z0-9.-]+)_(M|D)_(.+)\.pdf$/i);
      
      let initialType: 'drawing' | 'master' = 'drawing';
      if (initialData?.type) {
        initialType = initialData.type;
      } else if (match && match[4]) {
        initialType = match[4].toUpperCase() === 'M' ? 'master' : 'drawing';
      }

      const previewUrl = URL.createObjectURL(file);

      if (match) {
        newItems.push({
          id, file, base64: base64Data, previewUrl, status: 'parsing',
          formData: {
            drawing_number: match[1],
            item_code: initialType === 'master' ? '' : match[2],
            item_number: initialType === 'master' ? match[2] : '',
            revision: match[3],
            type: initialType,
            part_name: match[5].replace(/_/g, ' ').trim(),
            customer_name: initialData?.customer_name || match[5].split(/[ _-]/)[0] || '',
            issue_date: initialData?.issue_date || '',
            package_size: initialData?.package_size || '',
            oil_group: initialData?.oil_group || '',
            pallet_type: initialData?.pallet_type || '',
            boxes_per_pallet: initialData?.boxes_per_pallet || '',
            shelf_life: initialData?.shelf_life || ''
          }
        });
      } else {
        newItems.push({
          id, file, base64: base64Data, previewUrl, status: 'parsing',
          formData: {
            drawing_number: initialData?.drawing_number || '',
            revision: initialData?.revision || '',
            part_name: initialData?.part_name || '',
            customer_name: initialData?.customer_name || '',
            item_code: initialData?.item_code || '',
            item_number: initialData?.item_number || '',
            issue_date: initialData?.issue_date || '',
            package_size: initialData?.package_size || '',
            oil_group: initialData?.oil_group || '',
            pallet_type: initialData?.pallet_type || '',
            boxes_per_pallet: initialData?.boxes_per_pallet || '',
            shelf_life: initialData?.shelf_life || '',
            type: initialType,
          }
        });
      }
    }

    setItems(prev => [...prev, ...newItems]);
    processSequentially(newItems, aiModel);
  };

  const cancelQueue = () => {
    isCancelledRef.current = true;
    setIsQuotaPaused(false);
    setQuotaCountdown(0);
    setItems(currentItems => currentItems.map(i => {
      if (i.status === 'parsing') {
        return { ...i, status: 'ready', errorMessage: 'Cancelled' };
      }
      return i;
    }));
    showToast('การประมวลผลพื้นหลังถูกยกเลิกแล้ว', 'info');
  };

  const clearCompleted = () => {
    setItems(prev => prev.filter(i => i.status !== 'success'));
  };

  const clearAll = () => {
    cancelQueue();
    setItems([]);
  };

  return {
    items,
    setItems,
    isUploading,
    setIsUploading,
    aiModel,
    setAiModel,
    isQuotaPaused,
    setIsQuotaPaused,
    quotaCountdown,
    setQuotaCountdown,
    addFiles,
    cancelQueue,
    clearCompleted,
    clearAll,
    resumePausedParsing,
    triggerAiParsing
  };
}
