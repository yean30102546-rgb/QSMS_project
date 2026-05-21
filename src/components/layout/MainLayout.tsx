import React, { Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, LayoutDashboard, LogOut, Plus, HelpCircle, X, Menu, ArrowLeft } from 'lucide-react';

import type { ReworkCase, ReworkItem } from '../../services/api';
import type { User } from '../../services/auth';

const OverallTab = React.lazy(async () => {
  const mod = await import('../tabs/OverallTab');
  return { default: mod.OverallTab };
});

const AddCaseTab = React.lazy(async () => {
  const mod = await import('../tabs/AddCaseTab');
  return { default: mod.AddCaseTab };
});

const DashboardTab = React.lazy(async () => {
  const mod = await import('../tabs/DashboardTab');
  return { default: mod.DashboardTab };
});

type Tab = 'overall' | 'add' | 'dashboard';

type SaveMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

type SelectionModalState = {
  itemId: string;
  type: 'reason' | 'responsible';
  title: string;
  options: string[];
} | null;

interface MainLayoutProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  userName: string;
  userRole?: User['role'] | '';
  cases: ReworkCase[];
  isLoadingCases: boolean;
  caseError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadCases: () => void;
  openUpdateModal: (caseItem: ReworkCase) => void;
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    awaitingValuation: number;
    completed: number;
    completionRate: number;
    linkedCount: number;
  };
  caseSource: string;
  setCaseSource: (source: string) => void;
  formItems: ReworkItem[];
  addFormItem: () => void;
  removeFormItem: (id: string) => void;
  updateFormItem: (id: string, field: string, value: string | number) => void;
  handleImagesSelected: (itemId: string, files: File[]) => void;
  uploadedImages: Record<string, File[]>;
  handleCheckItemNumber: (id: string) => void;
  handleAutoFillBlur: (id: string) => void;
  handleSubmit: () => void;
  orFiles: File[];
  setOrFiles: (files: File[]) => void;
  isSaving: boolean;
  progress: number;
  isComplete: boolean;
  saveMessage: SaveMessage;
  isSaveDisabled: (items: ReworkItem[]) => boolean;
  autoFillTriggeredItem: string | null;
  isLoadingMaster: boolean;
  selectionModal: SelectionModalState;
  setSelectionModal: (modal: SelectionModalState) => void;
  onOpenTutorial: () => void;
  onBackToPortal: () => void;
}

function TabFallback() {
  return (
    <div className="flex-1 p-4 md:p-8 lg:p-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

export function MainLayout({
  activeTab,
  setActiveTab,
  onLogout,
  userName,
  userRole = '',
  cases,
  isLoadingCases,
  caseError,
  searchQuery,
  setSearchQuery,
  loadCases,
  openUpdateModal,
  stats,
  caseSource,
  setCaseSource,
  formItems,
  addFormItem,
  removeFormItem,
  updateFormItem,
  handleImagesSelected,
  uploadedImages,
  orFiles,
  setOrFiles,
  handleCheckItemNumber,
  handleAutoFillBlur,
  handleSubmit,
  isSaving,
  progress,
  isComplete,
  saveMessage,
  isSaveDisabled,
  autoFillTriggeredItem,
  isLoadingMaster,
  selectionModal,
  setSelectionModal,
  onOpenTutorial,
  onBackToPortal,
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    closeSidebar();
  };

  // RBAC: Redirect to overall if accessing unauthorized tab
  React.useEffect(() => {
    if (activeTab === 'dashboard' && userRole !== 'admin' && userRole !== 'qsms') {
      setActiveTab('overall');
    }
    if (activeTab === 'add' && userRole === 'finance') {
      setActiveTab('overall');
    }
  }, [activeTab, userRole, setActiveTab]);

  return (
    <div className="flex h-full overflow-hidden bg-transparent text-on-surface font-sans">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/20 bg-surface/40 backdrop-blur-2xl px-5 py-8 shadow-lg shadow-primary/5 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <motion.div
          className="mb-14 flex cursor-pointer items-center gap-3 px-2"
          onClick={() => handleTabChange('overall')}
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-white/60 border border-white/40 p-1 shadow-sm">
            <img src="/img/logo.png" alt="Excellence Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold tracking-wider text-primary uppercase leading-tight">QSMS REWORK</h1>
          </div>
        </motion.div>

        <nav className="flex-1 space-y-1">
          <SidebarItem
            active={activeTab === 'overall'}
            onClick={() => handleTabChange('overall')}
            label="ภาพรวม (Overall)"
            icon={<LayoutDashboard size={16} />}
          />
          {userRole !== 'finance' && (
            <SidebarItem
              active={activeTab === 'add'}
              onClick={() => handleTabChange('add')}
              label="เพิ่มงานใหม่ (Add Case)"
              icon={<Plus size={16} />}
            />
          )}
          <SidebarItem
            active={false}
            onClick={() => {
              onBackToPortal();
              closeSidebar();
            }}
            label="กลับหน้าพอร์ทัล"
            icon={<ArrowLeft size={16} />}
          />
          <SidebarItem
            active={false}
            onClick={() => {
              onOpenTutorial();
              closeSidebar();
            }}
            label="คู่มือการใช้งาน"
            icon={<HelpCircle size={16} />}
          />
        </nav>

        {(userRole === 'admin' || userRole === 'qsms') && (
          <div className="mt-auto border-t border-white/20 pt-8">
            <SidebarItem
              active={activeTab === 'dashboard'}
              onClick={() => handleTabChange('dashboard')}
              label="แดชบอร์ด (Dashboard)"
              icon={<BarChart3 size={16} />}
            />
          </div>
        )}

        <div className="mt-8 border-t border-white/20 pt-8">
          <div className="flex cursor-pointer items-center justify-between rounded-lg bg-white/40 border border-white/30 px-3 py-3 text-sm transition-all hover:bg-white/60">
            <span className="font-semibold text-slate-800">{userName || 'User'}</span>
            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase leading-none text-primary">
              {String(userRole || 'Admin')}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:bg-red-500/10 hover:text-red-600 active:scale-95"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-transparent">
        {/* Mobile Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/20 bg-white/50 backdrop-blur-md px-4 md:hidden">

          <div className="flex items-center gap-2">
            <img src="/img/logo.png" alt="" className="h-8 object-contain" />
            <span className="text-sm font-bold">QSMS Rework</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-foreground hover:bg-slate-100"
          >
            {isSidebarOpen ? <X size={20} /> : <div className="space-y-1">
              <div className="h-0.5 w-5 bg-foreground"></div>
              <div className="h-0.5 w-5 bg-foreground"></div>
              <div className="h-0.5 w-5 bg-foreground"></div>
            </div>}
          </button>
        </div>

        <Suspense fallback={<TabFallback />}>
          <AnimatePresence mode="wait">
            {activeTab === 'overall' && (
              <motion.div
                key="overall"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <OverallTab
                  cases={cases}
                  isLoadingCases={isLoadingCases}
                  caseError={caseError}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  loadCases={loadCases}
                  openUpdateModal={openUpdateModal}
                  stats={stats}
                  userRole={userRole}
                  userName={userName}
                />
              </motion.div>
            )}

            {activeTab === 'add' && userRole !== 'finance' && (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-x-hidden overflow-y-auto"
              >
                <div className="p-8 md:p-10 lg:p-12">
                  <AddCaseTab
                    caseSource={caseSource}
                    setCaseSource={setCaseSource}
                    formItems={formItems}
                    addFormItem={addFormItem}
                    removeFormItem={removeFormItem}
                    updateFormItem={updateFormItem}
                    handleImagesSelected={handleImagesSelected}
                    uploadedImages={uploadedImages}
                    orFiles={orFiles}
                    setOrFiles={setOrFiles}
                    handleCheckItemNumber={handleCheckItemNumber}
                    handleAutoFillBlur={handleAutoFillBlur}
                    handleSubmit={handleSubmit}
                    isSaving={isSaving}
                    progress={progress}
                    isComplete={isComplete}
                    saveMessage={saveMessage}
                    isSaveDisabled={isSaveDisabled}
                    autoFillTriggeredItem={autoFillTriggeredItem}
                    selectionModal={selectionModal}
                    setSelectionModal={setSelectionModal}
                    onOpenTutorial={onOpenTutorial}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'dashboard' && (userRole === 'admin' || userRole === 'qsms') && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-x-hidden overflow-y-auto"
              >
                <div className="p-8 md:p-10 lg:p-12">
                  <DashboardTab
                    cases={cases}
                    isLoadingCases={isLoadingCases}
                    isLoadingMaster={isLoadingMaster}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}

interface SidebarItemProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}

function SidebarItem({ active, onClick, label, icon }: SidebarItemProps) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`sidebar-item mb-2 flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${active
        ? 'border border-white/40 bg-primary/10 text-primary shadow-sm'
        : 'text-on-surface-variant hover:bg-white/20 hover:text-primary'
        }`}
    >
      {icon && <span className={`transition-colors ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{icon}</span>}
      <span>{label}</span>
    </motion.button>
  );
}
