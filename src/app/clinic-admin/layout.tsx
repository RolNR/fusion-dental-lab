import { requireAuth } from '@/lib/auth-helpers';
import { ClinicAdminNav } from '@/components/clinic-admin/ClinicAdminNav';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

export default async function ClinicAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  // Only CLINIC_ADMIN can access this section
  if (session.user.role !== Role.CLINIC_ADMIN) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-muted">
      <ClinicAdminNav />
      <main>{children}</main>
    </div>
  );
}
