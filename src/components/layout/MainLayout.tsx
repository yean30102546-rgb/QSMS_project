'use client';

import React, { Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, LayoutDashboard, LogOut, Plus, HelpCircle, X, Menu, ArrowLeft, Bot } from 'lucide-react';

import type { ReworkCase, ReworkItem } from '@/src/services/api';
import type { User } from '../../services/auth';
import { PermissionsModal } from '../modals/PermissionsModal';

const OverallTab = React.lazy(async () => {
  const mod = await import('@/src/modules/rework/views/OverallTab');
  return { default: mod.OverallTab };
});

const DashboardTab = React.lazy(async () => {
  const mod = await import('@/src/modules/rework/views/DashboardTab');
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
  onOpenTutorial: () => void;
  onBackToPortal: () => void;
  onOpenRag?: () => void;
  isFocusMode?: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  children: React.ReactNode;
}

const DEFAULT_SIDEBAR_WIDTH = 275;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 380;
const COLLAPSE_THRESHOLD = 180;
const STORAGE_KEY = 'qsms_sidebar_width_v2';

export function MainLayout({
  activeTab,
  setActiveTab,
  onLogout,
  userName,
  userRole = '',
  onOpenTutorial,
  onBackToPortal,
  onOpenRag,
  isFocusMode = false,
  isSidebarCollapsed: externalSidebarCollapsed,
  onToggleSidebarCollapse,
  children,
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = React.useState(false);

  // Custom resizable sidebar width state & persistence
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = React.useState<boolean>(false);
  const isResizingRef = React.useRef<boolean>(false);
  const sidebarWidthRef = React.useRef<number>(DEFAULT_SIDEBAR_WIDTH);

  // Load persisted width from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(parsed);
          sidebarWidthRef.current = parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Internal collapsed state is controlled by user actions (Drag resize snap / toggle button)
  // When in focus mode (e.g. editing a case), automatically force collapse sidebar
  const isCollapsed = isFocusMode ? true : (externalSidebarCollapsed !== undefined ? externalSidebarCollapsed : internalCollapsed);

  React.useEffect(() => {
    if (isFocusMode) {
      setIsSidebarOpen(false);
    }
  }, [isFocusMode]);

  const toggleCollapse = () => {
    if (onToggleSidebarCollapse) {
      onToggleSidebarCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // Drag Resizing Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleDoubleClick = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    sidebarWidthRef.current = DEFAULT_SIDEBAR_WIDTH;
    setInternalCollapsed(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(DEFAULT_SIDEBAR_WIDTH));
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const clientX = e.clientX;

      if (clientX < COLLAPSE_THRESHOLD) {
        // Snap collapse into Hamburger
        setInternalCollapsed(true);
      } else {
        const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, clientX));
        setSidebarWidth(clamped);
        sidebarWidthRef.current = clamped;
        setInternalCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem(STORAGE_KEY, String(sidebarWidthRef.current));
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    closeSidebar();
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-100/70 text-slate-800 font-sans relative">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Floating Re-Open Sidebar Button when Collapsed (Hidden in Focus Mode) */}
      <AnimatePresence>
        {isCollapsed && !isFocusMode && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            type="button"
            onClick={toggleCollapse}
            className="fixed top-3 left-3 z-40 hidden md:flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-300 shadow-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="เปิดเมนูด้านข้าง (Expand Sidebar)"
          >
            <Menu size={17} />
          </motion.button>
        )}
      </AnimatePresence>

      <aside
        style={{
          width: isCollapsed ? 0 : `${sidebarWidth}px`,
        }}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white shadow-xs md:static relative select-none ${
          isResizing ? 'transition-none' : 'transition-[width,opacity] duration-200 ease-out'
        } ${
          isCollapsed
            ? 'w-0 overflow-hidden opacity-0 border-r-0 p-0 pointer-events-none'
            : 'px-4 py-6 opacity-100'
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Drag Resizer Handle on the Right Border (Desktop Only) */}
        {!isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className={`absolute top-0 right-0 bottom-0 w-2.5 translate-x-1/2 cursor-col-resize z-50 hidden md:flex items-center justify-center group hover:bg-amber-500/10 transition-colors ${
              isResizing ? 'bg-amber-500/20' : ''
            }`}
            title="คลิกลากเพื่อปรับขนาด (Double-click เพื่อคืนค่า 260px, ลากต่ำกว่า 180px เพื่อยุบ)"
          >
            {/* Visual Indicator Line */}
            <div
              className={`w-1 h-8 rounded-full transition-all duration-150 ${
                isResizing
                  ? 'bg-amber-500 scale-y-125'
                  : 'bg-slate-300 opacity-0 group-hover:opacity-100 group-hover:bg-amber-500'
              }`}
            />
          </div>
        )}

        <motion.div
          className="mb-8 flex cursor-pointer items-center justify-between gap-3 px-1"
          onClick={() => handleTabChange('overall')}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg bg-[#FEF3C7] text-[#92400E] font-bold p-1 border border-[#FDE68A]">
              <img src="/img/logo.png" alt="QSMS" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide text-slate-900 uppercase leading-tight">QSMS REWORK</h1>
              <span className="text-[10px] font-medium text-slate-500">Operation Center</span>
            </div>
          </div>
          {isFocusMode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              title="ย่อเมนู (Zen Mode)"
            >
              <X size={16} />
            </button>
          )}
        </motion.div>

        <nav className="flex-1 space-y-1">
          <SidebarItem
            active={activeTab === 'overall'}
            onClick={() => handleTabChange('overall')}
            label="ภาพรวม (Overall)"
            icon={<LayoutDashboard size={16} />}
          />
          {(['ADMIN', 'QSMS', 'MANAGEMENT'].includes(String(userRole || '').toUpperCase())) && (
            <SidebarItem
              active={activeTab === 'dashboard'}
              onClick={() => handleTabChange('dashboard')}
              label="แดชบอร์ด (Dashboard)"
              icon={<BarChart3 size={16} />}
            />
          )}
          <SidebarItem
            active={activeTab === 'add'}
            onClick={() => handleTabChange('add')}
            label="เปิดเคสใหม่ (Add Case)"
            icon={<Plus size={16} />}
          />
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
          <SidebarItem
            active={false}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
              }
              closeSidebar();
            }}
            label="DocAI Assistant"
            icon={<Bot size={16} className="text-[#D97706]" />}
          />
        </nav>

        <div className="mt-4 border-t border-slate-200/80 pt-4">
          <div 
            onClick={() => setIsPermissionsModalOpen(true)}
            className="group flex cursor-pointer items-center gap-2.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs transition-all hover:bg-slate-100 hover:border-slate-300"
            title="คลิกเพื่อดูสิทธิ์การใช้งาน"
          >
            {/* User Avatar Circle */}
            <div className="w-7 h-7 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold flex items-center justify-center text-xs uppercase">
              {userName ? userName.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate leading-tight mb-0.5">{userName || 'User'}</p>
              <span className="inline-flex rounded px-1.5 py-0.5 bg-[#FEF3C7] text-[11px] font-semibold text-[#92400E] border border-[#FDE68A]">
                {String(userRole || 'Admin')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 cursor-pointer"
          >
            <LogOut size={15} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-transparent">
        {/* Mobile Header (Hidden in Focus Mode) */}
        {!isFocusMode && (
          <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold text-xs">
                Q
              </div>
              <span className="text-sm font-bold text-slate-900">QSMS Rework</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPermissionsModalOpen(true)}
                className="inline-flex rounded-md bg-[#FEF3C7] px-2.5 py-0.5 text-[10px] font-semibold text-[#92400E] border border-[#FDE68A]"
                title="สิทธิ์การใช้งาน"
              >
                {String(userRole || 'Admin')}
              </button>

              <button
                onClick={toggleSidebar}
                className="rounded-md p-1.5 text-slate-700 hover:bg-slate-100"
              >
                {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        )}

        {children}
      </main>

      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        userName={userName}
        userRole={userRole}
      />
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
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
        active
          ? 'bg-[#FEF9E7] text-[#92400E] font-semibold border border-[#FDE68A]/80 shadow-2xs'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
      }`}
    >
      {icon && <span className={`shrink-0 transition-colors ${active ? 'text-[#D97706]' : 'text-slate-400'}`}>{icon}</span>}
      <span className="whitespace-nowrap leading-normal">{label}</span>
    </button>
  );
}
