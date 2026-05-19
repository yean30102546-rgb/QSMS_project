import React, { useEffect, useState } from 'react';

import { MainLayout } from '../../components/layout/MainLayout';
import { ConfirmNewItemModal } from '../../components/modals/ConfirmNewItemModal';
import { TutorialModal } from '../../components/modals/TutorialModal';
import { UpdateModal } from '../../components/modals/UpdateModal';
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
import { logout as authLogout, type User } from '../../services/auth';
import { enforceNumeric, getStatistics, isSaveDisabled, sortCasesByStatus } from '../../utils/helpers';

type Tab = 'overall' | 'add' | 'dashboard';

const initialFormItem: ReworkItem = {
  id: 'form-1',
  itemNumber: '',
  itemName: '',
  itemCode: '',
  batchNo: '',
  packagingDate: '',
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
};

interface ReworkAppProps {
  user: User | null;
  onLogout: () => void;
  onBackToPortal: () => void;
}

export function ReworkApp({ user, onLogout, onBackToPortal }: ReworkAppProps) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<ReworkCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [itemMaster, setItemMaster] = useState<{ itemNumber: string; itemCode: string; itemName: string }[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [caseSource, setCaseSource] = useState('SFC');
  const [orFiles, setOrFiles] = useState<File[]>([]);
  const [formItems, setFormItems] = useState<ReworkItem[]>([{ ...initialFormItem }]);

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

  const handleLogout = async () => {
    await authLogout();
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
    }
  };

  const updateFormItem = (id: string, field: string, value: string | number) => {
    if (field === 'itemNumber') {
      const sanitized = String(value).replace(/[<>]/g, '').slice(0, 50);
      setFormItems((prev) => prev.map((item) => (item.id === id ? { ...item, itemNumber: sanitized } : item)));
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
        return { ...item, [field]: normalizedValue };
      }),
    );
  };

  const handleCheckItemNumber = (id: string, showModal: boolean = true) => {
    const item = formItems.find((i) => i.id === id);
    if (!item) return;

    const trimmedNumber = item.itemNumber.trim();
    const trimmedCode = item.itemCode.trim();

    if (!trimmedNumber && !trimmedCode) return;

    const masterInfo = itemMaster.find(
      (m) => (trimmedNumber && m.itemNumber === trimmedNumber) || (trimmedCode && m.itemCode === trimmedCode),
    );

    if (masterInfo) {
      setFormItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                itemNumber: masterInfo.itemNumber || i.itemNumber,
                itemCode: masterInfo.itemCode || i.itemCode,
                itemName: masterInfo.itemName || i.itemName,
              }
            : i,
        ),
      );
      setAutoFillTriggeredItem(id);
      setTimeout(() => setAutoFillTriggeredItem(null), 1500);
    } else if (showModal && trimmedNumber) {
      setConfirmNewItemModal({ isOpen: true, itemNumber: trimmedNumber, itemId: id });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const newItemsToSave = formItems.filter((item) => {
        const trimmedNum = item.itemNumber.trim();
        const trimmedCode = item.itemCode.trim();
        if (!trimmedNum && !trimmedCode) return false;
        return !itemMaster.some(
          (m) => (trimmedNum && m.itemNumber === trimmedNum) || (trimmedCode && m.itemCode === trimmedCode),
        );
      });
      for (const item of newItemsToSave) {
        await saveItemToMaster(item.itemNumber.trim(), item.itemCode, item.itemName);
      }
      const result = await insertCase(caseSource, formItems, uploadedImages, orFiles);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'เธเธฑเธเธ—เธถเธเธชเธณเน€เธฃเนเธ' });
        setFormItems([{ ...initialFormItem }]);
        setUploadedImages({});
        setOrFiles([]);
        await loadCases();
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        setSaveMessage({
          type: 'error',
          text: result.error || 'เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธเธฑเธเธ—เธถเธเนเธ”เน เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธ',
        });
      }
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธเธฑเธเธ—เธถเธ',
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
        setCases((prevCases) =>
          prevCases.map((c) => {
            if (c.id === caseId) {
              const { newOrFiles, deleteItemIds, ...cleanUpdates } = updates as any;
              const updatedCase = { ...c, ...cleanUpdates };

              if (cleanUpdates.items || deleteItemIds) {
                let updatedItems = cleanUpdates.items ? [...cleanUpdates.items] : [...c.items];
                if (deleteItemIds && deleteItemIds.length > 0) {
                  updatedItems = updatedItems.filter((item: any) => !deleteItemIds.includes(item.uid || item.id));
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
        alert(`เธเธฑเธเธ—เธถเธเนเธกเนเธชเธณเน€เธฃเนเธ: ${result.error}`);
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
        alert('เธฅเธเธฃเธฒเธขเธเธฒเธฃเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง');
      } else {
        alert(`เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธฅเธเธฃเธฒเธขเธเธฒเธฃเนเธ”เน: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธฅเธ: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        formItems={formItems}
        addFormItem={addFormItem}
        removeFormItem={removeFormItem}
        updateFormItem={updateFormItem}
        handleImagesSelected={(id, files) => setUploadedImages((prev) => ({ ...prev, [id]: files }))}
        uploadedImages={uploadedImages}
        orFiles={orFiles}
        setOrFiles={setOrFiles}
        handleCheckItemNumber={handleCheckItemNumber}
        handleAutoFillBlur={(id) => handleCheckItemNumber(id, false)}
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCase(null);
        }}
        onUpdate={handleUpdateCase}
        onDelete={handleDeleteCase}
      />

      <ConfirmNewItemModal
        isOpen={confirmNewItemModal.isOpen}
        itemNumber={confirmNewItemModal.itemNumber}
        onConfirm={async (name) => {
          setFormItems((prev) =>
            prev.map((i) => (i.id === confirmNewItemModal.itemId ? { ...i, itemName: name } : i)),
          );
          setConfirmNewItemModal({ isOpen: false, itemNumber: '', itemId: null });
        }}
        onCancel={() => setConfirmNewItemModal({ isOpen: false, itemNumber: '', itemId: null })}
        isLoading={isSaving}
      />

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </>
  );
}
