import { UserForm } from '@/components/lab-admin/UserForm';

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Nuevo Usuario</h1>
        <p className="mt-2 text-muted-foreground">
          Crea un nuevo usuario para el laboratorio o una clínica
        </p>
      </div>

      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <UserForm />
      </div>
    </div>
  );
}
