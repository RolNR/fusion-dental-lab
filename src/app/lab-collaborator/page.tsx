import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { StatsCard } from '@/components/lab-admin/StatsCard';
import { QuickActions } from '@/components/ui/QuickActions';
import { OrderStatus } from '@prisma/client';

export default async function LabCollaboratorDashboard() {
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
  const [laboratory, orderStats] = await Promise.all([
    prisma.laboratory.findUnique({
      where: { id: laboratoryId },
      select: { name: true, email: true, phone: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: {
        clinic: {
          laboratoryId,
        },
      },
      _count: true,
    }),
  ]);

  // Calculate order counts by status
  const statusCounts = {
    pendingReview: 0,
    inProgress: 0,
    needsInfo: 0,
    completed: 0,
    total: 0,
  };

  orderStats.forEach((stat) => {
    const count = stat._count;
    statusCounts.total += count;

    switch (stat.status) {
      case OrderStatus.PENDING_REVIEW:
        statusCounts.pendingReview = count;
        break;
      case OrderStatus.IN_PROGRESS:
        statusCounts.inProgress = count;
        break;
      case OrderStatus.NEEDS_INFO:
        statusCounts.needsInfo = count;
        break;
      case OrderStatus.COMPLETED:
        statusCounts.completed = count;
        break;
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
          Panel de Colaborador
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Bienvenido, {session.user.name}
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
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        <StatsCard
          title="Pendiente Revisión"
          value={statusCounts.pendingReview}
          description="Órdenes nuevas"
        />
        <StatsCard
          title="En Proceso"
          value={statusCounts.inProgress}
          description="Trabajando"
        />
        <StatsCard
          title="Requiere Info"
          value={statusCounts.needsInfo}
          description="Esperando respuesta"
        />
        <StatsCard
          title="Completadas"
          value={statusCounts.completed}
          description="Finalizadas"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions
        actions={[
          { label: 'Ver Pendientes', href: '/lab-collaborator/orders?status=PENDING_REVIEW', variant: 'primary' },
          { label: 'En Proceso', href: '/lab-collaborator/orders?status=IN_PROGRESS', variant: 'secondary' },
          { label: 'Todas las Órdenes', href: '/lab-collaborator/orders', variant: 'secondary' },
        ]}
      />
    </div>
  );
}
