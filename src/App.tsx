/**
 * QSMS Rework Management System - Refactored Frontend
 * React + Google Apps Script Integration
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

// Services & Utils
import {
  fetchAllCases,
  insertCase,
  updateCase,
  deleteCase,
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
import { TutorialModal } from './components/TutorialModal';

type Tab = 'overall' | 'add' | 'dashboard';

/**
 * ===== AUTH WRAPPER COMPONENT =====
 */
function AuthWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(authIsAuthenticated());
    setAppUser(getCurrentUser());
    setAuthLoading(false);
  }, []);

  const refreshAuth = (authenticated = false) => {
    if (authenticated === true) {
      setIsAuthenticated(true);
      setAppUser(getCurrentUser());
    } else {
      setIsAuthenticated(authIsAuthenticated());
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

const initialFormItem: ReworkItem = {
  id: 'form-1',
  itemNumber: '',
  itemName: '',
  itemCode: '',
  batchNo: '',
  amount: 1,
  reason: '',
  reasonSubtype: '',
  responsible: '',
  responsibleSubtype: '',
  details: '',
  imageUrls: [],
  linkedSourceId: '',
  customerName: '',
};

/**
 * ===== MAIN APP CONTENT COMPONENT =====
 */
function MainAppContent({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<ReworkCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [itemMaster, setItemMaster] = useState<Map<string, string>>(new Map());
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [caseSource, setCaseSource] = useState('SFC');
  const [orFiles, setOrFiles] = useState<File[]>([]);
  const [formItems, setFormItems] = useState<ReworkItem[]>([
    { ...initialFormItem }
  ]);

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
  const [confirmNewItemModal, setConfirmNewItemModal] = useState<{
    isOpen: boolean;
    itemNumber: string;
    itemId: string | null;
  }>({ isOpen: false, itemNumber: '', itemId: null });

  const GAS_WEB_APP_URL = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();

  useEffect(() => {
    setGasWebAppUrl(GAS_WEB_APP_URL);
    loadMasterData();
    loadCases();
  }, []);

  const loadMasterData = async () => {
    try {
      setIsLoadingMaster(true);
      const result = await fetchItemMaster();
      const data = result.data || [];
      if (data && Array.isArray(data) && data.length > 0) {
        const masterMap = new Map(data.map(item => [String(item.itemNumber || '').trim(), String(item.itemName || '').trim()]));
        setItemMaster(masterMap);
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

  const handleLogout = async () => {
    await authLogout();
    onLogout();
  };

  const addFormItem = () => {
    setFormItems([...formItems, {
      ...initialFormItem,
      id: `form-${Date.now()}`
    }]);
  };

  const removeFormItem = (id: string) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter(item => item.id !== id));
      const newImages = { ...uploadedImages };
      delete newImages[id];
      setUploadedImages(newImages);
    }
  };

  const updateFormItem = (id: string, field: string, value: string | number) => {
    if (field === 'itemNumber') {
      const sanitized = String(value).replace(/[<>]/g, '').slice(0, 50);
      setFormItems(prev => prev.map(item => item.id === id ? { ...item, itemNumber: sanitized } : item));
      return;
    }
    setFormItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const normalizedValue = (field === 'itemCode') ? enforceNumeric(String(value)).slice(0, 50) :
        field === 'amount' ? Math.max(0, parseInt(String(value)) || 0) : value;
      return { ...item, [field]: normalizedValue };
    }));
  };



  const handleCheckItemNumber = (id: string, showModal: boolean = true) => {
    const item = formItems.find(i => i.id === id);
    if (!item || !item.itemNumber.trim()) return;
    const itemName = itemMaster.get(item.itemNumber.trim());
    if (itemName) {
      setFormItems(prev => prev.map(i => i.id === id ? { ...i, itemName } : i));
      setAutoFillTriggeredItem(id);
      setTimeout(() => setAutoFillTriggeredItem(null), 1500);
    } else if (showModal) {
      setConfirmNewItemModal({ isOpen: true, itemNumber: item.itemNumber.trim(), itemId: id });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const newItemsToSave = formItems.filter(item => !itemMaster.has(item.itemNumber.trim()));
      for (const item of newItemsToSave) {
        await saveItemToMaster(item.itemNumber.trim(), item.itemName);
      }
      const result = await insertCase(caseSource, formItems, uploadedImages, orFiles);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'บันทึกสำเร็จ' });
        setFormItems([{ ...initialFormItem }]);
        setUploadedImages({});
        setOrFiles([]);
        await loadCases();
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        setSaveMessage({ 
          type: 'error', 
          text: result.error || 'ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง' 
        });
      }
    } catch (error) {
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCase = async (caseId: string, updates: Partial<ReworkCase>) => {
    try {
      setIsModalLoading(true);
      const result = await updateCase(caseId, updates);
      if (result.success) {
        // Always refetch from source of truth to avoid 'ghost' updates
        await loadCases();
        setIsModalOpen(false);
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
        setCases(cases.filter(c => c.id !== caseId));
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
        userName={user?.name || ''}
        userRole={user?.role || ''}
        cases={cases}
        isLoadingCases={isLoadingCases}
        caseError={caseError}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loadCases={loadCases}
        openUpdateModal={(c) => { setSelectedCase(c); setIsModalOpen(true); }}
        stats={getStatistics(cases)}
        caseSource={caseSource}
        setCaseSource={setCaseSource}
        formItems={formItems}
        addFormItem={addFormItem}
        removeFormItem={removeFormItem}
        updateFormItem={updateFormItem}
        handleImagesSelected={(id, files) => setUploadedImages(prev => ({ ...prev, [id]: files }))}
        uploadedImages={uploadedImages}
        orFiles={orFiles}
        setOrFiles={setOrFiles}
        handleCheckItemNumber={handleCheckItemNumber}
        handleItemNumberBlur={(id) => handleCheckItemNumber(id, false)}
        handleSubmit={handleSubmit}
        isSaving={isSaving}
        saveMessage={saveMessage}
        isSaveDisabled={isSaveDisabled}
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
        onClose={() => { setIsModalOpen(false); setSelectedCase(null); }}
        onUpdate={handleUpdateCase}
        onDelete={handleDeleteCase}
      />

      <ConfirmNewItemModal
        isOpen={confirmNewItemModal.isOpen}
        itemNumber={confirmNewItemModal.itemNumber}
        onConfirm={async (name) => {
          setFormItems(prev => prev.map(i => i.id === confirmNewItemModal.itemId ? { ...i, itemName: name } : i));
          setConfirmNewItemModal({ isOpen: false, itemNumber: '', itemId: null });
        }}
        onCancel={() => setConfirmNewItemModal({ isOpen: false, itemNumber: '', itemId: null })}
        isLoading={isSaving}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </>
  );
}

export default function App() {
  return <AuthWrapper />;
}
