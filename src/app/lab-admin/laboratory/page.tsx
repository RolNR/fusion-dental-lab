import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { LaboratorySettingsForm } from '@/components/lab-admin/LaboratorySettingsForm';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Configuración del Laboratorio | LabWiseLink',
  description: 'Administra la información de tu laboratorio',
};

export default async function LaboratorySettingsPage() {
  const session = await requireRole([Role.LAB_ADMIN]);

  const laboratoryId = session.user.laboratoryId;
  if (!laboratoryId) {
    redirect('/unauthorized');
  }

  const laboratory = await prisma.laboratory.findUnique({
    where: { id: laboratoryId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  if (!laboratory) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Configuración del Laboratorio</h1>
          <p className="mt-2 text-muted-foreground">Administra la información de tu laboratorio</p>
        </div>

        <div className="rounded-lg bg-background p-6 shadow border border-border">
          <LaboratorySettingsForm initialData={laboratory} />
        </div>
      </div>
    </div>
  );
}
