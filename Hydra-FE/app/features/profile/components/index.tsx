import dynamic from 'next/dynamic';

export const ProfileDesktopView = dynamic(() =>
  import('./ProfileDesktopView').then((mod) => mod.ProfileDesktopView)
);
export const ProfileMobileView = dynamic(() =>
  import('./ProfileMobileView').then((mod) => mod.ProfileMobileView)
);
export const ProfileEditModal = dynamic(() =>
  import('./ProfileEditModal').then((mod) => mod.ProfileEditModal)
);
