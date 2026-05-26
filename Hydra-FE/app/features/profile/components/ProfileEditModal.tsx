'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, FlowButton } from '@/features/shared';
import { useAuth } from '@/features/auth';
import { useToastContext } from '@/features/shared/components/ToastProvider';
import { updateProfile } from '@/lib/api/users';
import { CheckCircle2 } from 'lucide-react';
import { type ProfileEditModalProps } from '../types';

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { user, token, setCredentials } = useAuth();
  const { success: toastSuccess, error: toastError } = useToastContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    if (isOpen && user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
    }
  }, [isOpen, user]);

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      const updatedUser = await updateProfile(profileData);
      if (token) {
        setCredentials({ ...user, ...updatedUser }, token);
      }
      toastSuccess('Perfil actualizado correctamente');
      onClose();
    } catch (error) {
      console.error('Failed to update profile', error);
      toastError('Error al actualizar el perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const username = user?.username || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Información Personal">
      <div className="gap-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={profileData.first_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProfileData((prev) => ({ ...prev, first_name: e.target.value }))
            }
          />
          <Input
            label="Apellido"
            value={profileData.last_name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setProfileData((prev) => ({ ...prev, last_name: e.target.value }))
            }
          />
        </div>
        <Input
          label="Teléfono"
          value={profileData.phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = e.target.value.replace(/\D/g, '');
            const truncated = rawValue.slice(0, 10);
            let formatted = truncated;
            if (truncated.length > 0) {
              formatted = `(${truncated.slice(0, 2)}`;
              if (truncated.length > 2) formatted += `) ${truncated.slice(2, 6)}`;
              if (truncated.length > 6) formatted += ` ${truncated.slice(6, 10)}`;
            }
            setProfileData((prev) => ({ ...prev, phone: formatted }));
          }}
          placeholder="(55) 1234 5678"
          maxLength={14}
        />
        <Input
          label="Username"
          value={username}
          disabled
          className="bg-surface-high text-text-muted"
        />
        <Input
          label="Email"
          value={user?.email || ''}
          disabled
          className="bg-surface-high text-text-muted"
        />

        <div className="pt-4 flex gap-3">
          <FlowButton
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isUpdating}
          >
            Cancelar
          </FlowButton>
          <FlowButton onClick={handleUpdateProfile} disabled={isUpdating} className="flex-1">
            <span className="flex items-center justify-center gap-2">
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              {!isUpdating && <CheckCircle2 className="size-4" />}
            </span>
          </FlowButton>
        </div>
      </div>
    </Modal>
  );
}
