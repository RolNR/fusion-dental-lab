'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';
import { Role } from '@prisma/client';
import { Icons } from '@/components/ui/Icons';

type Collaborator = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollaborators() {
      try {
        // Use existing users endpoint with LAB_COLLABORATOR filter
        const response = await fetch('/api/lab-admin/users?role=LAB_COLLABORATOR');
        if (!response.ok) {
          throw new Error('Error al cargar colaboradores');
        }
        const data = await response.json();
        setCollaborators(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCollaborators();
  }, []);

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
        <div className="rounded-lg bg-danger/10 p-6 text-sm sm:text-base text-danger">
          Error: {error}
        </div>
      </div>
    );
  }

  const columns: TableColumn<Collaborator>[] = [
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
        title="Colaboradores del Laboratorio"
        description="Gestiona el personal del laboratorio"
        action={{
          label: 'Nuevo Colaborador',
          href: '/lab-admin/collaborators/new',
          variant: 'primary',
        }}
      />

      {/* Collaborators Table */}
      <Table
        columns={columns}
        data={collaborators}
        keyExtractor={(user) => user.id}
        emptyMessage="No hay colaboradores registrados"
        emptyAction={
          <Link href="/lab-admin/collaborators/new">
            <Button variant="primary">Crear Primer Colaborador</Button>
          </Link>
        }
      />
    </div>
  );
}
