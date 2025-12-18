'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Role } from '@prisma/client';

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
  doctorClinic?: {
    id: string;
    name: string;
  } | null;
  assistantClinic?: {
    id: string;
    name: string;
  } | null;
};

const getRoleLabel = (role: Role) => {
  const labels: Record<Role, string> = {
    LAB_ADMIN: 'Admin Laboratorio',
    LAB_COLLABORATOR: 'Colaborador Lab',
    CLINIC_ADMIN: 'Admin Clínica',
    DOCTOR: 'Doctor',
    CLINIC_ASSISTANT: 'Asistente',
  };
  return labels[role];
};

const getClinicName = (user: UserWithClinic) => {
  return (
    user.clinic?.name ||
    user.doctorClinic?.name ||
    user.assistantClinic?.name ||
    '-'
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithClinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const url = roleFilter
          ? `/api/lab-admin/users?role=${roleFilter}`
          : '/api/lab-admin/users';
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
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
      accessor: (user) => (
        <span className="text-sm text-foreground">{getClinicName(user)}</span>
      ),
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
        <div className="flex gap-4">
          <Link
            href={`/lab-admin/users/${user.id}`}
            className="text-primary hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            Ver
          </Link>
          <Link
            href={`/lab-admin/users/${user.id}/edit`}
            className="text-primary hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            Editar
          </Link>
        </div>
      ),
      headerClassName: 'text-right',
      className: 'text-right text-sm font-medium',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona todos los usuarios del laboratorio y clínicas
          </p>
        </div>
        <Link href="/lab-admin/users/new">
          <Button variant="primary">Nuevo Usuario</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
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
