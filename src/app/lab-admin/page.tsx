import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { StatsCard } from '@/components/lab-admin/StatsCard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function LabAdminDashboard() {
  const session = await requireAuth();
  const laboratoryId = session.user.laboratoryId;

  if (!laboratoryId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: Usuario no asociado a un laboratorio
        </div>
      </div>
    );
  }

  // Fetch statistics
  const [laboratory, clinicsCount, usersStats] = await Promise.all([
    prisma.laboratory.findUnique({
      where: { id: laboratoryId },
      select: { name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.clinic.count({
      where: { laboratoryId, isActive: true },
    }),
    prisma.user.groupBy({
      by: ['role'],
      where: {
        OR: [
          { labCollaboratorId: laboratoryId },
          { clinic: { laboratoryId } },
          { doctorClinic: { laboratoryId } },
          { assistantClinic: { laboratoryId } },
        ],
      },
      _count: true,
    }),
  ]);

  // Calculate user counts by role
  const userCounts = {
    labCollaborators: 0,
    clinicAdmins: 0,
    doctors: 0,
    assistants: 0,
    total: 0,
  };

  usersStats.forEach((stat) => {
    const count = stat._count;
    userCounts.total += count;

    switch (stat.role) {
      case 'LAB_COLLABORATOR':
        userCounts.labCollaborators = count;
        break;
      case 'CLINIC_ADMIN':
        userCounts.clinicAdmins = count;
        break;
      case 'DOCTOR':
        userCounts.doctors = count;
        break;
      case 'CLINIC_ASSISTANT':
        userCounts.assistants = count;
        break;
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Panel de Administración
        </h1>
        <p className="mt-2 text-muted-foreground">
          Bienvenido, {session.user.name}
        </p>
      </div>

      {/* Laboratory Info */}
      <div className="mb-8 rounded-lg bg-background p-6 shadow border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Información del Laboratorio
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Clínicas Activas"
          value={clinicsCount}
          icon="🏥"
          description="Clínicas en el sistema"
        />
        <StatsCard
          title="Total Usuarios"
          value={userCounts.total}
          icon="👥"
          description="Todos los usuarios"
        />
        <StatsCard
          title="Doctores"
          value={userCounts.doctors}
          icon="👨‍⚕️"
          description="Doctores activos"
        />
        <StatsCard
          title="Colaboradores Lab"
          value={userCounts.labCollaborators}
          icon="🔬"
          description="Personal del laboratorio"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-background p-6 shadow border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/lab-admin/clinics">
            <Button variant="primary" className="w-full">
              Nueva Clínica
            </Button>
          </Link>
          <Link href="/lab-admin/users">
            <Button variant="primary" className="w-full">
              Nuevo Usuario
            </Button>
          </Link>
          <Link href="/lab-admin/clinics">
            <Button variant="secondary" className="w-full">
              Ver Clínicas
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
