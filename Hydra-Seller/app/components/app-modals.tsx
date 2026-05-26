'use client';

import { useModal } from './providers/modal-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ArrowSync24Regular } from '@fluentui/react-icons';

export function AppModals() {
  const { modalType, modalProps, hideModal } = useModal();

  return (
    <>
      <AlertDialog
        open={modalType === 'confirmation'}
        onOpenChange={(_, data) => !data.open && hideModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalProps.title || 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {modalProps.message || 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={modalProps.onCancel}>
              {modalProps.cancelText || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                // Prevent closing if action needs time (though typically onConfirm handles loading state)
                if (modalProps.onConfirm) {
                  await modalProps.onConfirm();
                }
                hideModal();
              }}
              className={
                modalProps.type === 'danger'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {modalProps.confirmText || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={modalType === 'loading'}
        onOpenChange={() => {
          /* Blocking */
        }}
      >
        <DialogContent
          className="sm:max-w-[425px] flex flex-col items-center justify-center py-10 gap-4 [&>button]:hidden"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Loading</DialogTitle>
          <ArrowSync24Regular className="size-10 animate-spin text-primary" />
          <p className="text-lg font-medium">{modalProps.message || 'Loading...'}</p>
        </DialogContent>
      </Dialog>

      {modalType === 'custom' && modalProps.customComponent && (
        <Dialog open={true} onOpenChange={(_, data) => !data.open && hideModal()}>
          <DialogContent>{modalProps.customComponent as React.ReactElement}</DialogContent>
        </Dialog>
      )}
    </>
  );
}
