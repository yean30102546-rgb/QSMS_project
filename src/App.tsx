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
import { getCurrentUser, isAuthenticated as authIsAuthenticated, logout as authLogout, type User } from './services/auth';

const WorkspacePortal = dynamic(() => import('./components/apps/portal/WorkspacePortal').then(mod => mod.WorkspacePortal), { ssr: false });
const Login = dynamic(() => import('./components/Login').then(mod => mod.Login), { ssr: false });
const RosterApp = dynamic(() => import('./modules/roster/RosterApp').then(mod => mod.RosterApp), { ssr: false });
const ReworkApp = dynamic(() => import('./modules/rework/ReworkApp').then(mod => mod.ReworkApp), { ssr: false });

function AuthWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('portal');
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<AppView | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const authenticated = authIsAuthenticated();
    const currentUser = getCurrentUser();

    setIsAuthenticated(authenticated);
    setAppUser(currentUser);
    setCurrentView('portal');
    setAuthLoading(false);
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
            if (route === 'roster') {
              const isRestrictedRole = appUser?.role === 'wfg' || appUser?.role === 'operator' || appUser?.role === 'pdb';
              if (isRestrictedRole) {
                // Ignore roster navigation for restricted roles
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
        onLogin={() => setCurrentView('login')}
      />
    );
  } else if (currentView === 'roster') {
    content = <RosterApp user={appUser} onBackToPortal={() => setCurrentView('portal')} />;
  } else {
    content = <ReworkApp user={appUser} onLogout={handleLogout} onBackToPortal={() => setCurrentView('portal')} />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent">
      {/* iOS style spinner keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ios-spinner-fade {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}} />

      {/* Main View Wrapper with scale-down and opacity exit effects (no filter to avoid stacking context issues) */}
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
          stiffness: 80,
          damping: 18,
          mass: 0.8
        }}
        className="w-full h-full min-h-screen"
      >
        {content}
      </motion.div>

      {/* Premium Apple-Style Glassmorphic Logout Overlay */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-[16px]"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="relative overflow-hidden rounded-[28px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-[#1c1c1e]/50 p-8 text-center shadow-[0_16px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl max-w-xs w-[85%]"
            >
              {/* Subtle background glow spots */}
              <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-white/30 dark:bg-white/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-white/25 dark:bg-white/5 blur-3xl pointer-events-none" />

              {/* Apple-style iOS spoke spinner */}
              <div className="flex justify-center mb-6">
                <div className="relative h-8 w-8 flex items-center justify-center">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 left-[14.75px] w-[2.5px] h-[7.5px] bg-[#1d1d1f] dark:bg-white rounded-[1.25px]"
                      style={{
                        transform: `rotate(${i * 30}deg)`,
                        transformOrigin: '1.25px 16px',
                        animation: 'ios-spinner-fade 1.2s linear infinite',
                        animationDelay: `${(i - 12) * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <motion.h3 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-base font-semibold text-[#1d1d1f] dark:text-white tracking-wide font-sans"
              >
                กำลังออกจากระบบอย่างปลอดภัย
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-light font-sans"
              >
                ล้างข้อมูลเซสชันและการเชื่อมต่อสำเร็จ
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return <AuthWrapper />;
}
