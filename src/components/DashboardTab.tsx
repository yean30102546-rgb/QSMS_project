import React from 'react';
import { motion } from 'motion/react';

import type { ReworkCase } from '../services/api';
import { Dashboard } from './Dashboard';

interface DashboardTabProps {
  cases: ReworkCase[];
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
        <p className="mb-1 text-sm font-medium text-muted">
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
