import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClinicStaffNav } from '@/components/clinic-staff/ClinicStaffNav';

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== 'DOCTOR') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ClinicStaffNav basePath="/doctor" />
      <main>{children}</main>
    </div>
  );
}
