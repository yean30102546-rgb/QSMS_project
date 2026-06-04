import React from 'react';
import { motion } from 'motion/react';

import type { ReworkCase } from '../../services/api';
import { Dashboard } from './Dashboard';

import { useReworkData } from '../../contexts/ReworkDataContext';

export function DashboardTab() {
  const { cases, isLoadingCases, isLoadingMaster } = useReworkData();
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <header className="px-1 py-2">
        <p className="mb-1 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          {new Date().toLocaleDateString('th-TH', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">
          แดชบอร์ด &amp; สถิติ
        </h1>
      </header>

      <Dashboard cases={cases} isLoading={isLoadingCases || isLoadingMaster} />
    </motion.div>
  );
}
