'use client';

/**
 * QSMS Rework Management System
 * Root orchestration for auth, portal routing, and module entry points
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
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
    await authLogout();
    setIsAuthenticated(false);
    setAppUser(null);
    setCurrentView('portal');
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

  if (currentView === 'login') {
    return (
      <Login
        onSuccess={refreshAuth}
        onBack={() => {
          setRedirectAfterLogin(null);
          setCurrentView('portal');
        }}
      />
    );
  }

  if (currentView === 'portal') {
    return (
      <WorkspacePortal
        user={appUser}
        apps={portalAppRegistry}
        onOpenApp={(route) => {
          if (route === 'portal') {
            setCurrentView('portal');
          } else if (isAuthenticated) {
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
  }

  if (currentView === 'roster') {
    return <RosterApp user={appUser} onBackToPortal={() => setCurrentView('portal')} />;
  }

  return <ReworkApp user={appUser} onLogout={refreshAuth} onBackToPortal={() => setCurrentView('portal')} />;
}

export default function App() {
  return <AuthWrapper />;
}
