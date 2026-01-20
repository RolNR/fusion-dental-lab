'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';
import { Icons } from '@/components/ui/Icons';

type Assistant = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssistants() {
      try {
        const response = await fetch('/api/clinic-admin/assistants');
        if (!response.ok) {
          throw new Error('Error al cargar asistentes');
        }
        const data = await response.json();
        setAssistants(data.assistants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssistants();
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

  const columns: TableColumn<Assistant>[] = [
    {
      header: 'Asistente',
      accessor: (assistant) => (
        <div>
          <div className="text-sm font-medium text-foreground">{assistant.name}</div>
          <div className="text-sm text-muted-foreground">{assistant.email}</div>
        </div>
      ),
    },
    {
      header: 'Fecha de Registro',
      accessor: (assistant) => (
        <span className="text-sm text-muted-foreground">
          {new Date(assistant.createdAt).toLocaleDateString('es-MX')}
        </span>
      ),
    },
    {
      header: '',
      mobileLabel: 'Acciones',
      accessor: (assistant) => (
        <div className="flex gap-3 justify-end">
          <Link
            href={`/clinic-admin/assistants/${assistant.id}`}
            className="text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="Ver detalles"
          >
            <Icons.eye className="h-5 w-5" />
          </Link>
          <Link
            href={`/clinic-admin/assistants/${assistant.id}/edit`}
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
        title="Asistentes"
        description="Gestiona los asistentes de la clínica"
        action={{
          label: 'Nuevo Asistente',
          href: '/clinic-admin/assistants/new',
          variant: 'primary',
        }}
      />

      {/* Assistants Table */}
      <Table
        columns={columns}
        data={assistants}
        keyExtractor={(assistant) => assistant.id}
        emptyMessage="No hay asistentes registrados"
        emptyAction={
          <Link href="/clinic-admin/assistants/new">
            <Button variant="primary">Crear Primer Asistente</Button>
          </Link>
        }
      />
    </div>
  );
}
