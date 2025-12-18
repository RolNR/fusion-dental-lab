'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { OrderForm } from '@/components/clinic-staff/OrderForm';

export default function NewDoctorOrderPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Nueva Orden</h1>
          <p className="mt-2 text-muted-foreground">
            Crea una nueva orden dental
          </p>
        </div>

        <OrderForm role="doctor" />
      </div>
    </div>
  );
}
