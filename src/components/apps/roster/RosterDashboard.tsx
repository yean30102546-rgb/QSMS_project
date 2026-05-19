import React from 'react';
import { ArrowLeft, CalendarRange, LayoutTemplate, Users } from 'lucide-react';
import { motion } from 'motion/react';

import type { User } from '../../../services/auth';

interface RosterDashboardProps {
  user: User | null;
  onBackToPortal: () => void;
}

export function RosterDashboard({ user, onBackToPortal }: RosterDashboardProps) {
  return (
    <div className="apple-shell min-h-screen overflow-y-auto">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-5 py-6 md:px-8 lg:px-10">
        <div className="apple-card mb-8 flex items-center justify-between rounded-[28px] px-5 py-4">
          <button
            type="button"
            onClick={onBackToPortal}
            className="apple-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
          >
            <ArrowLeft size={15} />
            Back to Portal
          </button>
          <div className="text-right">
            <p className="apple-subtle text-[11px] font-semibold uppercase tracking-[0.22em]">Roster Module</p>
            <p className="text-sm text-[#424245]">{user?.name || 'Authenticated user'}</p>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="apple-surface-dark rounded-[36px] px-7 py-10 shadow-[0_32px_72px_rgba(0,0,0,0.18)] md:px-10"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">ShiftHub Roster</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-5xl">
            Modular route is ready. The scheduling experience can be mounted here next.
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-7 text-white/72">
            This placeholder keeps the new platform routing honest while we preserve Rework in production.
            The future timeline dashboard, request modal, and employee scheduling grid will plug into this module.
          </p>
        </motion.section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <InfoCard
            icon={<CalendarRange size={18} />}
            title="Route prepared"
            description="State-based routing now recognizes a dedicated roster entry point."
          />
          <InfoCard
            icon={<LayoutTemplate size={18} />}
            title="Shell isolated"
            description="This page sits outside the Rework layout, which is important for modular separation."
          />
          <InfoCard
            icon={<Users size={18} />}
            title="Next phase ready"
            description="Roster can be developed as an independent feature module without disturbing Rework logic."
          />
        </section>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="apple-surface-light rounded-[28px] p-6 shadow-[0_20px_40px_rgba(15,23,42,0.05)]"
    >
      <div className="apple-chip mb-4 flex h-11 w-11 items-center justify-center text-[var(--color-apple-blue)]">
        {icon}
      </div>
      <h2 className="apple-heading text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#424245]">{description}</p>
    </motion.article>
  );
}
