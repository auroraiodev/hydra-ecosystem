import dynamic from 'next/dynamic';

export const MaintenanceView = dynamic(() =>
  import('./MaintenanceView').then((mod) => mod.MaintenanceView)
);
