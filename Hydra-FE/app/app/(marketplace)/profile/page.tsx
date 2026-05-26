'use client';

import { useState } from 'react';
import { ProfileMobileView, ProfileDesktopView, ProfileEditModal } from '@/features/profile';

export default function ProfilePage() {
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <>
      <div className="md:hidden">
        <ProfileMobileView onEditProfile={() => setShowProfileModal(true)} />
      </div>
      <div className="hidden md:block">
        <ProfileDesktopView onEditProfile={() => setShowProfileModal(true)} />
      </div>

      <ProfileEditModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}
