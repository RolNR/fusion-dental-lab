'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
}

interface PendingUsersProps {
  users: User[];
}

export function PendingUsers({ users }: PendingUsersProps) {
  const router = useRouter();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleApprove = async (userId: string) => {
    setLoadingUserId(userId);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al aprobar usuario');
        return;
      }

      router.refresh();
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoadingUserId(userId);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al rechazar usuario');
        return;
      }

      router.refresh();
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoadingUserId(null);
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case Role.DENTIST:
        return 'Doctor/Dentista';
      case Role.LAB:
        return 'Laboratorio';
      case Role.ADMIN:
        return 'Administrador';
      default:
        return role;
    }
  };

  if (users.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-8 text-center">
        <p className="text-gray-600">No hay usuarios pendientes de aprobación</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Correo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha de registro
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {getRoleLabel(user.role)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApprove(user.id)}
                    disabled={loadingUserId === user.id}
                    isLoading={loadingUserId === user.id}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleReject(user.id)}
                    disabled={loadingUserId === user.id}
                  >
                    Rechazar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
