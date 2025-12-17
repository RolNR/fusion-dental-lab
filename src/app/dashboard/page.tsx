import { requireAuth } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { UserInfoCard } from '@/components/dashboard/UserInfoCard';
import { ComingSoonCard } from '@/components/dashboard/ComingSoonCard';

export const metadata = {
  title: 'Panel Principal | LabWiseLink',
  description: 'Panel de control principal',
};

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader userName={session.user.name} />

        <div className="mb-6">
          <UserInfoCard
            name={session.user.name}
            email={session.user.email}
            role={session.user.role}
          />
        </div>

        {session.user.role === Role.LAB_ADMIN && (
          <ComingSoonCard message="Panel de administración del laboratorio - Gestiona clínicas y colaboradores" />
        )}

        {session.user.role === Role.LAB_COLLABORATOR && (
          <ComingSoonCard message="Panel de colaborador del laboratorio - Ver órdenes de todas las clínicas" />
        )}

        {session.user.role === Role.CLINIC_ADMIN && (
          <ComingSoonCard message="Panel de administración de clínica - Gestiona doctores y asistentes" />
        )}

        {session.user.role === Role.DOCTOR && (
          <ComingSoonCard message="Panel de doctor - Ver y crear tus órdenes" />
        )}

        {session.user.role === Role.CLINIC_ASSISTANT && (
          <ComingSoonCard message="Panel de asistente - Crear órdenes para tus doctores asignados" />
        )}
      </div>
    </div>
  );
}
