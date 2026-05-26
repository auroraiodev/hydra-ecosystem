import { Suspense } from 'react';
import UsersContent from './users-content';
import UsersLoading from './loading';

export const dynamic = 'force-dynamic';

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersLoading />}>
      <UsersContent />
    </Suspense>
  );
}
