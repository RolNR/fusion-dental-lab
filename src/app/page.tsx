import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRoleBasedRedirect } from '@/lib/redirect-helpers';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect to role-based dashboard if logged in, otherwise to login
  if (session?.user?.role) {
    redirect(getRoleBasedRedirect(session.user.role));
  } else {
    redirect('/auth/login');
  }
}
