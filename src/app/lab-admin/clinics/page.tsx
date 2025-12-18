'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Table, TableColumn } from '@/components/ui/Table';

type ClinicWithCounts = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  _count: {
    clinicAdmins: number;
    doctors: number;
    assistants: number;
    orders: number;
  };
};

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ClinicWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinics() {
      try {
        const response = await fetch('/api/lab-admin/clinics');
        if (!response.ok) {
          throw new Error('Error al cargar clínicas');
        }
        const data = await response.json();
        setClinics(data.clinics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClinics();
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

  const columns: TableColumn<ClinicWithCounts>[] = [
    {
      header: 'Clínica',
      accessor: (clinic) => (
        <div>
          <div className="text-sm font-medium text-foreground">{clinic.name}</div>
          {clinic.address && (
            <div className="text-sm text-muted-foreground">{clinic.address}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Contacto',
      accessor: (clinic) => (
        <div>
          {clinic.email && (
            <div className="text-sm text-foreground">{clinic.email}</div>
          )}
          {clinic.phone && (
            <div className="text-sm text-muted-foreground">{clinic.phone}</div>
          )}
          {!clinic.email && !clinic.phone && (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Usuarios',
      accessor: (clinic) => (
        <div>
          <div className="text-sm text-foreground">
            {clinic._count.clinicAdmins +
              clinic._count.doctors +
              clinic._count.assistants}{' '}
            usuarios
          </div>
          <div className="text-xs text-muted-foreground">
            {clinic._count.doctors} doctores
          </div>
        </div>
      ),
    },
    {
      header: 'Órdenes',
      accessor: (clinic) => clinic._count.orders,
      className: 'text-sm text-foreground',
    },
    {
      header: 'Estado',
      accessor: (clinic) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            clinic.isActive
              ? 'bg-success/10 text-success'
              : 'bg-danger/10 text-danger'
          }`}
        >
          {clinic.isActive ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (clinic) => (
        <div className="flex gap-4">
          <Link
            href={`/lab-admin/clinics/${clinic.id}`}
            className="text-primary hover:text-primary/80"
            onClick={(e) => e.stopPropagation()}
          >
            Ver
          </Link>
          <Link
            href={`/lab-admin/clinics/${clinic.id}/edit`}
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
          <h1 className="text-3xl font-bold text-foreground">Clínicas</h1>
          <p className="mt-2 text-muted-foreground">
            Gestiona las clínicas dentales asociadas a tu laboratorio
          </p>
        </div>
        <Link href="/lab-admin/clinics/new">
          <Button variant="primary">Nueva Clínica</Button>
        </Link>
      </div>

      {/* Clinics Table */}
      <Table
        columns={columns}
        data={clinics}
        keyExtractor={(clinic) => clinic.id}
        emptyMessage="No hay clínicas registradas"
        emptyAction={
          <Link href="/lab-admin/clinics/new">
            <Button variant="primary">Crear Primera Clínica</Button>
          </Link>
        }
      />
    </div>
  );
}
