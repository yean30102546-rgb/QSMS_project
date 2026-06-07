'use client';

import React, { Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, LayoutDashboard, LogOut, Plus, HelpCircle, X, Menu, ArrowLeft } from 'lucide-react';

import type { ReworkCase, ReworkItem } from '../../services/api';
import type { User } from '../../services/auth';
import { PermissionsModal } from '../modals/PermissionsModal';

const OverallTab = React.lazy(async () => {
  const mod = await import('../tabs/OverallTab');
  return { default: mod.OverallTab };
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
  onOpenTutorial: () => void;
  onBackToPortal: () => void;
  children: React.ReactNode;
}

export function MainLayout({
  activeTab,
  setActiveTab,
  onLogout,
  userName,
  userRole = '',
  onOpenTutorial,
  onBackToPortal,
  children,
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    closeSidebar();
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED] text-on-surface font-sans">
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
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-slate-200 bg-white px-5 py-8 shadow-sm transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <motion.div
          className="mb-14 flex cursor-pointer items-center gap-3 px-2"
          onClick={() => handleTabChange('overall')}
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 border border-slate-200 p-1">
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
          {String(userRole || '').toUpperCase() !== 'FINANCE' && (
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

        {String(userRole || '').toUpperCase() === 'QSMS' && (
          <div className="mt-auto border-t border-slate-200 pt-8">
            <SidebarItem
              active={activeTab === 'dashboard'}
              onClick={() => handleTabChange('dashboard')}
              label="แดชบอร์ด (Dashboard)"
              icon={<BarChart3 size={16} />}
            />
          </div>
        )}

        <div className="mt-8 border-t border-slate-200 pt-8">
          <div 
            onClick={() => setIsPermissionsModalOpen(true)}
            className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-3 text-sm transition-all hover:bg-slate-100 hover:border-slate-300"
            title="คลิกเพื่อดูสิทธิ์การใช้งาน"
          >
            {/* User Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs group-hover:bg-primary group-hover:text-white transition-all uppercase">
              {userName ? userName.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 truncate leading-tight mb-0.5">{userName || 'User'}</p>
              <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {String(userRole || 'Admin')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-on-surface-variant transition-all hover:bg-red-500/10 hover:text-red-600 active:scale-95"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden bg-transparent">
        {/* Mobile Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">

          <div className="flex items-center gap-2">
            <img src="/img/logo.png" alt="" className="h-8 object-contain" />
            <span className="text-sm font-bold">QSMS Rework</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Clickable Mobile Role Badge */}
            <button
              onClick={() => setIsPermissionsModalOpen(true)}
              className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors"
              title="สิทธิ์การใช้งาน"
            >
              {String(userRole || 'Admin')}
            </button>

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
        </div>

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
    <motion.button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`sidebar-item mb-2 flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${active
        ? 'bg-primary/10 text-primary'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`}
    >
      {icon && <span className={`transition-colors ${active ? 'text-primary' : 'text-on-surface-variant'}`}>{icon}</span>}
      <span>{label}</span>
    </motion.button>
  );
}
