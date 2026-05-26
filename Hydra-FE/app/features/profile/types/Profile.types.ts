export interface ProfileDesktopViewProps {
  onEditProfile: () => void;
}

export interface ProfileMobileViewProps {
  onEditProfile: () => void;
}

export interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}
