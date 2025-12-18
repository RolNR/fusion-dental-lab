'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';

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
      header: 'Acciones',
      accessor: (assistant) => (
        <div className="flex gap-4 justify-end">
          <Link
            href={`/clinic-admin/assistants/${assistant.id}`}
            className="text-primary hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            Ver
          </Link>
          <Link
            href={`/clinic-admin/assistants/${assistant.id}/edit`}
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
          <h1 className="text-3xl font-bold text-foreground">Asistentes</h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona los asistentes de la clínica
          </p>
        </div>
        <Link href="/clinic-admin/assistants/new">
          <Button variant="primary">Nuevo Asistente</Button>
        </Link>
      </div>

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
