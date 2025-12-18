import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClinicStaffNav } from '@/components/clinic-staff/ClinicStaffNav';

export default async function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'CLINIC_ASSISTANT') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ClinicStaffNav role="assistant" basePath="/assistant" />
      <main>{children}</main>
    </div>
  );
}
