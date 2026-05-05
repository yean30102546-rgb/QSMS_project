import React from 'react';
import { motion } from 'motion/react';

import { Dashboard } from './Dashboard';

interface DashboardTabProps {
  cases: any[];
  isLoadingCases: boolean;
  isLoadingMaster: boolean;
}

export function DashboardTab({
  cases,
  isLoadingCases,
  isLoadingMaster,
}: DashboardTabProps) {
  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <header>
        <p className="text-sm text-muted font-medium mb-1">
          {new Date().toLocaleDateString('th-TH', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </p>
        <h1 className="text-3xl font-medium tracking-tight text-foreground">
          แดชบอร์ด &amp; สถิติ
        </h1>
      </header>

      <Dashboard cases={cases} isLoading={isLoadingCases || isLoadingMaster} />
    </motion.div>
  );
}