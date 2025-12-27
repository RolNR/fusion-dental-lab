import { requireAuth } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import { LabCollaboratorNav } from '@/components/lab-collaborator/LabCollaboratorNav';

export const metadata = {
  title: 'Panel de Colaborador | LabWiseLink',
  description: 'Panel de colaborador del laboratorio',
};

export default async function LabCollaboratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  // Only LAB_COLLABORATOR can access this area
  if (session.user.role !== Role.LAB_COLLABORATOR) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-muted">
      <LabCollaboratorNav />
      <main>{children}</main>
    </div>
  );
}
