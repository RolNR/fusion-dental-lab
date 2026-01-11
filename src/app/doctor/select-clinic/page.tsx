'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface Clinic {
  id: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
  isCurrent: boolean;
}

export default function SelectClinicPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinics() {
      try {
        const response = await fetch('/api/doctor/clinics');
        if (!response.ok) {
          throw new Error('Error al cargar clínicas');
        }
        const data = await response.json();
        setClinics(data.clinics || []);

        // If doctor already has an active clinic, redirect to dashboard
        if (session?.user?.activeClinicId) {
          router.replace('/doctor');
          return;
        }

        // Auto-select primary clinic if exists
        const primaryClinic = data.clinics?.find((c: Clinic) => c.isPrimary);
        if (primaryClinic) {
          setSelectedClinicId(primaryClinic.id);
        }
      } catch (err) {
        console.error('Error fetching clinics:', err);
        setError('Error al cargar clínicas. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.role === 'DOCTOR') {
      fetchClinics();
    }
  }, [session, router]);

  const handleSelectClinic = async () => {
    if (!selectedClinicId || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/doctor/active-clinic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clinicId: selectedClinicId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al seleccionar clínica');
      }

      // Update session
      await update();

      // Redirect to dashboard
      router.push('/doctor');
    } catch (err) {
      console.error('Error selecting clinic:', err);
      setError(err instanceof Error ? err.message : 'Error al seleccionar clínica');
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading && clinics.length === 0) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <Icons.spinner className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando clínicas...</p>
        </div>
      </div>
    );
  }

  // Show error state if no clinics
  if (!isLoading && clinics.length === 0) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-background rounded-lg shadow-lg border border-border p-8">
          <div className="text-center">
            <Icons.alertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Sin clínicas asignadas</h1>
            <p className="text-muted-foreground mb-6">
              No tienes clínicas asignadas. Por favor, contacta al administrador del laboratorio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Selecciona tu clínica
          </h1>
          <p className="text-muted-foreground">
            Elige la clínica con la que deseas trabajar en esta sesión
          </p>
        </div>

        {/* Clinic Cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {clinics.map((clinic) => (
            <button
              key={clinic.id}
              onClick={() => setSelectedClinicId(clinic.id)}
              disabled={isLoading}
              className={`relative p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedClinicId === clinic.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-background hover:border-primary/50 hover:shadow'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Selection Indicator */}
              <div className="absolute top-4 right-4">
                {selectedClinicId === clinic.id ? (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Icons.check className="h-4 w-4 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-border" />
                )}
              </div>

              {/* Clinic Info */}
              <div className="pr-10">
                <h3 className="text-lg font-semibold text-foreground mb-2">{clinic.name}</h3>
                {clinic.isPrimary && (
                  <span className="inline-block text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                    Clínica principal
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-danger/10 border border-danger/20 p-4">
            <p className="text-sm text-danger flex items-center gap-2">
              <Icons.alertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </p>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleSelectClinic}
          disabled={!selectedClinicId || isLoading}
          isLoading={isLoading}
          variant="primary"
          size="lg"
          fullWidth
        >
          {isLoading ? 'Seleccionando...' : 'Continuar'}
        </Button>

        {/* Helper Text */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Podrás cambiar de clínica en cualquier momento desde el menú principal
        </p>
      </div>
    </div>
  );
}
