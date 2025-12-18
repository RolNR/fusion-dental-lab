'use client';

import Link from 'next/link';
import { StaffForm } from '@/components/clinic-admin/StaffForm';

export default function NewDoctorPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/clinic-admin/doctors"
          className="text-sm text-primary hover:text-primary/80"
        >
          ← Volver a Doctores
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">
          Nuevo Doctor
        </h1>
        <p className="mt-2 text-muted-foreground">
          Crea un nuevo doctor para la clínica
        </p>
      </div>

      {/* Form */}
      <div className="rounded-lg bg-background p-6 shadow border border-border">
        <StaffForm staffType="doctor" />
      </div>
    </div>
  );
}
