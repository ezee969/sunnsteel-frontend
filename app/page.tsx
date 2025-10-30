import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  // This will redirect to /dashboard if authenticated, or /login if not
  const cookieStore = await cookies();
  const secureSession = cookieStore.get('ss_session')?.value === '1';
  const clientMarker = cookieStore.get('has_session')?.value === '1';
  const hasValidSession = secureSession || clientMarker;

  if (hasValidSession) {
    redirect('/dashboard');
  }

  redirect('/login');
}
