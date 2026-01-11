'use client';

import Link from 'next/link';
import { UserForm } from '@/components/lab-admin/UserForm';
import { Role } from '@prisma/client';

export default function NewCollaboratorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/lab-admin/collaborators"
          className="text-sm text-primary hover:text-primary/80"
        >
          ← Volver a Colaboradores
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Nuevo Colaborador</h1>
        <p className="mt-2 text-muted-foreground">Crea un nuevo colaborador para el laboratorio</p>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <UserForm
          initialData={{
            role: Role.LAB_COLLABORATOR,
          }}
          roleFixed={true}
        />
      </div>
    </div>
  );
}
