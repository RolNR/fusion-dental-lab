import { requireAuth } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import { LabAdminNav } from '@/components/lab-admin/LabAdminNav';

export const metadata = {
  title: 'Panel de Administración | LabWiseLink',
  description: 'Panel de administración del laboratorio',
};

export default async function LabAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  // Only LAB_ADMIN can access this area
  if (session.user.role !== Role.LAB_ADMIN) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-muted">
      <LabAdminNav />
      <main>{children}</main>
    </div>
  );
}
