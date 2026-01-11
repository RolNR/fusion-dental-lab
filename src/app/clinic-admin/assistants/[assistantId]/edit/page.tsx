'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StaffForm } from '@/components/clinic-admin/StaffForm';
import { DoctorAssignment } from '@/components/clinic-admin/DoctorAssignment';

type Doctor = {
  id: string;
  name: string;
  email: string;
};

type AssistantData = {
  id: string;
  name: string;
  email: string;
  assignedDoctors?: {
    doctor: Doctor;
  }[];
};

export default function EditAssistantPage() {
  const params = useParams();
  const assistantId = params.assistantId as string;

  const [assistant, setAssistant] = useState<AssistantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssistant = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clinic-admin/assistants/${assistantId}`);
      if (!response.ok) {
        throw new Error('Error al cargar asistente');
      }
      const data = await response.json();
      setAssistant(data.assistant);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssistant();
  }, [assistantId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !assistant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Asistente no encontrado'}
        </div>
      </div>
    );
  }

  const assignedDoctors = assistant.assignedDoctors?.map((ad) => ad.doctor) || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/clinic-admin/assistants/${assistantId}`}
          className="text-sm text-primary hover:text-primary/80"
        >
          ← Volver a Detalles
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Editar Asistente</h1>
        <p className="mt-2 text-muted-foreground">Actualiza la información de {assistant.name}</p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <StaffForm
            staffId={assistantId}
            staffType="assistant"
            initialData={{
              name: assistant.name,
              email: assistant.email,
            }}
          />
        </div>

        {/* Doctor Assignment */}
        <DoctorAssignment
          assistantId={assistantId}
          initialAssignedDoctors={assignedDoctors}
          onSave={fetchAssistant}
        />
      </div>
    </div>
  );
}
