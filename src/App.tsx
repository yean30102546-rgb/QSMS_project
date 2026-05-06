/**
 * QSMS Rework Management System - Refactored Frontend
 * React + Google Apps Script Integration
 * 
 * Features:
 * - Minimal PIN-based authentication
 * - Role-Based Access Control (RBAC)
 * - Role-Based Access Control (RBAC)
 * - Real-time data sync with Google Sheets via Google Apps Script
 * - Modal-based updates without page redirects
 * - Image upload with gallery preview (up to 5 images per item)
 * - Modern dashboard with statistics
 * - Form validation and numeric input masking
 * - Async saving with loading states
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Services & Utils
import {
  fetchAllCases,
  insertCase,
  updateCase,
  setGasWebAppUrl,
  fetchItemMaster,
  saveItemToMaster,
  ReworkCase,
  ReworkItem,
} from './services/api';
import {
  getCurrentUser,
  isAuthenticated as authIsAuthenticated,
  logout as authLogout,
  User,
} from './services/auth';
import {
  isSaveDisabled,
  sortCasesByStatus,
  filterCasesByQuery,
  enforceNumeric,
  getStatistics,
  validateItemDetailed,
  findDuplicateItemNumbers,
} from './utils/helpers';

// Components
import { UpdateModal } from './components/UpdateModal';
import { MainLayout } from './components/MainLayout';
import { Login } from './components/Login';
import { ConfirmNewItemModal } from './components/ConfirmNewItemModal';

type Tab = 'overall' | 'add' | 'dashboard';

/**
 * ===== AUTH WRAPPER COMPONENT =====
 * Handles authentication state and routes to Login or MainApp
 */
function AuthWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Initial auth check on mount
  useEffect(() => {
    console.log('🔍 Initial auth check on mount');
    setIsAuthenticated(authIsAuthenticated());
    setAppUser(getCurrentUser());
    setAuthLoading(false);
  }, []);

  // Track isAuthenticated changes and log them
  useEffect(() => {
    console.log('📊 isAuthenticated state changed to:', isAuthenticated);
    if (isAuthenticated) {
      console.log('✅ User authenticated, user data:', appUser);
    } else {
      console.log('❌ User not authenticated');
    }
  }, [isAuthenticated, appUser]);

  const refreshAuth = (authenticated = false) => {
    console.log('🔄 refreshAuth called with authenticated:', authenticated);

    // If explicitly told authenticated is true, use that directly
    if (authenticated === true) {
      console.log('🔄 Reading from sessionStorage...');
      const user = getCurrentUser();
      console.log('🔄 getCurrentUser() returned:', user);
      const token = sessionStorage.getItem('qsms_token');
      console.log('🔄 qsms_token in sessionStorage:', token ? 'EXISTS' : 'MISSING');

      console.log('🔄 Setting isAuthenticated to TRUE');
      setIsAuthenticated(true);
      setAppUser(user);
    } else {
      // Otherwise check session
      const authState = authIsAuthenticated();
      console.log('🔄 authIsAuthenticated() returned:', authState);
      setIsAuthenticated(authState);
      setAppUser(getCurrentUser());
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-slate-200 border-t-accent rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onSuccess={refreshAuth} />;
  }

  return <MainAppContent user={appUser} onLogout={refreshAuth} />;
}

/**
 * ===== MAIN APP CONTENT COMPONENT =====
 * Main application logic with session-based PIN authentication
 */
function MainAppContent({ user, onLogout }: { user: User | null; onLogout: () => void }) {

  const handleLogout = async () => {
    try {
      await authLogout();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [autoFillTriggeredItem, setAutoFillTriggeredItem] = useState<string | null>(null);

  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState<Tab>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  // ===== DATA STATE =====
  const [cases, setCases] = useState<ReworkCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [caseError, setCaseError] = useState<string | null>(null);

  // ===== MASTER DATA STATE =====
  const [itemMaster, setItemMaster] = useState<Map<string, string>>(new Map());
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);

  // ===== FORM STATE =====
  const [caseSource, setCaseSource] = useState('SFC');
  const [formItems, setFormItems] = useState<ReworkItem[]>([
    {
      id: 'form-1',
      itemNumber: '',
      itemName: '',
      itemCode: '',
      amount: 1,
      reason: '',
      reasonSubtype: '',
      responsible: '',
      responsibleSubtype: '',
      details: '',
      imageUrls: [],
    },
  ]);

  // ===== MODAL STATE =====
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ReworkCase | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // ===== SELECTION MODAL STATE (for dropdowns) =====
  const [selectionModal, setSelectionModal] = useState<{
    itemId: string;
    type: 'reason' | 'responsible';
    title: string;
    options: string[];
  } | null>(null);

  // ===== FORM SUBMISSION STATE =====
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // ===== IMAGE UPLOAD STATE =====
  const [uploadedImages, setUploadedImages] = useState<Record<string, File[]>>({});

  // ===== NEW ITEM CONFIRMATION MODAL STATE =====
  const [confirmNewItemModal, setConfirmNewItemModal] = useState<{
    isOpen: boolean;
    itemNumber: string;
    itemId: string | null;
  }>({
    isOpen: false,
    itemNumber: '',
    itemId: null,
  });

  const GAS_WEB_APP_URL = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();

  /**
   * Load all cases and master data on component mount
   */
  useEffect(() => {
    console.log('📡 Setting GAS Web App URL:', GAS_WEB_APP_URL);
    setGasWebAppUrl(GAS_WEB_APP_URL);
    loadMasterData();
    loadCases();
    // Only run once on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch item master data from GAS
   */
  const loadMasterData = async () => {
    try {
      setIsLoadingMaster(true);
      const result = await fetchItemMaster();

      // Process data regardless of success flag (api.ts converts null to [])
      const data = result.data || [];

      console.log('📊 ItemMaster API Response:', {
        success: result.success,
        dataLength: data?.length,
        rawData: data,
        firstItem: data?.[0],
        error: result.error
      });

      // Create Map with better debugging
      if (data && Array.isArray(data) && data.length > 0) {
        const mappedEntries: Array<[string, string]> = data.map(item => {
          const key = String(item.itemNumber || '').trim();
          const value = String(item.itemName || '').trim();
          console.log(`  └─ Map entry: "${key}" → "${value}"`);
          return [key, value];
        });
        const masterMap = new Map(mappedEntries);
        setItemMaster(masterMap);

        console.log(`✓ ItemMaster loaded: ${masterMap.size} items`);
        console.log(`  Map keys:`, Array.from(masterMap.keys()));
        console.log(`  Full map:`, masterMap);
      } else {
        console.warn('⚠️ ItemMaster data is empty or invalid:', data);
        setItemMaster(new Map());
      }

      if (!result.success) {
        console.warn('ItemMaster loading warning:', result.error);
      }
    } catch (error) {
      console.error('Error loading master data:', error);
      setItemMaster(new Map());
    } finally {
      setIsLoadingMaster(false);
    }
  };

  /**
   * Fetch cases from Google Sheets via GAS
   */
  const loadCases = async () => {
    try {
      setIsLoadingCases(true);
      setCaseError(null);

      const result = await fetchAllCases();

      if (result.success && result.data) {
        // Sort cases by status: Pending > In-Progress > Completed
        const sortedCases = sortCasesByStatus(result.data);
        setCases(sortedCases);
      } else {
        throw new Error(result.error || 'Failed to load cases');
      }
    } catch (error) {
      console.error('Error loading cases:', error);
      setCaseError(
        error instanceof Error ? error.message : 'Failed to load cases from server'
      );
    } finally {
      setIsLoadingCases(false);
    }
  };

  /**
   * Add a new form item
   */
  const addFormItem = () => {
    setFormItems([
      ...formItems,
      {
        id: `form-${Date.now()}`,
        itemNumber: '',
        itemName: '',
        itemCode: '',
        amount: 1,
        reason: '',
        reasonSubtype: '',
        responsible: '',
        responsibleSubtype: '',
        details: '',
        imageUrls: [],
      },
    ]);
  };

  /**
   * Remove a form item
   */
  const removeFormItem = (id: string) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((item) => item.id !== id));
      // Also remove associated images
      const newImages = { ...uploadedImages };
      delete newImages[id];
      setUploadedImages(newImages);
    }
  };

  /**
   * Update form item field
   */
  const updateFormItem = (
    id: string,
    field: string,
    value: string | number
  ) => {
    if (field === 'itemNumber') {
      const typed = String(value);
      // Allow alphanumeric characters (letters and numbers), max 50 characters
      const alphanumeric = typed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 50);
      setFormItems(prev =>
        prev.map(item =>
          item.id === id
            ? {
              ...item,
              itemNumber: alphanumeric,
            }
            : item
        )
      );
      return;
    }

    setFormItems(
      formItems.map((item) =>
        item.id === id
          ? {
            ...item,
            [field]:
              field === 'itemCode'
                ? enforceNumeric(String(value)).slice(0, 11)
                : field === 'amount'
                  ? Math.max(0, parseInt(String(value)) || 0)
                  : value,
          }
          : item
      )
    );
  };

  /**
   * Check ItemNumber when user clicks verify button or after blur
   * Enhanced to show item name directly if matched in database
   */
  const handleCheckItemNumber = (id: string, showModal: boolean = true) => {
    const item = formItems.find(i => i.id === id);
    if (!item || !item.itemNumber.trim()) {
      console.warn(`⚠️ Cannot verify: item ${id} not found or itemNumber empty`);
      return;
    }

    const trimmedItemNumber = item.itemNumber.trim();

    // Try multiple lookups with different formats
    let itemName = itemMaster.get(trimmedItemNumber);

    // If not found, try without leading zeros or other format variations
    if (!itemName) {
      // Try numeric comparison (in case one is number, one is string)
      const numericInput = parseInt(trimmedItemNumber) || trimmedItemNumber;
      for (const [key, value] of itemMaster.entries()) {
        if (String(key).trim() === trimmedItemNumber ||
          String(key).trim() === String(numericInput) ||
          parseInt(key) === parseInt(trimmedItemNumber)) {
          itemName = value;
          console.log(`  └─ Found via fallback lookup: "${key}" → "${value}"`);
          break;
        }
      }
    }

    console.log(`🔍 Verifying itemNumber: "${trimmedItemNumber}"`, {
      found: !!itemName,
      itemName,
      masterDataSize: itemMaster.size,
      allKeys: Array.from(itemMaster.keys()),
      showModal
    });

    if (itemName) {
      // ✅ Found in master - auto-fill name with success feedback
      setFormItems(prev =>
        prev.map(i =>
          i.id === id
            ? { ...i, itemName }
            : i
        )
      );
      setAutoFillTriggeredItem(id);
      // Keep visual feedback for 1.5 seconds
      window.setTimeout(() => setAutoFillTriggeredItem(prev => (prev === id ? null : prev)), 1500);
      console.log(`✓ Item matched: ${trimmedItemNumber} → ${itemName}`);
    } else if (showModal) {
      // ❌ Not found - show confirmation modal to create new item
      console.warn(`✗ Item not found: "${trimmedItemNumber}" (showing modal)`);
      console.warn(`   Searched in ${itemMaster.size} items with keys: ${Array.from(itemMaster.keys()).join(', ')}`);
      setConfirmNewItemModal({
        isOpen: true,
        itemNumber: trimmedItemNumber,
        itemId: id,
      });
    } else {
      console.log(`ℹ️ Item not found: ${trimmedItemNumber} (silent mode - no modal)`);
    }
  };

  /**
   * Auto-verify item on blur (when user finishes typing)
   * Silently verifies without showing "not found" modal
   */
  const handleItemNumberBlur = (id: string) => {
    // Auto-verify without showing modal if not found
    handleCheckItemNumber(id, false);
  };

  /**
   * Handle images selected for an item
   */
  const handleImagesSelected = (itemId: string, files: File[]) => {
    setUploadedImages((prev) => ({
      ...prev,
      [itemId]: files,
    }));
  };

  /**
   * Submit new case with enhanced validation and error handling
   */
  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      // ===== FRONTEND VALIDATION =====
      // Check for empty items
      if (!formItems || formItems.length === 0) {
        setSaveMessage({
          type: 'error',
          text: '⚠️ เพิ่มอย่างน้อย 1 รายการก่อนบันทึก',
        });
        setTimeout(() => setSaveMessage(null), 5000);
        setIsSaving(false);
        return;
      }

      // Check max items
      if (formItems.length > 20) {
        setSaveMessage({
          type: 'error',
          text: '⚠️ สูงสุด 20 รายการต่อ 1 case เท่านั้น',
        });
        setTimeout(() => setSaveMessage(null), 5000);
        setIsSaving(false);
        return;
      }

      // Check for duplicate ItemNumbers
      const dupCheck = findDuplicateItemNumbers(formItems);
      if (dupCheck.hasDuplicates) {
        setSaveMessage({
          type: 'error',
          text: `⚠️ พบรหัสรายการซ้ำ: ${dupCheck.duplicates.join(', ')}`,
        });
        setTimeout(() => setSaveMessage(null), 5000);
        setIsSaving(false);
        return;
      }

      // Validate each item with detailed errors
      const detailedErrors: Record<number, string[]> = {};
      for (let i = 0; i < formItems.length; i++) {
        const itemValidation = validateItemDetailed(formItems[i]);
        if (!itemValidation.isValid) {
          detailedErrors[i] = Object.values(itemValidation.fieldErrors).filter(e => e);
        }
      }

      if (Object.keys(detailedErrors).length > 0) {
        const errorList = Object.entries(detailedErrors)
          .map(([idx, errors]) => `Item ${Number(idx) + 1}: ${errors.join(', ')}`)
          .join(' | ');

        setSaveMessage({
          type: 'error',
          text: `⚠️ ข้อมูลไม่ถูกต้อง: ${errorList}`,
        });
        setTimeout(() => setSaveMessage(null), 6000);
        setIsSaving(false);
        return;
      }

      // ===== SUBMIT TO BACKEND =====
      // Save any new items to Item Master first
      const newItemsToSave = formItems.filter(item => !itemMaster.has(item.itemNumber.trim()));
      for (const item of newItemsToSave) {
        try {
          console.log(`Saving new item to master: ${item.itemNumber} - ${item.itemName}`);
          await saveItemToMaster(item.itemNumber.trim(), item.itemName);
        } catch (err) {
          console.error("Failed to save new item:", err);
        }
      }
      if (newItemsToSave.length > 0) {
        await loadMasterData();
      }

      const result = await insertCase(caseSource, formItems, uploadedImages);

      if (result.success) {
        setSaveMessage({
          type: 'success',
          text: `✅ บันทึกข้อมูลสำเร็จ! Case ID: ${result.data?.caseId || 'N/A'} (${formItems.length} items)`,
        });

        // Reset form
        setFormItems([
          {
            id: 'form-1',
            itemNumber: '',
            itemName: '',
            itemCode: '',
            amount: 1,
            reason: '',
            reasonSubtype: '',
            responsible: '',
            responsibleSubtype: '',
            details: '',
            imageUrls: [],
          },
        ]);
        setCaseSource('SFC');
        setUploadedImages({});

        // Reload cases in background
        await loadCases();

        // Clear success message after 4 seconds
        setTimeout(() => {
          setSaveMessage(null);
        }, 4000);
      } else {
        // ===== HANDLE BACKEND ERRORS =====
        const backendError = result.error || 'Unknown error';
        let errorMessage = `❌ บันทึกข้อมูลล้มเหลว: ${backendError}`;

        // Check if it's a validation error with details
        if (result.errorCode === 'VALIDATION_ERROR' && result.details) {
          const details = result.details;
          const errorLines = details
            .map(d => `Item ${d.itemIndex}: ${d.errors.join('; ')}`)
            .join(' | ');
          errorMessage = `❌ ข้อมูลไม่ถูกต้อง: ${errorLines}`;
        } else if (result.details) {
          // Fallback just in case errorCode is stripped
          errorMessage = `❌ ข้อมูลไม่ถูกต้อง: ${JSON.stringify(result.details)}`;
        } else if (result.errorCode === 'DUPLICATE_ITEMS' || result.errorCode === 'TOO_MANY_ITEMS') {
          errorMessage = `❌ ${backendError}`;
        } else {
          errorMessage = `❌ ${backendError} (โปรดตรวจสอบให้แน่ใจว่า Deploy โค้ดล่าสุดไปแล้ว)`;
        }

        setSaveMessage({
          type: 'error',
          text: errorMessage,
        });
        setTimeout(() => setSaveMessage(null), 6000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMsg = error instanceof Error ? error.message : 'Connection error - please try again';
      setSaveMessage({
        type: 'error',
        text: `❌ ${errorMsg}`,
      });
      setTimeout(() => setSaveMessage(null), 6000);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Open update modal
   */
  const openUpdateModal = (caseItem: ReworkCase) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
  };

  /**
   * Handle case update from modal
   */
  const handleUpdateCase = async (
    caseId: string,
    updates: Partial<ReworkCase>
  ) => {
    try {
      setIsModalLoading(true);

      const result = await updateCase(caseId, updates);

      if (result.success) {
        // Update local state
        setCases(
          cases.map((c) =>
            c.id === caseId ? { ...c, ...updates } : c
          )
        );
        setIsModalOpen(false);
        setSelectedCase(null);

        // We already updated local state, no need to reload all cases and show skeleton
        // await loadCases();
      } else {
        throw new Error(result.error || 'Failed to update case');
      }
    } catch (error) {
      console.error('Error updating case:', error);
      alert(
        `Error: ${error instanceof Error ? error.message : 'Failed to update case'}`
      );
    } finally {
      setIsModalLoading(false);
    }
  };

  /**
   * Handle confirm new item creation
   */
  const handleConfirmNewItem = async (itemName: string) => {
    try {
      if (!itemName) {
        setSaveMessage({
          type: 'error',
          text: '⚠️ กรุณากรอก Item Name',
        });
        setTimeout(() => setSaveMessage(null), 5000);
        return;
      }

      // Auto-fill the item name in the form immediately
      if (confirmNewItemModal.itemId) {
        setFormItems(prev =>
          prev.map(i =>
            i.id === confirmNewItemModal.itemId
              ? { ...i, itemName }
              : i
          )
        );

        // Show success visual feedback
        setAutoFillTriggeredItem(confirmNewItemModal.itemId);
        window.setTimeout(() => setAutoFillTriggeredItem(prev => (prev === confirmNewItemModal.itemId ? null : prev)), 1500);
      }

      // Close modal
      setConfirmNewItemModal({ isOpen: false, itemNumber: '', itemId: null });
    } catch (error) {
      console.error('Error creating new item:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create new item'}`);
    }
  };

  /**
   * Handle cancel new item creation
   */
  const handleCancelNewItem = () => {
    setConfirmNewItemModal({ isOpen: false, itemNumber: '', itemId: null });
  };

  // ===== DERIVED DATA =====
  const filteredCases = filterCasesByQuery(cases, searchQuery);
  const stats = getStatistics(filteredCases);

  return (
    <>
      <MainLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userName={user?.name || ''}
        cases={filteredCases}
        isLoadingCases={isLoadingCases}
        caseError={caseError}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loadCases={loadCases}
        openUpdateModal={openUpdateModal}
        stats={stats}
        caseSource={caseSource}
        setCaseSource={setCaseSource}
        formItems={formItems}
        addFormItem={addFormItem}
        removeFormItem={removeFormItem}
        updateFormItem={updateFormItem}
        handleImagesSelected={handleImagesSelected}
        uploadedImages={uploadedImages}
        handleCheckItemNumber={handleCheckItemNumber}
        handleItemNumberBlur={handleItemNumberBlur}
        handleSubmit={handleSubmit}
        isSaving={isSaving}
        saveMessage={saveMessage}
        isSaveDisabled={isSaveDisabled}
        autoFillTriggeredItem={autoFillTriggeredItem}
        isLoadingMaster={isLoadingMaster}
        selectionModal={selectionModal}
        setSelectionModal={setSelectionModal}
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
      />

      <ConfirmNewItemModal
        isOpen={confirmNewItemModal.isOpen}
        itemNumber={confirmNewItemModal.itemNumber}
        onConfirm={handleConfirmNewItem}
        onCancel={handleCancelNewItem}
        isLoading={isSaving}
      />
    </>
  );
}

/**
 * ===== APP WRAPPER =====
 * Wraps the main app with authentication providers
 */
export default function App() {
  return <AuthWrapper />;
}
