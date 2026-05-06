import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Plus, BarChart3, LogOut } from 'lucide-react';

// Components
import { OverallTab } from './OverallTab';
import { AddCaseTab } from './AddCaseTab';
import { DashboardTab } from './DashboardTab';

type Tab = 'overall' | 'add' | 'dashboard';

interface MainLayoutProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  userName: string;
  // Pass all necessary props for tabs
  cases: any[];
  isLoadingCases: boolean;
  caseError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadCases: () => void;
  openUpdateModal: (caseItem: any) => void;
  stats: any;
  // Add case form props
  caseSource: string;
  setCaseSource: (source: string) => void;
  formItems: any[];
  addFormItem: () => void;
  removeFormItem: (id: string) => void;
  updateFormItem: (id: string, field: string, value: string | number) => void;
  handleImagesSelected: (itemId: string, files: File[]) => void;
  uploadedImages: Record<string, File[]>;
  handleCheckItemNumber: (id: string) => void;
  handleItemNumberBlur: (id: string) => void;
  handleSubmit: () => void;
  isSaving: boolean;
  saveMessage: any;
  isSaveDisabled: (items: any[]) => boolean;
  autoFillTriggeredItem: string | null;
  // Dashboard props
  isLoadingMaster: boolean;
  // Selection Modal
  selectionModal: any;
  setSelectionModal: (modal: any) => void;
}

export function MainLayout({
  activeTab,
  setActiveTab,
  onLogout,
  userName,
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
  handleCheckItemNumber,
  handleItemNumberBlur,
  handleSubmit,
  isSaving,
  saveMessage,
  isSaveDisabled,
  autoFillTriggeredItem,
  isLoadingMaster,
  selectionModal,
  setSelectionModal,
}: MainLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden bg-bg text-foreground font-sans">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-[260px] bg-surface border-r border-border flex flex-col z-20 h-full py-8 px-5 overflow-y-auto">
        <motion.div
          className="flex items-center gap-2 mb-14 cursor-pointer"
          onClick={() => setActiveTab('overall')}
          whileHover={{ scale: 1.02 }}
        >
          <img src="/img/logo.png" alt="" className="h-12 object-contain drop-shadow-sm" />
          <h1 className="font-semibold text-[18px] tracking-tight text-foreground">
            QSMS Rework
          </h1>
        </motion.div>

        <nav className="flex-1 space-y-1">
          <SidebarItem
            active={activeTab === 'overall'}
            onClick={() => setActiveTab('overall')}
            label="ภาพรวม (Overall)"
            icon={<LayoutDashboard size={16} />}
          />
          <SidebarItem
            active={activeTab === 'add'}
            onClick={() => setActiveTab('add')}
            label="เพิ่มงานใหม่ (Add Case)"
            icon={<Plus size={16} />}
          />
        </nav>

        {/* Dashboard at bottom */}
        <div className="pt-8 border-t border-border mt-auto">
          <SidebarItem
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            label="แดชบอร์ด (Dashboard)"
            icon={<BarChart3 size={16} />}
          />
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex items-center justify-between text-sm py-3 px-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
            <span className="font-medium text-slate-700">{userName || 'User'}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 leading-none">
              Admin
            </span>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-3 flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-hidden flex flex-col bg-bg">
        <AnimatePresence mode="wait">
          {/* ===== OVERALL TAB ===== */}
          {/* OverallTab จัดการ scroll เอง → ไม่ห่อด้วย scroll wrapper เพื่อป้องกัน layout ดีด */}
          {activeTab === 'overall' && (
            <motion.div
              key="overall"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden"
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
              />
            </motion.div>
          )}

          {/* แท็บอื่นๆ ใช้ scroll wrapper ปกติ */}
          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto overflow-x-hidden"
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
                  handleCheckItemNumber={handleCheckItemNumber}
                  handleItemNumberBlur={handleItemNumberBlur}
                  handleSubmit={handleSubmit}
                  isSaving={isSaving}
                  saveMessage={saveMessage}
                  isSaveDisabled={isSaveDisabled}
                  autoFillTriggeredItem={autoFillTriggeredItem}
                  selectionModal={selectionModal}
                  setSelectionModal={setSelectionModal}
                />
              </div>
            </motion.div>
          )}

          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-y-auto overflow-x-hidden"
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
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full sidebar-item mb-2 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer font-medium text-sm ${active
        ? 'bg-[#f4f4f5] text-foreground shadow-sm border border-border'
        : 'text-muted hover:bg-slate-50 hover:text-foreground'
        }`}
    >
      {icon && <span className={`transition-colors ${active ? 'text-foreground' : 'text-muted'}`}>{icon}</span>}
      <span>{label}</span>
    </motion.button>
  );
}
