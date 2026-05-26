'use client';

import React, { createContext, use, useState, useCallback, ReactNode } from 'react';

export type ModalType = 'confirmation' | 'loading' | 'custom' | null;

export interface ModalProps {
  title?: string;
  message?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  customComponent?: ReactNode;
}

interface ModalContextType {
  modalType: ModalType;
  modalProps: ModalProps;
  showConfirm: (props: ModalProps) => void;
  showLoading: (message?: string) => void;
  showCustom: (component: ReactNode) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalProps, setModalProps] = useState<ModalProps>({});

  const showConfirm = useCallback((props: ModalProps) => {
    setModalType('confirmation');
    setModalProps(props);
  }, []);

  const showLoading = useCallback((message: string = 'Loading...') => {
    setModalType('loading');
    setModalProps({ message });
  }, []);

  const showCustom = useCallback((component: ReactNode) => {
    setModalType('custom');
    setModalProps({ customComponent: component });
  }, []);

  const hideModal = useCallback(() => {
    setModalType(null);
    setModalProps({});
  }, []);

  return (
    <ModalContext.Provider
      value={{ modalType, modalProps, showConfirm, showLoading, showCustom, hideModal }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = use(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
