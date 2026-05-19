import React from 'react';
import { ArrowRight, Clock3, LayoutGrid, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

import type { User } from '../../../services/auth';
import type { PortalAppDefinition } from '../../../modules/platform/types';

interface WorkspacePortalProps {
  user: User | null;
  apps: PortalAppDefinition[];
  onOpenApp: (route: PortalAppDefinition['route']) => void;
  onLogout: () => void;
}

export function WorkspacePortal({
  user,
  apps,
  onOpenApp,
  onLogout,
}: WorkspacePortalProps) {
  const greetingName = user?.name || 'Workspace User';

  return (
    <div className="apple-shell min-h-screen overflow-y-auto">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-6 md:px-8 lg:px-12">
        <header className="apple-card mb-10 flex items-center justify-between rounded-[28px] px-5 py-4 md:px-7">
          <div className="flex items-center gap-3">
            <div className="apple-surface-dark flex h-11 w-11 items-center justify-center rounded-full">
              <LayoutGrid size={18} />
            </div>
            <div>
              <p className="apple-subtle text-[11px] font-semibold uppercase tracking-[0.24em]">Central Control</p>
              <h1 className="apple-heading text-lg font-semibold tracking-[-0.02em]">Operations Workspace</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="apple-btn-secondary px-4 py-2 text-sm font-medium"
          >
            Sign Out
          </button>
        </header>

        <section className="mb-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="apple-surface-light rounded-[36px] px-6 py-8 shadow-[0_30px_60px_rgba(15,23,42,0.06)] md:px-10 md:py-12"
          >
            <p className="apple-chip mb-3 inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              <Sparkles size={12} />
              Apple-inspired portal shell
            </p>
            <h2 className="apple-heading max-w-2xl text-4xl font-semibold leading-[1.04] md:text-5xl">
              Good day, {greetingName}. Choose the workspace you want to enter.
            </h2>
            <p className="mt-4 max-w-2xl text-[17px] leading-7 text-[#424245]">
              This central layer is the new top-level control for modular webapps. Rework stays fully operational,
              while Roster is prepared as the next feature space.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="apple-surface-dark grid gap-4 rounded-[36px] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.18)]"
          >
            <div className="rounded-[28px] bg-[#2a2a2c] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">Session</p>
              <p className="mt-3 text-xl font-semibold tracking-[-0.02em]">{user?.role?.toUpperCase() || 'USER'}</p>
              <p className="mt-2 text-sm leading-6 text-white/70">{user?.email || 'Authenticated via GAS token session'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] bg-[#252527] p-5">
                <div className="mb-3 flex items-center gap-2 text-white/80">
                  <ShieldCheck size={16} />
                  <span className="text-sm font-medium">Platform direction</span>
                </div>
                <p className="text-sm leading-6 text-white/70">Central auth, shared shell, and per-app modular entry points.</p>
              </div>
              <div className="rounded-[28px] bg-[#252527] p-5">
                <div className="mb-3 flex items-center gap-2 text-white/80">
                  <Clock3 size={16} />
                  <span className="text-sm font-medium">Migration status</span>
                </div>
                <p className="text-sm leading-6 text-white/70">Rework is active now. Roster is staged as the next mount point.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {apps.map((app, index) => {
            const isActive = app.status === 'active';
            const accentClasses =
              app.accent === 'blue'
                ? 'bg-[#f7fbff] border-[#d6e8ff] before:bg-[var(--color-apple-blue)]'
                : 'bg-[#fffaf2] border-[#f4dfaa] before:bg-[#c78b00]';

            return (
              <motion.article
                key={app.id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 + index * 0.08 }}
                className={`relative overflow-hidden rounded-[32px] border p-7 shadow-[0_22px_48px_rgba(15,23,42,0.05)] before:absolute before:inset-y-0 before:left-0 before:w-1 ${accentClasses}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="apple-subtle text-[11px] font-semibold uppercase tracking-[0.22em]">{app.subtitle}</p>
                    <h3 className="apple-heading mt-3 text-[32px] font-semibold leading-[1.06]">
                      {app.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      isActive ? 'bg-[#e8f3ff] text-[var(--color-apple-blue)]' : 'bg-[#f5efe1] text-[#8b6a12]'
                    }`}
                  >
                    {isActive ? 'Available' : 'Coming Soon'}
                  </span>
                </div>

                <p className="mt-5 max-w-xl text-[16px] leading-7 text-[#424245]">{app.description}</p>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <div className="text-sm text-[#6e6e73]">
                    {isActive ? 'Launch current production module' : 'Reserved modular route and shell entry'}
                  </div>
                  <button
                    type="button"
                    disabled={!isActive}
                    onClick={() => onOpenApp(app.route)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'apple-btn-primary'
                        : 'cursor-not-allowed bg-white text-[#9d9da3] ring-1 ring-[#d2d2d7]'
                    }`}
                  >
                    {isActive ? 'Launch App' : 'Preview Route'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </motion.article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
