'use client';

import Link from 'next/link';
import { StaffForm } from '@/components/clinic-admin/StaffForm';

export default function NewAssistantPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/clinic-admin/assistants"
          className="text-sm text-primary hover:text-primary/80"
        >
          ← Volver a Asistentes
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Nuevo Asistente</h1>
        <p className="mt-2 text-muted-foreground">Crea un nuevo asistente para la clínica</p>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <StaffForm staffType="assistant" />
      </div>
    </div>
  );
}
