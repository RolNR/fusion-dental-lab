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

        {session.user.role === Role.ADMIN && (
          <ComingSoonCard message="El panel de administración estará disponible próximamente" />
        )}

        {session.user.role === Role.DENTIST && (
          <ComingSoonCard message="El panel de órdenes para dentistas estará disponible próximamente" />
        )}

        {session.user.role === Role.LAB && (
          <ComingSoonCard message="El panel de órdenes para laboratorios estará disponible próximamente" />
        )}
      </div>
    </div>
  );
}
