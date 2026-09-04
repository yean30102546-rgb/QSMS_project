'use client';

/**
 * QSMS Rework Management System
 * Root orchestration for auth, portal routing, and module entry points
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';

import { portalAppRegistry } from './modules/platform/appRegistry';
import type { AppView } from './modules/platform/types';
import { getCurrentUser, isAuthenticated as authIsAuthenticated, logout as authLogout, restoreSession, type User } from './services/auth';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastContainer } from '@/src/components/shared/Toast';
import { AlertModal } from '@/src/components/shared/AlertModal';
import { FeedbackModal } from '@/src/components/shared/FeedbackModal';
import { Bot } from 'lucide-react';

const WorkspacePortal = dynamic(() => import('./components/apps/portal/WorkspacePortal').then(mod => mod.WorkspacePortal), { ssr: false });
const Login = dynamic(() => import('@/src/modules/auth/views/Login').then(mod => mod.Login), { ssr: false });
const ForgotPassword = dynamic(() => import('@/src/modules/auth/views/ForgotPassword').then(mod => mod.ForgotPassword), { ssr: false });
const StorageApp = dynamic(() => import('./modules/storage/StorageApp').then(mod => mod.StorageApp), { ssr: false });
const ReworkApp = dynamic(() => import('./modules/rework/ReworkApp').then(mod => mod.ReworkApp), { ssr: false });
const GuideApp = dynamic(() => import('./modules/guide/GuideApp').then(mod => mod.GuideApp), { ssr: false });
const RagApp = dynamic(() => import('./modules/rag/RagApp').then(mod => mod.RagApp), { ssr: false });
const AdminMonitorApp = dynamic(() => import('./modules/admin/AdminMonitorApp').then(mod => mod.AdminMonitorApp), { ssr: false });

function AuthWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, _setCurrentView] = useState<AppView>('portal');
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<AppView | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRagOpen, setIsRagOpen] = useState(false);
  const [isRagPillDragging, setIsRagPillDragging] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const setCurrentView = (view: AppView) => {
    _setCurrentView(view);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('currentView', view);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await restoreSession();
      const authenticated = authIsAuthenticated();
      const currentUser = getCurrentUser();

      setIsAuthenticated(authenticated);
      setAppUser(currentUser);

      if (typeof window !== 'undefined') {
        const savedView = sessionStorage.getItem('currentView') as AppView | null;
        if (authenticated) {
          if (savedView && savedView !== 'login') {
            if (savedView === 'storage' && currentUser?.role?.toUpperCase() === 'OPERATOR') {
              setCurrentView('portal');
            } else {
              setCurrentView(savedView);
            }
          } else {
            setCurrentView('portal');
          }
        } else {
          if (savedView && savedView !== 'portal') {
            if (savedView !== 'login') {
              setRedirectAfterLogin(savedView);
            }
            setCurrentView('login');
          } else {
            setCurrentView('portal');
          }
        }
      } else {
        setCurrentView('portal');
      }
      setAuthLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle RagApp with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsRagOpen(prev => !prev);
      }
    };
    const handleOpenFeedback = () => {
      setIsFeedbackOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-feedback-modal', handleOpenFeedback);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-feedback-modal', handleOpenFeedback);
    };
  }, []);

  const refreshAuth = (authenticated = false) => {
    if (authenticated) {
      setIsAuthenticated(true);
      setAppUser(getCurrentUser());
      if (redirectAfterLogin) {
        setCurrentView(redirectAfterLogin);
        setRedirectAfterLogin(null);
      } else {
        setCurrentView('portal');
      }
      return;
    }

    const stillAuthenticated = authIsAuthenticated();
    setIsAuthenticated(stillAuthenticated);
    setAppUser(getCurrentUser());
    if (stillAuthenticated) {
      if (redirectAfterLogin) {
        setCurrentView(redirectAfterLogin);
        setRedirectAfterLogin(null);
      } else {
        setCurrentView('portal');
      }
    } else {
      setCurrentView('login');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // 1500ms delay to allow the shrink and blur animations to run beautifully
    setTimeout(async () => {
      await authLogout();
      setIsAuthenticated(false);
      setAppUser(null);
      setCurrentView('portal');

      // Keep overlay active briefly while page switches, then fade out
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 300);
    }, 1500);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-accent"
        />
      </div>
    );
  }

  // Render the current view
  let content = null;
  if (currentView === 'login') {
    content = (
      <Login
        onSuccess={refreshAuth}
        onBack={() => {
          setRedirectAfterLogin(null);
          setCurrentView('portal');
        }}
        onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
      />
    );
  } else if (currentView === 'forgot-password') {
    content = (
      <ForgotPassword
        onSuccess={() => {
          setCurrentView('login');
        }}
        onBackToLogin={() => setCurrentView('login')}
      />
    );
  } else if (currentView === 'portal') {
    content = (
      <WorkspacePortal
        user={appUser}
        apps={portalAppRegistry}
        onOpenApp={(route) => {
          if (route === 'portal') {
            setCurrentView('portal');
          } else if (isAuthenticated) {
            if (route === 'storage') {
              const upperRole = appUser?.role?.toUpperCase();
              const isRestrictedRole = upperRole === 'OPERATOR';
              if (isRestrictedRole) {
                return;
              }
            } else if (route === 'admin') {
              const upperRole = appUser?.role?.toUpperCase();
              if (upperRole !== 'ADMIN' && upperRole !== 'QSMS') {
                return;
              }
            }
            setCurrentView(route);
          } else {
            setRedirectAfterLogin(route);
            setCurrentView('login');
          }
        }}
        onLogout={handleLogout}
        onLogin={() => {
          setRedirectAfterLogin('rework');
          setCurrentView('login');
        }}
        onOpenRag={() => setIsRagOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />
    );
  } else if (currentView === 'storage') {
    content = <StorageApp user={appUser} onBackToPortal={() => setCurrentView('portal')} />;
  } else if (currentView === 'guide') {
    content = <GuideApp onBackToPortal={() => setCurrentView('portal')} />;
  } else if (currentView === 'admin') {
    content = <AdminMonitorApp user={appUser} onBackToPortal={() => setCurrentView('portal')} />;
  } else {
    content = <ReworkApp user={appUser} onLogout={handleLogout} onBackToPortal={() => setCurrentView('portal')} />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent">
      {/* iOS style spinner keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes ios-spinner-fade {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}} />

      {/* Main View Wrapper with scale-down and opacity exit effects */}
      <motion.div
        animate={isLoggingOut ? {
          scale: 0.98,
          opacity: 0.3,
        } : {
          scale: 1,
          opacity: 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 20,
          mass: 0.8
        }}
        className="w-full h-screen overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.01, filter: 'blur(4px)' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Global RAG Chat Modal */}
      <RagApp user={appUser} open={isRagOpen} onOpenChange={setIsRagOpen} />

      {/* Global Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        activeView={currentView}
      />

      {/* Global Floating Glassmorphic AI Pill Button (Draggable) */}
      {currentView !== 'login' && currentView !== 'forgot-password' && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          dragTransition={{ power: 0, timeConstant: 0 }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onDragStart={() => setIsRagPillDragging(true)}
          onDragEnd={() => {
            setTimeout(() => setIsRagPillDragging(false), 120);
          }}
          onClick={() => {
            if (!isRagPillDragging) {
              setIsRagOpen(true);
            }
          }}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[99] flex items-center gap-2 p-2.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:border-[#FDE68A] text-slate-800 font-medium text-xs group cursor-grab active:cursor-grabbing select-none touch-none transition-colors duration-150"
          title="คลิกซ้ายค้างเพื่อย้ายตำแหน่ง | กดเพื่อใช้ DocAI Assistant (Ctrl+K)"
        >
          <div className="relative flex items-center justify-center w-5 h-5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold">
            <Bot size={13} />
          </div>
          <span className="hidden sm:inline font-sans text-xs text-slate-700 font-medium">DocAI Assistant</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-50 rounded border border-slate-200/70">
            Ctrl+K
          </span>
        </motion.div>
      )}

      {/* Clean Enterprise Logout Overlay */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg max-w-xs w-[85%]"
            >
              <div className="flex justify-center mb-4">
                <div className="h-8 w-8 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 font-sans">
                กำลังออกจากระบบอย่างปลอดภัย
              </h3>

              <p className="mt-1.5 text-xs text-slate-500 font-sans">
                ล้างข้อมูลเซสชันและการเชื่อมต่อสำเร็จ
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthWrapper />
      <ToastContainer />
      <AlertModal />
    </NotificationProvider>
  );
}
