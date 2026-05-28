'use client';

import React, { useEffect, useState } from 'react';

import { MainLayout } from '../../components/layout/MainLayout';
import { ConflictModal } from '../../components/modals/ConflictModal';
import { TutorialModal } from '../../components/modals/TutorialModal';
import { UpdateModal } from '../../components/modals/UpdateModal';
import { useSaveProgress } from '../../hooks/useSaveProgress';
import {
  deleteCase,
  fetchAllCases,
  fetchItemMaster,
  insertCase,
  type ReworkCase,
  type ReworkItem,
  saveItemToMaster,
  setGasWebAppUrl,
  updateCase,
} from '../../services/api';
import { getCurrentUser, getToken, logout as authLogout, type User } from '../../services/auth';
import { enforceNumeric, getStatistics, isSaveDisabled, sortCasesByStatus } from '../../utils/helpers';

type Tab = 'overall' | 'add' | 'dashboard';

const initialFormItem: ReworkItem = {
  id: 'form-1',
  itemNumber: '',
  itemName: '',
  itemCode: '',
  batchNo: '',
  packagingDate: '',
  boxNumber: '',
  mold: '',
  line: '',
  amount: 1,
  reason: '',
  reasonSubtype: '',
  responsible: '',
  responsibleSubtype: '',
  details: '',
  imageUrls: [],
  linkedSourceId: '',
  customerName: '',
  lastActiveField: 'itemNumber', // Default priority
  verificationStatus: 'idle',
};

interface ReworkAppProps {
  user: User | null;
  onLogout: () => void;
  onBackToPortal: () => void;
}

export function ReworkApp({ user, onLogout, onBackToPortal }: ReworkAppProps) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<ReworkCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [itemMaster, setItemMaster] = useState<{ itemNumber: string; itemCode: string; itemName: string }[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [caseSource, setCaseSource] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('rework_caseSource');
      if (saved) return saved;
    }
    return 'SFC';
  });
  const [orFiles, setOrFiles] = useState<File[]>([]);
  const [caseNumber, setCaseNumber] = useState<string>('');
  const [formItems, setFormItems] = useState<ReworkItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('rework_formItems');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse saved formItems', e);
        }
      }
    }
    return [{ ...initialFormItem }];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ReworkCase | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [selectionModal, setSelectionModal] = useState<{
    itemId: string;
    type: 'reason' | 'responsible';
    title: string;
    options: string[];
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Record<string, File[]>>({});
  const [autoFillTriggeredItem, setAutoFillTriggeredItem] = useState<string | null>(null);
  const verificationTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});

  const { progress, statusText, isComplete, startSaving, finishSaving, failSaving } = useSaveProgress();

  const GAS_WEB_APP_URL = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();

  useEffect(() => {
    setGasWebAppUrl(GAS_WEB_APP_URL);
    loadMasterData();
    loadCases();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rework_caseSource', caseSource);
    }
  }, [caseSource]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rework_formItems', JSON.stringify(formItems));
    }
  }, [formItems]);

  const loadMasterData = async () => {
    try {
      setIsLoadingMaster(true);
      const result = await fetchItemMaster();
      if (result.success && result.data) {
        setItemMaster(result.data);
      }
    } catch (error) {
      console.error('Error loading master data:', error);
    } finally {
      setIsLoadingMaster(false);
    }
  };

  const loadCases = async () => {
    try {
      setIsLoadingCases(true);
      setCaseError(null);
      const result = await fetchAllCases();
      if (result.success && result.data) {
        setCases(sortCasesByStatus(result.data));
      } else {
        throw new Error(result.error || 'Failed to load cases');
      }
    } catch (error) {
      setCaseError(error instanceof Error ? error.message : 'Failed to load cases');
    } finally {
      setIsLoadingCases(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const addFormItem = () => {
    setFormItems([
      ...formItems,
      {
        ...initialFormItem,
        id: `form-${Date.now()}`,
      },
    ]);
  };

  const removeFormItem = (id: string) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((item) => item.id !== id));
      const newImages = { ...uploadedImages };
      delete newImages[id];
      setUploadedImages(newImages);
      if (verificationTimeouts.current[id]) {
        clearTimeout(verificationTimeouts.current[id]);
        delete verificationTimeouts.current[id];
      }
    }
  };

  const clearAllForm = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลที่กรอกค้างไว้ทั้งหมดใช่หรือไม่? ข้อมูลและไฟล์ที่แนบไว้จะหายไปทั้งหมด')) {
      const resetItems = [{
        ...initialFormItem,
        id: `form-${Date.now()}`,
      }];
      setFormItems(resetItems);
      setCaseSource('SFC');
      setCaseNumber('');
      setUploadedImages({});
      setOrFiles([]);

      // Clear all pending timeouts
      Object.keys(verificationTimeouts.current).forEach(id => {
        clearTimeout(verificationTimeouts.current[id]);
      });
      verificationTimeouts.current = {};

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rework_formItems', JSON.stringify(resetItems));
        sessionStorage.setItem('rework_caseSource', 'SFC');
      }
    }
  };

  const resetFormItem = (id: string) => {
    if (window.confirm('คุณต้องการล้างข้อมูลของรายการนี้ใช่หรือไม่?')) {
      setFormItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...initialFormItem,
              id, // Keep the same ID
            }
            : item
        )
      );
      setUploadedImages((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (verificationTimeouts.current[id]) {
        clearTimeout(verificationTimeouts.current[id]);
        delete verificationTimeouts.current[id];
      }
    }
  };

  const duplicateFormItem = (id: string) => {
    const itemToDuplicate = formItems.find((item) => item.id === id);
    if (!itemToDuplicate) return;

    const duplicatedItem: ReworkItem = {
      ...itemToDuplicate,
      id: `form-${Date.now()}`,
      imageUrls: [],
    };

    const index = formItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      const newItems = [...formItems];
      newItems.splice(index + 1, 0, duplicatedItem);
      setFormItems(newItems);
    } else {
      setFormItems([...formItems, duplicatedItem]);
    }
  };

  const updateFormItem = (id: string, field: string, value: string | number) => {
    if (field === 'itemNumber') {
      const sanitized = String(value).replace(/[<>]/g, '').slice(0, 50);
      setFormItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, itemNumber: sanitized, lastActiveField: 'itemNumber', verificationStatus: 'idle' } : item,
        ),
      );
      triggerDebouncedVerification(id, 'itemNumber', sanitized);
      return;
    }
    setFormItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const normalizedValue =
          field === 'itemCode' || field === 'mold' || field === 'line'
            ? enforceNumeric(String(value)).slice(0, 50)
            : field === 'amount'
              ? Math.max(0, parseInt(String(value)) || 0)
              : value;

        // Track lastActiveField for itemCode as well
        const lastActiveField = field === 'itemCode' ? 'itemCode' : item.lastActiveField;
        const verificationStatus = field === 'itemCode' ? 'idle' : item.verificationStatus;

        return { ...item, [field]: normalizedValue, lastActiveField, verificationStatus };
      }),
    );
    if (field === 'itemCode') {
      triggerDebouncedVerification(id, 'itemCode', enforceNumeric(String(value)));
    }
  };

  const triggerDebouncedVerification = (itemId: string, field: 'itemNumber' | 'itemCode', value: string) => {
    if (verificationTimeouts.current[itemId]) {
      clearTimeout(verificationTimeouts.current[itemId]);
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setFormItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, verificationStatus: 'idle' }
            : item
        )
      );
      return;
    }

    verificationTimeouts.current[itemId] = setTimeout(() => {
      verifySingleItem(itemId, field, trimmed);
    }, 600);
  };

  const performBackgroundMasterUpdate = async (itemId: string, itemNumber: string, itemCode: string, itemName: string) => {
    try {
      const res = await saveItemToMaster(itemNumber, itemCode, itemName);
      if (res.success) {
        setItemMaster((prevMaster) => {
          const updated = [...prevMaster];
          const idx = updated.findIndex(
            (m) =>
              (itemNumber && m.itemNumber === itemNumber) ||
              (itemCode && m.itemCode === itemCode)
          );
          const newItem = { itemNumber, itemCode, itemName };
          if (idx !== -1) {
            updated[idx] = newItem;
          } else {
            updated.push(newItem);
          }
          return updated;
        });

        setFormItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                ...i,
                verificationStatus: 'verified',
              }
              : i
          )
        );
      } else {
        throw new Error(res.error || 'Failed to update master data');
      }
    } catch (err) {
      console.error('Background master update failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isConflict = errMsg.includes('CONFLICT') || String(err).includes('CONFLICT');
      
      if (isConflict) {
        setIsConflictModalOpen(true);
      }

      setFormItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
              ...i,
              verificationStatus: isConflict ? 'conflict' : 'new',
            }
            : i
        )
      );
    }
  };

  const verifySingleItem = async (itemId: string, field: 'itemNumber' | 'itemCode', value: string) => {
    if (!value) return;

    setFormItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, verificationStatus: 'checking' }
          : item
      )
    );

    // 1. Cross-Item Check: Check other items in the current form FIRST
    const existingInForm = formItems.find(i =>
      i.id !== itemId &&
      i.itemName &&
      ((field === 'itemNumber' && i.itemNumber.trim() === value) ||
        (field === 'itemCode' && i.itemCode.trim() === value))
    );

    if (existingInForm) {
      setFormItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
              ...i,
              itemNumber: existingInForm.itemNumber,
              itemCode: existingInForm.itemCode,
              itemName: existingInForm.itemName,
              verificationStatus: 'verified',
              batchNo: existingInForm.batchNo || i.batchNo,
            }
            : i,
        ),
      );
      setAutoFillTriggeredItem(itemId);
      setTimeout(() => setAutoFillTriggeredItem(null), 1500);
      return;
    }

    try {
      const token = getToken();
      const currentUser = getCurrentUser();

      let authProfile = '';
      let authEmail = '';
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const decoded = JSON.parse(atob(payload + '='.repeat((4 - (payload.length % 4)) % 4)));
            authProfile = String(decoded.profile || '').trim().toUpperCase();
            authEmail = String(decoded.sub || '').trim();
          }
        } catch (e) {
          console.error('Failed to parse token in verifySingleItem:', e);
        }
      }

      if (!authProfile && currentUser) {
        authProfile = String(currentUser.role || '').trim().toUpperCase();
      }
      if (!authEmail && currentUser) {
        authEmail = String(currentUser.email || '').trim();
      }

      const response = await fetch('/api/rework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verifyItem',
          itemNumber: field === 'itemNumber' ? value : undefined,
          itemCode: field === 'itemCode' ? value : undefined,
          token,
          authProfile,
          authEmail,
          userRole: currentUser?.role || ''
        }),
      });
      const result = await response.json();

      setFormItems((prev) => {
        const currentItem = prev.find(i => i.id === itemId);
        if (!currentItem) return prev;

        const currentValue = field === 'itemNumber' ? currentItem.itemNumber : currentItem.itemCode;
        if (currentItem.verificationStatus !== 'checking' || currentValue.trim() !== value || currentItem.lastActiveField !== field) {
          return prev; // Ignore stale result
        }

        if (result.success && result.data?.found) {
          // Trigger autofill visual effect
          setTimeout(() => {
            setAutoFillTriggeredItem(itemId);
            setTimeout(() => setAutoFillTriggeredItem(null), 1500);
          }, 0);

          const dbNum = result.data.itemNumber;
          const dbCode = result.data.itemCode;
          const dbName = result.data.itemName;

          const cardNum = currentItem.itemNumber.trim();
          const cardCode = currentItem.itemCode.trim();
          const cardName = currentItem.itemName.trim() || dbName || '';

          // 1. Mismatch check: if user changes a field that conflicts with the database value
          const hasCodeConflict = dbCode && cardCode && dbCode.trim().toLowerCase() !== cardCode.toLowerCase();
          const hasNumConflict = dbNum && cardNum && dbNum.trim().toLowerCase() !== cardNum.toLowerCase();

          if (hasCodeConflict || hasNumConflict || result.data?.conflict === true) {
            setIsConflictModalOpen(true);
            return prev.map((i) =>
              i.id === itemId
                ? {
                  ...i,
                  verificationStatus: 'conflict',
                }
                : i
            );
          }

          const dbNumTrim = (dbNum || '').trim();
          const dbCodeTrim = (dbCode || '').trim();
          const dbNameTrim = (dbName || '').trim();
          const isDbComplete = dbNumTrim && dbCodeTrim && dbNameTrim;

          // If db record exists but is incomplete (lacks code/number) or has a different name
          const hasMissingCode = cardCode && !dbCodeTrim;
          const hasMissingNum = cardNum && !dbNumTrim;
          const hasNameChange = cardName && cardName !== dbNameTrim;

          if (!isDbComplete && (hasMissingCode || hasMissingNum || hasNameChange) && cardNum && cardCode && cardName) {
            setTimeout(() => {
              performBackgroundMasterUpdate(itemId, cardNum, cardCode, cardName);
            }, 0);

            return prev.map((i) =>
              i.id === itemId
                ? {
                  ...i,
                  itemNumber: cardNum,
                  itemCode: cardCode,
                  itemName: cardName,
                  verificationStatus: 'updating',
                }
                : i
            );
          }

          return prev.map((i) =>
            i.id === itemId
              ? {
                ...i,
                itemNumber: dbNum || i.itemNumber,
                itemCode: dbCode || i.itemCode,
                itemName: dbName || i.itemName,
                verificationStatus: 'verified',
              }
              : i,
          );
        } else {
          if (result.error === 'CONFLICT') {
            setIsConflictModalOpen(true);
            return prev.map((i) =>
              i.id === itemId
                ? {
                  ...i,
                  verificationStatus: 'conflict',
                }
                : i
            );
          }

          const trimmedNum = currentItem.itemNumber.trim();
          const trimmedCode = currentItem.itemCode.trim();
          const trimmedName = currentItem.itemName.trim();

          let shouldUpdateMaster = false;
          if (field === 'itemNumber' && trimmedCode) {
            const matchInMaster = itemMaster.find(m => m.itemCode === trimmedCode);
            if (matchInMaster) {
              const isMatchComplete = matchInMaster.itemNumber && matchInMaster.itemCode && matchInMaster.itemName;
              if (!isMatchComplete && (!matchInMaster.itemNumber || matchInMaster.itemNumber !== trimmedNum || matchInMaster.itemName !== trimmedName)) {
                shouldUpdateMaster = true;
              }
            }
          } else if (field === 'itemCode' && trimmedNum) {
            const matchInMaster = itemMaster.find(m => m.itemNumber === trimmedNum);
            if (matchInMaster) {
              const isMatchComplete = matchInMaster.itemNumber && matchInMaster.itemCode && matchInMaster.itemName;
              if (!isMatchComplete && (!matchInMaster.itemCode || matchInMaster.itemCode !== trimmedCode || matchInMaster.itemName !== trimmedName)) {
                shouldUpdateMaster = true;
              }
            }
          }

          if (shouldUpdateMaster && trimmedNum && trimmedCode && trimmedName) {
            setTimeout(() => {
              performBackgroundMasterUpdate(itemId, trimmedNum, trimmedCode, trimmedName);
            }, 0);

            return prev.map((i) =>
              i.id === itemId
                ? {
                  ...i,
                  verificationStatus: 'updating',
                }
                : i
            );
          }

          return prev.map((i) =>
            i.id === itemId
              ? {
                ...i,
                verificationStatus: (field === 'itemCode' && i.itemName && i.itemNumber) ? 'verified' : 'new',
              }
              : i,
          );
        }
      });
    } catch (error) {
      console.error('Error verifying item:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      const isConflict = errMsg.includes('CONFLICT') || String(error).includes('CONFLICT');

      if (isConflict) {
        setFormItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                ...i,
                verificationStatus: 'conflict',
              }
              : i
          )
        );
        return;
      }

      const masterInfo = itemMaster.find(
        (m) => (field === 'itemNumber' && m.itemNumber === value) || (field === 'itemCode' && m.itemCode === value),
      );
      setFormItems((prev) => {
        const currentItem = prev.find(i => i.id === itemId);
        if (!currentItem) return prev;

        const currentValue = field === 'itemNumber' ? currentItem.itemNumber : currentItem.itemCode;
        if (currentItem.verificationStatus !== 'checking' || currentValue.trim() !== value) {
          return prev; // Ignore stale result
        }

        if (masterInfo) {
          const dbNum = masterInfo.itemNumber;
          const dbCode = masterInfo.itemCode;
          const dbName = masterInfo.itemName;

          const cardNum = currentItem.itemNumber.trim();
          const cardCode = currentItem.itemCode.trim();
          const cardName = currentItem.itemName.trim() || dbName || '';

          const hasCodeConflict = dbCode && cardCode && dbCode.trim().toLowerCase() !== cardCode.toLowerCase();
          const hasNumConflict = dbNum && cardNum && dbNum.trim().toLowerCase() !== cardNum.toLowerCase();

          if (hasCodeConflict || hasNumConflict) {
            setIsConflictModalOpen(true);
            return prev.map((i) =>
              i.id === itemId
                ? {
                  ...i,
                  verificationStatus: 'conflict',
                }
                : i
            );
          }

          const dbNumTrim = (dbNum || '').trim();
          const dbCodeTrim = (dbCode || '').trim();
          const dbNameTrim = (dbName || '').trim();
          const isDbComplete = dbNumTrim && dbCodeTrim && dbNameTrim;

          const hasMissingCode = cardCode && !dbCodeTrim;
          const hasMissingNum = cardNum && !dbNumTrim;
          const hasNameChange = cardName && cardName !== dbNameTrim;

          if (!isDbComplete && (hasMissingCode || hasMissingNum || hasNameChange) && cardNum && cardCode && cardName) {
            setTimeout(() => {
              performBackgroundMasterUpdate(itemId, cardNum, cardCode, cardName);
            }, 0);

            return prev.map((i) =>
              i.id === itemId
                ? {
                  ...i,
                  itemNumber: cardNum,
                  itemCode: cardCode,
                  itemName: cardName,
                  verificationStatus: 'updating',
                }
                : i
            );
          }

          return prev.map((i) =>
            i.id === itemId
              ? {
                ...i,
                itemName: masterInfo.itemName,
                itemCode: masterInfo.itemCode,
                itemNumber: masterInfo.itemNumber,
                verificationStatus: 'verified',
              }
              : i,
          );
        } else {
          return prev.map((i) =>
            i.id === itemId
              ? {
                ...i,
                verificationStatus: (field === 'itemCode' && i.itemName && i.itemNumber) ? 'verified' : 'new',
              }
              : i,
          );
        }
      });
    }
  };

  const handleCheckItem = (itemId: string, field: 'itemNumber' | 'itemCode') => {
    if (verificationTimeouts.current[itemId]) {
      clearTimeout(verificationTimeouts.current[itemId]);
    }

    const item = formItems.find(i => i.id === itemId);
    if (!item) return;

    const value = field === 'itemNumber' ? item.itemNumber : item.itemCode;
    verifySingleItem(itemId, field, value.trim());
  };

  const handleSubmit = async () => {
    const itemsWithImageCount = formItems.map(item => ({
      ...item,
      imageCount: (uploadedImages[item.id] || []).length
    }));

    if (isSaveDisabled(itemsWithImageCount)) {
      alert('กรุณากรอกข้อมูลสินค้าให้ครบถ้วนและถูกต้อง (ต้องระบุรหัสสินค้า, บาร์โค้ด, ชื่อสินค้า และแนบรูปภาพอย่างน้อย 1 รูป)');
      return;
    }
    try {
      // Compose Case ID from prefix + number + year
      const trimmedNumber = caseNumber.trim();
      if (!trimmedNumber) {
        alert('กรุณากรอกหมายเลขเคส (Running Number)');
        return;
      }
      const prefix = caseSource === 'Customer' ? 'RT' : 'RW';
      const currentYear = new Date().getFullYear();
      const composedCaseId = `${prefix}${trimmedNumber}-${currentYear}`;

      // Duplicate Case ID check against loaded cases
      const isDuplicate = cases.some(c => c.id === composedCaseId);
      if (isDuplicate) {
        alert(`หมายเลขเคส "${composedCaseId}" มีอยู่ในระบบแล้ว กรุณาใช้หมายเลขอื่น`);
        return;
      }

      setIsSaving(true);
      startSaving();
      const newItemsToSave = formItems.filter((item) => {
        const trimmedNum = item.itemNumber.trim();
        const trimmedCode = item.itemCode.trim();
        if (!trimmedNum && !trimmedCode) return false;

        const existing = itemMaster.find(
          (m) => (trimmedNum && m.itemNumber === trimmedNum) || (trimmedCode && m.itemCode === trimmedCode),
        );

        if (!existing) return true;

        // Save/update if we have a code now but didn't before, or if the name changed, or we have a number now but didn't before
        const hasNewCode = trimmedCode && !existing.itemCode;
        const hasNewNumber = trimmedNum && !existing.itemNumber;
        const nameChanged = item.itemName.trim() && item.itemName.trim() !== existing.itemName;
        return hasNewCode || hasNewNumber || nameChanged;
      });

      for (const item of newItemsToSave) {
        const res = await saveItemToMaster(item.itemNumber.trim(), item.itemCode, item.itemName);
        if (!res.success) {
          throw new Error(res.error || `ไม่สามารถบันทึกข้อมูลสินค้า ${item.itemNumber} ลงในฐานข้อมูลกลางได้`);
        }
      }
      const result = await insertCase(caseSource, formItems, uploadedImages, orFiles, composedCaseId);
      if (result.success) {
        finishSaving();
        setSaveMessage({ type: 'success', text: 'บันทึกสำเร็จ' });
        setFormItems([{ ...initialFormItem }]);
        setCaseNumber('');
        setUploadedImages({});
        setOrFiles([]);
        await loadCases();
        await loadMasterData(); // Refresh local cache with the newly updated item code
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        failSaving();
        setSaveMessage({
          type: 'error',
          text: result.error || 'ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง',
        });
      }
    } catch (error) {
      failSaving();
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCase = async (
    caseId: string,
    updates: Partial<ReworkCase> & { deleteItemIds?: string[]; newOrFiles?: File[] }
  ) => {
    try {
      setIsModalLoading(true);
      const result = await updateCase(caseId, updates);
      if (result.success) {
        setCases((prevCases) =>
          prevCases.map((c) => {
            if (c.id === caseId) {
              const { newOrFiles, deleteItemIds, ...cleanUpdates } = updates;
              const updatedCase = { ...c, ...cleanUpdates };

              if (cleanUpdates.items || deleteItemIds) {
                let updatedItems = cleanUpdates.items ? [...cleanUpdates.items] : [...c.items];
                if (deleteItemIds && deleteItemIds.length > 0) {
                  updatedItems = updatedItems.filter((item) => !deleteItemIds.includes(item.uid || item.id));
                }
                updatedCase.items = updatedItems;
              }
              return updatedCase;
            }
            return c;
          }),
        );

        setIsModalOpen(false);
        loadCases();
      } else {
        console.error('Update failed:', result.error);
        alert(`บันทึกไม่สำเร็จ: ${result.error}`);
      }
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      setIsModalLoading(true);
      const result = await deleteCase(caseId);
      if (result.success) {
        setCases(cases.filter((c) => c.id !== caseId));
        setIsModalOpen(false);
        setSelectedCase(null);
        alert('ลบรายการเรียบร้อยแล้ว');
      } else {
        alert(`ไม่สามารถลบรายการได้: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`เกิดข้อผิดพลาดในการลบ: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsModalLoading(false);
    }
  };

  return (
    <>
      <MainLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onBackToPortal={onBackToPortal}
        userName={user?.name || ''}
        userRole={user?.role || ''}
        cases={cases}
        isLoadingCases={isLoadingCases}
        caseError={caseError}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loadCases={loadCases}
        openUpdateModal={(c) => {
          setSelectedCase(c);
          setIsModalOpen(true);
        }}
        stats={getStatistics(cases)}
        caseSource={caseSource}
        setCaseSource={setCaseSource}
        caseNumber={caseNumber}
        setCaseNumber={setCaseNumber}
        existingCaseIds={cases.map(c => c.id)}
        formItems={formItems}
        addFormItem={addFormItem}
        removeFormItem={removeFormItem}
        resetFormItem={resetFormItem}
        clearAllForm={clearAllForm}
        duplicateFormItem={duplicateFormItem}
        updateFormItem={updateFormItem}
        handleImagesSelected={(id, files) => setUploadedImages((prev) => ({ ...prev, [id]: files }))}
        uploadedImages={uploadedImages}
        orFiles={orFiles}
        setOrFiles={setOrFiles}
        handleCheckItem={handleCheckItem}
        handleSubmit={handleSubmit}
        isSaving={isSaving}
        progress={progress}
        statusText={statusText}
        isComplete={isComplete}
        saveMessage={saveMessage}
        isSaveDisabled={(items) => isSaveDisabled(items.map(i => ({
          ...i,
          imageCount: (uploadedImages[i.id] || []).length
        })))}
        autoFillTriggeredItem={autoFillTriggeredItem}
        isLoadingMaster={isLoadingMaster}
        selectionModal={selectionModal}
        setSelectionModal={setSelectionModal}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      <UpdateModal
        isOpen={isModalOpen}
        caseData={selectedCase}
        isLoading={isModalLoading}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCase(null);
        }}
        onUpdate={handleUpdateCase}
        onDelete={handleDeleteCase}
      />

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <ConflictModal isOpen={isConflictModalOpen} onClose={() => setIsConflictModalOpen(false)} />
    </>
  );
}
