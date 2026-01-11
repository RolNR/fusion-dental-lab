'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icons } from '@/components/ui/Icons';
import { Doctor } from '@/types/user';

interface DoctorAssignmentProps {
  assistantId: string;
  initialAssignedDoctors: Doctor[];
  onSave?: () => void;
}

export function DoctorAssignment({
  assistantId,
  initialAssignedDoctors,
  onSave,
}: DoctorAssignmentProps) {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [assignedDoctorIds, setAssignedDoctorIds] = useState<Set<string>>(
    new Set(initialAssignedDoctors.map((d) => d.id))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/clinic-admin/doctors');
      if (!response.ok) {
        throw new Error('Error al cargar doctores');
      }
      const data = await response.json();
      setAllDoctors(data.doctors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDoctor = (doctorId: string) => {
    setAssignedDoctorIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(doctorId)) {
        newSet.delete(doctorId);
      } else {
        newSet.add(doctorId);
      }
      return newSet;
    });
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Send complete list of doctor IDs in a single batch request
      const response = await fetch(`/api/clinic-admin/assistants/${assistantId}/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorIds: Array.from(assignedDoctorIds),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar asignaciones');
      }

      setSuccess(true);

      // Notify parent to refresh data
      if (onSave) {
        onSave();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar asignaciones');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    const initialIds = new Set(initialAssignedDoctors.map((d) => d.id));
    if (initialIds.size !== assignedDoctorIds.size) return true;
    for (const id of assignedDoctorIds) {
      if (!initialIds.has(id)) return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Doctores Asignados</h3>
        <p className="text-sm text-muted-foreground">Cargando doctores...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Doctores Asignados</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona los doctores con los que este asistente puede trabajar
        </p>
      </div>

      {error && <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      {success && (
        <div className="mb-4 rounded-lg bg-success/10 p-3 text-sm text-success">
          Asignaciones guardadas exitosamente
        </div>
      )}

      {allDoctors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay doctores disponibles en esta clínica</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {allDoctors.map((doctor) => (
              <label
                key={doctor.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Checkbox
                  checked={assignedDoctorIds.has(doctor.id)}
                  onChange={() => handleToggleDoctor(doctor.id)}
                  disabled={isSaving}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{doctor.name}</p>
                  <p className="text-xs text-muted-foreground">{doctor.email}</p>
                </div>
                {assignedDoctorIds.has(doctor.id) && (
                  <Icons.check className="h-5 w-5 text-success flex-shrink-0" />
                )}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {assignedDoctorIds.size} de {allDoctors.length} doctores asignados
            </p>
            <Button
              onClick={handleSave}
              variant="primary"
              isLoading={isSaving}
              disabled={!hasChanges() || isSaving}
            >
              Guardar Asignaciones
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
