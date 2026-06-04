// Just mapping out ReworkApp.tsx
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { MainLayout } from '../../components/layout/MainLayout';
import { TutorialModal } from '../../components/modals/TutorialModal';
import { ReworkDataProvider } from '../../contexts/ReworkDataContext';
import { setGasWebAppUrl } from '../../services/api';
import type { User } from '../../services/auth';

const OverallTab = React.lazy(async () => {
  const mod = await import('../../components/tabs/OverallTab');
  return { default: mod.OverallTab };
});

const AddCaseTab = React.lazy(async () => {
  const mod = await import('../../components/tabs/AddCaseTab');
  return { default: mod.AddCaseTab };
});

const DashboardTab = React.lazy(async () => {
  const mod = await import('../../components/tabs/DashboardTab');
  return { default: mod.DashboardTab };
});

type Tab = 'overall' | 'add' | 'dashboard';

interface ReworkAppProps {
  user: User | null;
  onLogout: () => void;
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

function ReworkAppContent({ user, onLogout, onBackToPortal }: ReworkAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overall');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  useEffect(() => {
    const GAS_WEB_APP_URL = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();
    setGasWebAppUrl(GAS_WEB_APP_URL);
  }, []);

  return (
    <>
      <MainLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        onBackToPortal={onBackToPortal}
        userName={user?.name || ''}
        userRole={user?.role || ''}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      >
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
                <OverallTab userRole={user?.role || ''} userName={user?.name || ''} />
              </motion.div>
            )}

            {activeTab === 'add' && String(user?.role || '').toUpperCase() !== 'FINANCE' && (
              <motion.div
                key="add"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-x-hidden overflow-y-auto"
              >
                <div className="p-8 md:p-10 lg:p-12">
                  <AddCaseTab />
                </div>
              </motion.div>
            )}

            {activeTab === 'dashboard' && String(user?.role || '').toUpperCase() === 'QSMS' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-x-hidden overflow-y-auto"
              >
                <div className="p-8 md:p-10 lg:p-12">
                  <DashboardTab />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </MainLayout>

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </>
  );
}

export function ReworkApp(props: ReworkAppProps) {
  return (
    <ReworkDataProvider>
      <ReworkAppContent {...props} />
    </ReworkDataProvider>
  );
}
