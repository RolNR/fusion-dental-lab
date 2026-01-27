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

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  clinicName?: string | null;
  phone?: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
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

  const columns: TableColumn<UserItem>[] = [
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
      header: 'Consultorio',
      accessor: (user) => <span className="text-sm text-foreground">{user.clinicName || '-'}</span>,
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
      header: '',
      mobileLabel: 'Acciones',
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
        title="Doctores"
        description="Gestiona los doctores del laboratorio"
        action={{
          label: 'Nuevo Doctor',
          href: '/lab-admin/users/new',
          variant: 'primary',
        }}
      />

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
