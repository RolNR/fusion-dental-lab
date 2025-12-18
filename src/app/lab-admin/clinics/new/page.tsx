import { requireAuth } from '@/lib/auth-helpers';
import { ClinicForm } from '@/components/lab-admin/ClinicForm';

export default async function NewClinicPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Nueva Clínica</h1>
        <p className="mt-2 text-muted-foreground">
          Agrega una nueva clínica dental a tu laboratorio
        </p>
      </div>

      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <ClinicForm />
      </div>
    </div>
  );
}
