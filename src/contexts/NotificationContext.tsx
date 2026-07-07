import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type AlertType = 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
}

export interface AlertProps {
  message: string;
  type: AlertType | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  toasts: ToastProps[];
  alert: AlertProps | null;
  showToast: (message: string, type?: ToastType) => void;
  showAlert: (message: string, type?: AlertType, onConfirm?: () => void) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  removeToast: (id: string) => void;
  closeAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [alert, setAlert] = useState<AlertProps | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const showAlert = useCallback((message: string, type: AlertType = 'error', onConfirm?: () => void) => {
    setAlert({ message, type, onConfirm });
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void, onCancel?: () => void) => {
    setAlert({ message, type: 'confirm', onConfirm, onCancel });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, alert, showToast, showAlert, showConfirm, removeToast, closeAlert }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
