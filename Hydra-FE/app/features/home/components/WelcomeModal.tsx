'use client';

import { useEffect, useReducer } from 'react';
import { useAuth } from '@/features/auth';
import { hasSeenModal, markModalAsSeen } from '@/lib/api/modal';
import { Modal, FlowButton, useTheme, usePublicSettings } from '@/features/shared';
import { resolveImageUrl } from '@/lib/utils/imageUrl';
import Image from 'next/image';

interface WelcomeState {
  isOpen: boolean;
  isChecking: boolean;
}

type WelcomeAction = { type: 'SHOW' } | { type: 'DONE' } | { type: 'CLOSE' };

function welcomeReducer(state: WelcomeState, action: WelcomeAction): WelcomeState {
  switch (action.type) {
    case 'SHOW':
      return { isOpen: true, isChecking: false };
    case 'DONE':
      return { ...state, isChecking: false };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

export const WelcomeModal: React.FC = () => {
  const { theme } = useTheme();
  const { token, isAuthenticated } = useAuth();
  const { settings } = usePublicSettings();
  const [{ isOpen, isChecking }, welcomeDispatch] = useReducer(welcomeReducer, {
    isOpen: false,
    isChecking: true,
  });

  useEffect(() => {
    const checkAndShowModal = async () => {
      // Only check for authenticated users
      if (!isAuthenticated || !token) {
        welcomeDispatch({ type: 'DONE' });
        return;
      }

      try {
        const seen = await hasSeenModal(token);
        if (!seen) {
          welcomeDispatch({ type: 'SHOW' });
        } else {
          welcomeDispatch({ type: 'DONE' });
        }
      } catch (error) {
        console.error('Error checking modal status:', error);
        welcomeDispatch({ type: 'DONE' });
      }
    };

    checkAndShowModal();
  }, [token, isAuthenticated]);

  const handleClose = async () => {
    if (token) {
      await markModalAsSeen(token);
    }
    welcomeDispatch({ type: 'CLOSE' });
  };

  if (isChecking || !isOpen) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-xl">
      <div className="flex flex-col items-center text-center gap-y-6 pt-2">
        {/* Logos Section */}
        <div className="flex items-center justify-center gap-6 w-full">
          <Image
            src={resolveImageUrl(settings.site_logo) || '/cat.png'}
            alt="Hydra Cat"
            width={96}
            height={96}
            sizes="96px"
            className="size-24 object-contain transform -rotate-6"
          />
          <div className="h-12 w-px bg-border-subtle"></div>
          <div
            className={`transition-all duration-300 ${theme === 'dark' ? 'bg-white rounded-lg px-3 py-1.5' : ''}`}
          >
            <Image
              src="/mercado.png"
              alt="Mercado Pago"
              width={225}
              height={50}
              className="w-[160px] h-[40px] object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </div>

        <div className="gap-y-2">
          <h2 className="text-2xl font-semibold text-text-body leading-tight">
            ¡Ahora aceptamos Mercado Pago!
          </h2>
          <p className="text-text-muted">
            Realiza tus pagos de forma más rápida, segura y sin comisiones extras.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-3 w-full text-left">
          <div className="bg-surface-low p-3 rounded-lg border border-border-subtle">
            <div className="font-semibold text-text-body text-sm mb-1">🛡️ 100% Seguro</div>
            <p className="text-xs text-text-muted">Protección total al comprador</p>
          </div>
          <div className="bg-surface-low p-3 rounded-lg border border-border-subtle">
            <div className="font-semibold text-text-body text-sm mb-1">⚡ Instantáneo</div>
            <p className="text-xs text-text-muted">Tu pedido se procesa al momento</p>
          </div>
          <div className="bg-surface-low p-3 rounded-lg border border-border-subtle">
            <div className="font-semibold text-text-body text-sm mb-1">💳 Flexible</div>
            <p className="text-xs text-text-muted">Tarjeta, débito y efectivo</p>
          </div>
          <div className="bg-surface-low p-3 rounded-lg border border-border-subtle">
            <div className="font-semibold text-text-body text-sm mb-1">💰 Sin Comisiones</div>
            <p className="text-xs text-text-muted">Nosotros cubrimos el costo</p>
          </div>
        </div>

        <FlowButton
          variant="default"
          onClick={handleClose}
          className="w-full bg-[#009EE3] hover:bg-[#008FCC] text-white font-bold py-3.5 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/20 h-auto"
        >
          ¡Entendido!
        </FlowButton>
      </div>
    </Modal>
  );
};
