'use client';

import { useModal } from './providers/modal-context';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { LoadingModal } from '@/components/ui/loading-modal';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function AppModals() {
  const { modalType, modalProps, hideModal } = useModal();

  return (
    <>
      <ConfirmModal
        open={modalType === 'confirmation'}
        onOpenChange={(open) => !open && hideModal()}
        title={modalProps.title || 'Are you sure?'}
        description={modalProps.message || 'This action cannot be undone.'}
        confirmText={modalProps.confirmText || 'Confirm'}
        cancelText={modalProps.cancelText || 'Cancel'}
        variant={modalProps.type === 'danger' ? 'danger' : 'default'}
        onConfirm={async () => {
          if (modalProps.onConfirm) {
            await modalProps.onConfirm();
          }
          hideModal();
        }}
        onCancel={modalProps.onCancel}
      />

      <LoadingModal
        open={modalType === 'loading'}
        message={modalProps.message || 'Loading...'}
      />

      {modalType === 'custom' && modalProps.customComponent && (
        <Dialog open={true} onOpenChange={(open) => !open && hideModal()}>
          {modalProps.customComponent}
        </Dialog>
      )}
    </>
  );
}
