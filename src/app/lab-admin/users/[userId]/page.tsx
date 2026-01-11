'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Role } from '@prisma/client';
import { DoctorClinicAssignments } from '@/components/lab-admin/DoctorClinicAssignments';

type UserDetail = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  clinic?: {
    id: string;
    name: string;
  } | null;
  doctorClinic?: {
    id: string;
    name: string;
  } | null;
  assistantClinic?: {
    id: string;
    name: string;
  } | null;
  clinicMemberships?: Array<{
    clinic: {
      id: string;
      name: string;
    };
    isPrimary: boolean;
  }>;
};

const getRoleLabel = (role: Role) => {
  const labels: Record<Role, string> = {
    LAB_ADMIN: 'Admin Laboratorio',
    LAB_COLLABORATOR: 'Colaborador Lab',
    CLINIC_ADMIN: 'Admin Clínica',
    DOCTOR: 'Doctor',
    CLINIC_ASSISTANT: 'Asistente',
  };
  return labels[role];
};

const getClinicName = (user: UserDetail) => {
  return user.clinic?.name || user.doctorClinic?.name || user.assistantClinic?.name || null;
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetail | null>(null);
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error || 'Usuario no encontrado'}
        </div>
      </div>
    );
  }

  const clinicName = getClinicName(user);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-4">
            <Link href="/lab-admin/users" className="text-sm text-primary hover:text-primary/80">
              ← Volver a Usuarios
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
          <p className="mt-2 text-muted-foreground">Detalles del usuario</p>
        </div>
        <Link href={`/lab-admin/users/${userId}/edit`}>
          <Button variant="primary">Editar Usuario</Button>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="mb-8">
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {getRoleLabel(user.role)}
        </span>
      </div>

      {/* User Information */}
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <h2 className="mb-6 text-xl font-semibold text-foreground">Información del Usuario</h2>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
            <dd className="mt-1 text-sm text-foreground">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Rol</dt>
            <dd className="mt-1 text-sm text-foreground">{getRoleLabel(user.role)}</dd>
          </div>
          {clinicName && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Clínica</dt>
              <dd className="mt-1 text-sm text-foreground">{clinicName}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Fecha de Registro</dt>
            <dd className="mt-1 text-sm text-foreground">
              {new Date(user.createdAt).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>
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
