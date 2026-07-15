import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UpdateModalProvider, useUpdateModal } from './UpdateModalContext';
import { UpdateModalEdit } from './UpdateModalEdit';
import { UpdateModalView } from './UpdateModalView';
import { ReworkCase } from '@/src/services/api';
import { UserRole } from '@/src/config/auth.config';

interface UpdateModalProps {
  isOpen: boolean;
  caseData: ReworkCase | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdate: (caseId: string, updates: Partial<ReworkCase>) => Promise<void>;
  onDelete?: (caseId: string) => Promise<void>;
  inline?: boolean;
  userRoleOverride?: UserRole;
}

export function UpdateModal(props: UpdateModalProps) {
  return (
    <UpdateModalProvider {...props}>
      <UpdateModalContent />
    </UpdateModalProvider>
  );
}

function UpdateModalContent() {
  const { isEditMode, isOpen, handleRequestClose, editExitIntent, inline } = useUpdateModal();
  
  if (typeof document === 'undefined') return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleRequestClose}
            className={`${inline ? 'absolute' : 'fixed'} inset-0 bg-black/35 z-40 will-change-opacity`}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`${inline ? 'absolute' : 'fixed'} top-0 left-0 w-full ${inline ? 'h-full' : 'h-[100dvh]'} z-50 flex items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 pointer-events-none will-change-transform`}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: editExitIntent ? 0.6 : 1, y: 0, scale: editExitIntent ? 0.98 : 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden={!!editExitIntent}
              className="pointer-events-auto w-full max-w-6xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] will-change-transform rounded-[24px] sm:rounded-[16px] overflow-hidden shadow-2xl"
            >
              {isEditMode ? <UpdateModalEdit /> : <UpdateModalView />}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
