'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { Role } from '@prisma/client';
import { getRoleLabel } from '@/lib/formatters';
import { Icons } from '@/components/ui/Icons';

type UserWithClinic = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  clinic?: {
    id: string;
    name: string;
  } | null;
  clinicMemberships?: Array<{
    clinic: {
      id: string;
      name: string;
    };
    isPrimary: boolean;
  }>;
  assistantClinic?: {
    id: string;
    name: string;
  } | null;
};

const getClinicName = (user: UserWithClinic) => {
  // For doctors: show primary clinic or first clinic
  if (user.role === Role.DOCTOR && user.clinicMemberships) {
    const primaryClinic = user.clinicMemberships.find((m) => m.isPrimary);
    const clinic = primaryClinic || user.clinicMemberships[0];
    if (clinic) {
      return clinic.clinic.name;
    }
  }

  // For other roles
  return user.clinic?.name || user.assistantClinic?.name || '-';
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithClinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const url = roleFilter ? `/api/lab-admin/users?role=${roleFilter}` : '/api/lab-admin/users';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Error al cargar usuarios');
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [roleFilter]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="text-center text-sm sm:text-base text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-4 sm:p-6 text-sm sm:text-base text-danger">
          Error: {error}
        </div>
      </div>
    );
  }

  const columns: TableColumn<UserWithClinic>[] = [
    {
      header: 'Usuario',
      accessor: (user) => (
        <div>
          <div className="text-sm font-medium text-foreground">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      header: 'Rol',
      accessor: (user) => (
        <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          {getRoleLabel(user.role)}
        </span>
      ),
    },
    {
      header: 'Clínica',
      accessor: (user) => {
        // For doctors: show all clinics with primary badge
        if (
          user.role === Role.DOCTOR &&
          user.clinicMemberships &&
          user.clinicMemberships.length > 0
        ) {
          return (
            <div className="flex flex-wrap gap-1">
              {user.clinicMemberships.map((membership) => (
                <span
                  key={membership.clinic.id}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    membership.isPrimary
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {membership.clinic.name}
                  {membership.isPrimary && <span className="text-[10px]">★</span>}
                </span>
              ))}
            </div>
          );
        }

        // For other roles: show single clinic
        return <span className="text-sm text-foreground">{getClinicName(user)}</span>;
      },
    },
    {
      header: 'Fecha de Registro',
      accessor: (user) => (
        <span className="text-sm text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString('es-MX')}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (user) => (
        <div className="flex gap-3 justify-end">
          <Link
            href={`/lab-admin/users/${user.id}`}
            className="text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="Ver detalles"
          >
            <Icons.eye className="h-5 w-5" />
          </Link>
          <Link
            href={`/lab-admin/users/${user.id}/edit`}
            className="text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="Editar"
          >
            <Icons.edit className="h-5 w-5" />
          </Link>
        </div>
      ),
      headerClassName: 'text-right',
      className: 'text-right text-sm font-medium',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 md:px-6 lg:px-8">
      <PageHeader
        title="Usuarios"
        description="Gestiona todos los usuarios del laboratorio y clínicas"
        action={{
          label: 'Nuevo Usuario',
          href: '/lab-admin/users/new',
          variant: 'primary',
        }}
      />

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-64"
        >
          <option value="">Todos los roles</option>
          <option value="LAB_COLLABORATOR">Colaborador Lab</option>
          <option value="CLINIC_ADMIN">Admin Clínica</option>
          <option value="DOCTOR">Doctor</option>
          <option value="CLINIC_ASSISTANT">Asistente</option>
        </Select>
      </div>

      {/* Users Table */}
      <Table
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id}
        emptyMessage="No hay usuarios registrados"
        emptyAction={
          <Link href="/lab-admin/users/new">
            <Button variant="primary">Crear Primer Usuario</Button>
          </Link>
        }
      />
    </div>
  );
}
