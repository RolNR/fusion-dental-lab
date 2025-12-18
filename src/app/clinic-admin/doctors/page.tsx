'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';

type Doctor = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const response = await fetch('/api/clinic-admin/doctors');
        if (!response.ok) {
          throw new Error('Error al cargar doctores');
        }
        const data = await response.json();
        setDoctors(data.doctors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-danger/10 p-6 text-danger">
          Error: {error}
        </div>
      </div>
    );
  }

  const columns: TableColumn<Doctor>[] = [
    {
      header: 'Doctor',
      accessor: (doctor) => (
        <div>
          <div className="text-sm font-medium text-foreground">{doctor.name}</div>
          <div className="text-sm text-muted-foreground">{doctor.email}</div>
        </div>
      ),
    },
    {
      header: 'Fecha de Registro',
      accessor: (doctor) => (
        <span className="text-sm text-muted-foreground">
          {new Date(doctor.createdAt).toLocaleDateString('es-MX')}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (doctor) => (
        <div className="flex gap-4 justify-end">
          <Link
            href={`/clinic-admin/doctors/${doctor.id}`}
            className="text-primary hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            Ver
          </Link>
          <Link
            href={`/clinic-admin/doctors/${doctor.id}/edit`}
            className="text-primary hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            Editar
          </Link>
        </div>
      ),
      headerClassName: 'text-right',
      className: 'text-right text-sm font-medium',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Doctores</h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona los doctores de la clínica
          </p>
        </div>
        <Link href="/clinic-admin/doctors/new">
          <Button variant="primary">Nuevo Doctor</Button>
        </Link>
      </div>

      {/* Doctors Table */}
      <Table
        columns={columns}
        data={doctors}
        keyExtractor={(doctor) => doctor.id}
        emptyMessage="No hay doctores registrados"
        emptyAction={
          <Link href="/clinic-admin/doctors/new">
            <Button variant="primary">Crear Primer Doctor</Button>
          </Link>
        }
      />
    </div>
  );
}
