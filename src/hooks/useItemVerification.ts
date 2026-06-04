import { useCallback, useRef } from 'react';
import { UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { getToken, getCurrentUser } from '../services/auth';
import { saveItemToMaster } from '../services/api';
import { useReworkData } from '../contexts/ReworkDataContext';
import { ReworkItem } from '../services/api';

interface UseItemVerificationProps {
  onConflict: () => void;
  onAutofillTriggered: (itemId: string) => void;
  getValues: UseFormGetValues<any>;
  setValue: UseFormSetValue<any>;
}

export function useItemVerification({ onConflict, onAutofillTriggered, getValues, setValue }: UseItemVerificationProps) {
  const { itemMaster, loadMasterData } = useReworkData();
  const verificationTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const performBackgroundMasterUpdate = useCallback(async (
    itemId: string, 
    itemIndex: number,
    itemNumber: string, 
    itemCode: string, 
    itemName: string
  ) => {
    try {
      const res = await saveItemToMaster(itemNumber, itemCode, itemName);
      if (res.success) {
        // Also refresh the global item master context quietly
        loadMasterData();
        setValue(`items.${itemIndex}.verificationStatus`, 'verified', { shouldDirty: true });
      } else {
        throw new Error(res.error || 'Failed to update master data');
      }
    } catch (err) {
      console.error('Background master update failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isConflict = errMsg.includes('CONFLICT') || String(err).includes('CONFLICT');
      
      if (isConflict) {
        onConflict();
      }

      setValue(`items.${itemIndex}.verificationStatus`, isConflict ? 'conflict' : 'new', { shouldDirty: true });
    }
  }, [loadMasterData, onConflict, setValue]);

  const verifySingleItem = useCallback(async (
    itemId: string, 
    itemIndex: number, 
    field: 'itemNumber' | 'itemCode', 
    value: string
  ) => {
    if (!value) return;

    setValue(`items.${itemIndex}.verificationStatus`, 'checking');

    // 1. Cross-Item Check FIRST
    const allItems = getValues('items') as ReworkItem[];
    const existingInForm = allItems.find((i, idx) =>
      idx !== itemIndex &&
      i.itemName &&
      ((field === 'itemNumber' && i.itemNumber.trim() === value) ||
        (field === 'itemCode' && i.itemCode.trim() === value))
    );

    if (existingInForm) {
      setValue(`items.${itemIndex}.itemNumber`, existingInForm.itemNumber);
      setValue(`items.${itemIndex}.itemCode`, existingInForm.itemCode);
      setValue(`items.${itemIndex}.itemName`, existingInForm.itemName);
      setValue(`items.${itemIndex}.verificationStatus`, 'verified');
      setValue(`items.${itemIndex}.batchNo`, existingInForm.batchNo || allItems[itemIndex].batchNo);
      
      onAutofillTriggered(itemId);
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
          console.error('Failed to parse token:', e);
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

      // Get freshest values before applying results
      const currentItems = getValues('items') as ReworkItem[];
      const currentItem = currentItems[itemIndex];
      if (!currentItem) return;

      const currentValue = field === 'itemNumber' ? currentItem.itemNumber : currentItem.itemCode;
      
      // Ignore stale result if user changed input while fetching
      if (currentItem.verificationStatus !== 'checking' || currentValue.trim() !== value || currentItem.lastActiveField !== field) {
        return;
      }

      if (result.success && result.data?.found) {
        onAutofillTriggered(itemId);

        const dbNum = result.data.itemNumber;
        const dbCode = result.data.itemCode;
        const dbName = result.data.itemName;

        const cardNum = currentItem.itemNumber.trim();
        const cardCode = currentItem.itemCode.trim();
        const cardName = currentItem.itemName.trim() || dbName || '';

        // Mismatch check
        const hasCodeConflict = dbCode && cardCode && dbCode.trim().toLowerCase() !== cardCode.toLowerCase();
        const hasNumConflict = dbNum && cardNum && dbNum.trim().toLowerCase() !== cardNum.toLowerCase();

        if (hasCodeConflict || hasNumConflict || result.data?.conflict === true) {
          onConflict();
          setValue(`items.${itemIndex}.verificationStatus`, 'conflict');
          return;
        }

        const dbNumTrim = (dbNum || '').trim();
        const dbCodeTrim = (dbCode || '').trim();
        const dbNameTrim = (dbName || '').trim();
        const isDbComplete = dbNumTrim && dbCodeTrim && dbNameTrim;

        const hasMissingCode = cardCode && !dbCodeTrim;
        const hasMissingNum = cardNum && !dbNumTrim;
        const hasNameChange = cardName && cardName !== dbNameTrim;

        if (!isDbComplete && (hasMissingCode || hasMissingNum || hasNameChange) && cardNum && cardCode && cardName) {
          // Fire and forget
          performBackgroundMasterUpdate(itemId, itemIndex, cardNum, cardCode, cardName);
          
          setValue(`items.${itemIndex}.itemNumber`, cardNum);
          setValue(`items.${itemIndex}.itemCode`, cardCode);
          setValue(`items.${itemIndex}.itemName`, cardName);
          setValue(`items.${itemIndex}.verificationStatus`, 'updating');
          return;
        }

        setValue(`items.${itemIndex}.itemNumber`, dbNum || currentItem.itemNumber);
        setValue(`items.${itemIndex}.itemCode`, dbCode || currentItem.itemCode);
        setValue(`items.${itemIndex}.itemName`, dbName || currentItem.itemName);
        setValue(`items.${itemIndex}.verificationStatus`, 'verified');

      } else {
        if (result.error === 'CONFLICT') {
          onConflict();
          setValue(`items.${itemIndex}.verificationStatus`, 'conflict');
          return;
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
          performBackgroundMasterUpdate(itemId, itemIndex, trimmedNum, trimmedCode, trimmedName);
          setValue(`items.${itemIndex}.verificationStatus`, 'updating');
          return;
        }

        setValue(`items.${itemIndex}.verificationStatus`, (field === 'itemCode' && currentItem.itemName && currentItem.itemNumber) ? 'verified' : 'new');
      }
    } catch (error) {
      console.error('Error verifying item:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      const isConflict = errMsg.includes('CONFLICT') || String(error).includes('CONFLICT');

      if (isConflict) {
        onConflict();
        setValue(`items.${itemIndex}.verificationStatus`, 'conflict');
      } else {
        setValue(`items.${itemIndex}.verificationStatus`, 'failed');
      }
    }
  }, [getValues, setValue, itemMaster, onAutofillTriggered, performBackgroundMasterUpdate, onConflict]);

  const triggerDebouncedVerification = useCallback((
    itemId: string, 
    itemIndex: number, 
    field: 'itemNumber' | 'itemCode', 
    value: string
  ) => {
    if (verificationTimeouts.current[itemId]) {
      clearTimeout(verificationTimeouts.current[itemId]);
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setValue(`items.${itemIndex}.verificationStatus`, 'idle');
      return;
    }

    verificationTimeouts.current[itemId] = setTimeout(() => {
      verifySingleItem(itemId, itemIndex, field, trimmed);
    }, 600);
  }, [verifySingleItem, setValue]);

  const clearTimeouts = useCallback(() => {
    Object.values(verificationTimeouts.current).forEach(clearTimeout);
    verificationTimeouts.current = {};
  }, []);

  const clearItemTimeout = useCallback((itemId: string) => {
    if (verificationTimeouts.current[itemId]) {
      clearTimeout(verificationTimeouts.current[itemId]);
      delete verificationTimeouts.current[itemId];
    }
  }, []);

  return {
    triggerDebouncedVerification,
    clearTimeouts,
    clearItemTimeout
  };
}
