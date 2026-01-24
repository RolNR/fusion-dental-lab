import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { StatsCard } from '@/components/lab-admin/StatsCard';
import { LabOrderNotifications } from '@/components/lab-shared/LabOrderNotifications';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function LabAdminDashboard() {
  const session = await requireAuth();
  const laboratoryId = session.user.laboratoryId;

  if (!laboratoryId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-4 sm:p-6 text-sm sm:text-base text-danger">
          Error: Usuario no asociado a un laboratorio
        </div>
      </div>
    );
  }

  // Fetch statistics
  const [laboratory, doctorsCount, collaboratorsCount] = await Promise.all([
    prisma.laboratory.findUnique({
      where: { id: laboratoryId },
      select: { name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.user.count({
      where: { doctorLaboratoryId: laboratoryId },
    }),
    prisma.user.count({
      where: { labCollaboratorId: laboratoryId },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
      {/* Real-time order notifications */}
      <LabOrderNotifications />

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
          Panel de Administración
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Buen día, {session.user.name}
        </p>
      </div>

      {/* Laboratory Info */}
      <div className="mb-6 sm:mb-8 rounded-xl bg-background p-4 sm:p-6 shadow-md border border-border">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
          Información del Laboratorio
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
            <dd className="mt-1 text-sm text-foreground">{laboratory?.name}</dd>
          </div>
          {laboratory?.email && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm text-foreground">{laboratory.email}</dd>
            </div>
          )}
          {laboratory?.phone && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
              <dd className="mt-1 text-sm text-foreground">{laboratory.phone}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 mb-6 sm:mb-8">
        <StatsCard
          title="Doctores"
          value={doctorsCount}
          icon="👨‍⚕️"
          description="Doctores registrados"
        />
        <StatsCard
          title="Colaboradores Lab"
          value={collaboratorsCount}
          icon="🔬"
          description="Personal del laboratorio"
        />
        <StatsCard
          title="Total Usuarios"
          value={doctorsCount + collaboratorsCount}
          icon="👥"
          description="Todos los usuarios"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl bg-background p-4 sm:p-6 shadow-md border border-border">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/lab-admin/users/new">
            <Button variant="primary" className="w-full">
              Nuevo Usuario
            </Button>
          </Link>
          <Link href="/lab-admin/users">
            <Button variant="secondary" className="w-full">
              Ver Usuarios
            </Button>
          </Link>
          <Link href="/lab-admin/orders">
            <Button variant="secondary" className="w-full">
              Ver Órdenes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
