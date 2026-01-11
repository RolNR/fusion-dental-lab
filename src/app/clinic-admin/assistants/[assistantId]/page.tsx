'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { DoctorAssignments } from '@/components/clinic-admin/DoctorAssignments';
import { Doctor } from '@/types/user';

type AssistantDetail = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  assignedDoctors: {
    doctor: Doctor;
  }[];
};

export default function AssistantDetailPage() {
  const params = useParams();
  const assistantId = params.assistantId as string;

  const [assistant, setAssistant] = useState<AssistantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchAssistant() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clinic-admin/assistants/${assistantId}`);
      if (!response.ok) {
        throw new Error('Error al cargar asistente');
      }
      const data = await response.json();
      setAssistant(data.assistant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAssistant();
  }, [assistantId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !assistant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Asistente no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-4">
            <Link
              href="/clinic-admin/assistants"
              className="text-sm text-primary hover:text-primary/80"
            >
              ← Volver a Asistentes
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{assistant.name}</h1>
          <p className="mt-2 text-muted-foreground">Detalles del asistente</p>
        </div>
        <Link href={`/clinic-admin/assistants/${assistantId}/edit`}>
          <Button variant="primary">Editar Asistente</Button>
        </Link>
      </div>

      {/* Assistant Information */}
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <h2 className="mb-6 text-xl font-semibold text-foreground">Información del Asistente</h2>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
            <dd className="mt-1 text-sm text-foreground">{assistant.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="mt-1 text-sm text-foreground">{assistant.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Fecha de Registro</dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(assistant.createdAt).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Doctor Assignments */}
      <DoctorAssignments
        assistantId={assistantId}
        assignedDoctors={assistant.assignedDoctors}
        onUpdate={fetchAssistant}
      />
    </div>
  );
}
