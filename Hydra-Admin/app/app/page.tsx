import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login page — session check + role-based routing handled there.
  redirect('/login');
}
