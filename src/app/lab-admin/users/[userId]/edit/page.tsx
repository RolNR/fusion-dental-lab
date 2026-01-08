'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { UserForm } from '@/components/lab-admin/UserForm';
import { DoctorClinicAssignments } from '@/components/lab-admin/DoctorClinicAssignments';
import { Role } from '@prisma/client';

type UserData = {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicMemberships?: Array<{
    clinic: {
      id: string;
      name: string;
    };
    isPrimary: boolean;
  }>;
};

export default function EditUserPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/lab-admin/users/${userId}`);
        if (!response.ok) {
          throw new Error('Error al cargar usuario');
        }
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Usuario no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/lab-admin/users/${userId}`}
          className="text-sm text-primary hover:text-primary/80"
        >
          ← Volver a Detalles
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-foreground">
          Editar Usuario
        </h1>
        <p className="mt-2 text-muted-foreground">
          Actualiza la información de {user.name}
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <UserForm
          userId={userId}
          initialData={{
            name: user.name,
            email: user.email,
            role: user.role,
          }}
        />
      </div>

      {/* Doctor Clinic Assignments */}
      {user.role === Role.DOCTOR && (
        <div className="mt-8">
          <DoctorClinicAssignments
            doctorId={user.id}
            initialMemberships={user.clinicMemberships || []}
          />
        </div>
      )}
    </div>
  );
}
