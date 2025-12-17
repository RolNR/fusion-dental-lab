import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { PendingUsers } from '@/components/admin/PendingUsers';

export const metadata = {
  title: 'Gestión de Usuarios | Admin | LabWiseLink',
  description: 'Aprobar o rechazar solicitudes de registro',
};

export default async function AdminUsersPage() {
  // Require ADMIN role
  await requireRole([Role.ADMIN]);

  // Fetch pending users
  const pendingUsers = await prisma.user.findMany({
    where: {
      isApproved: false,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch approved users count
  const approvedCount = await prisma.user.count({
    where: {
      isApproved: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="mt-2 text-sm text-gray-600">
            Aprobar o rechazar solicitudes de registro de nuevos usuarios
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500">Usuarios Pendientes</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {pendingUsers.length}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500">Usuarios Aprobados</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{approvedCount}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Solicitudes Pendientes</h2>
          <PendingUsers users={pendingUsers} />
        </div>
      </div>
    </div>
  );
}
