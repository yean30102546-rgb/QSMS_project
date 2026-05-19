/**
 * QSMS Rework Management System
 * Root orchestration for auth, portal routing, and module entry points
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

import { WorkspacePortal } from './components/apps/portal/WorkspacePortal';
import { Login } from './components/Login';
import { portalAppRegistry } from './modules/platform/appRegistry';
import type { AppView } from './modules/platform/types';
import { RosterApp } from './modules/roster/RosterApp';
import { ReworkApp } from './modules/rework/ReworkApp';
import { getCurrentUser, isAuthenticated as authIsAuthenticated, logout as authLogout, type User } from './services/auth';

function AuthWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('login');

  useEffect(() => {
    const authenticated = authIsAuthenticated();
    const currentUser = getCurrentUser();

    setIsAuthenticated(authenticated);
    setAppUser(currentUser);
    setCurrentView(authenticated ? 'portal' : 'login');
    setAuthLoading(false);
  }, []);

  const refreshAuth = (authenticated = false) => {
    if (authenticated) {
      setIsAuthenticated(true);
      setAppUser(getCurrentUser());
      setCurrentView('portal');
      return;
    }

    const stillAuthenticated = authIsAuthenticated();
    setIsAuthenticated(stillAuthenticated);
    setAppUser(getCurrentUser());
    setCurrentView(stillAuthenticated ? 'portal' : 'login');
  };

  const handleLogout = async () => {
    await authLogout();
    setIsAuthenticated(false);
    setAppUser(null);
    setCurrentView('login');
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

  if (!isAuthenticated) {
    return <Login onSuccess={refreshAuth} />;
  }

  if (currentView === 'portal') {
    return (
      <WorkspacePortal
        user={appUser}
        apps={portalAppRegistry}
        onOpenApp={(route) => setCurrentView(route)}
        onLogout={handleLogout}
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
