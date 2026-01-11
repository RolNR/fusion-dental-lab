'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icons } from '@/components/ui/Icons';

interface Clinic {
  id: string;
  name: string;
}

interface ClinicMembership {
  clinic: Clinic;
  isPrimary: boolean;
}

interface DoctorClinicAssignmentsProps {
  doctorId: string;
  initialMemberships: ClinicMembership[];
}

export function DoctorClinicAssignments({
  doctorId,
  initialMemberships,
}: DoctorClinicAssignmentsProps) {
  const router = useRouter();
  const [allClinics, setAllClinics] = useState<Clinic[]>([]);
  const [selectedClinicIds, setSelectedClinicIds] = useState<Set<string>>(new Set());
  const [primaryClinicId, setPrimaryClinicId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from initial memberships
  useEffect(() => {
    const clinicIds = new Set(initialMemberships.map((m) => m.clinic.id));
    const primary = initialMemberships.find((m) => m.isPrimary)?.clinic.id || '';

    setSelectedClinicIds(clinicIds);
    setPrimaryClinicId(primary);
  }, [initialMemberships]);

  // Fetch all clinics when entering edit mode
  useEffect(() => {
    if (isEditing && allClinics.length === 0) {
      fetchAllClinics();
    }
  }, [isEditing]);

  const fetchAllClinics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/lab-admin/clinics');
      if (!response.ok) {
        throw new Error('Error al cargar clínicas');
      }
      const data = await response.json();
      setAllClinics(data.clinics || []);
    } catch (err) {
      console.error('Error fetching clinics:', err);
      setError('Error al cargar clínicas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleClinic = (clinicId: string, checked: boolean) => {
    const newSet = new Set(selectedClinicIds);

    if (checked) {
      newSet.add(clinicId);
      // Auto-set as primary if first clinic
      if (newSet.size === 1) {
        setPrimaryClinicId(clinicId);
      }
    } else {
      newSet.delete(clinicId);
      // Clear primary if removing the primary clinic
      if (primaryClinicId === clinicId) {
        // Auto-set to first remaining clinic
        const firstRemaining = Array.from(newSet)[0];
        setPrimaryClinicId(firstRemaining || '');
      }
    }

    setSelectedClinicIds(newSet);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/lab-admin/users/${doctorId}/clinics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicIds: Array.from(selectedClinicIds),
          primaryClinicId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar asignaciones');
      }

      // Success - reload page to refresh data
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error('Error saving clinic assignments:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar asignaciones');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to initial state
    const clinicIds = new Set(initialMemberships.map((m) => m.clinic.id));
    const primary = initialMemberships.find((m) => m.isPrimary)?.clinic.id || '';

    setSelectedClinicIds(clinicIds);
    setPrimaryClinicId(primary);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="rounded-lg border border-border bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Clínicas Asignadas</h3>
        {!isEditing && (
          <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
            Gestionar Clínicas
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-danger/10 border border-danger/20 p-4">
          <p className="text-sm text-danger flex items-center gap-2">
            <Icons.alertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* View Mode */}
      {!isEditing && (
        <div className="space-y-2">
          {initialMemberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay clínicas asignadas</p>
          ) : (
            initialMemberships.map((membership) => (
              <div
                key={membership.clinic.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted"
              >
                <span className="text-sm font-medium text-foreground">
                  {membership.clinic.name}
                </span>
                {membership.isPrimary && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                    Principal
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="space-y-4">
          {/* Instructions */}
          <p className="text-sm text-muted-foreground">
            Selecciona las clínicas a las que pertenece este doctor. Marca una como clínica
            principal usando el botón de radio.
          </p>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Icons.spinner className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Clinic Checkboxes */}
          {!isLoading && (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
              {allClinics.map((clinic) => {
                const isSelected = selectedClinicIds.has(clinic.id);
                const isPrimary = primaryClinicId === clinic.id;

                return (
                  <div
                    key={clinic.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleToggleClinic(clinic.id, e.target.checked)}
                    />
                    <label className="flex-1 text-sm cursor-pointer">{clinic.name}</label>
                    {isSelected && (
                      <>
                        <input
                          type="radio"
                          name="primaryClinic"
                          checked={isPrimary}
                          onChange={() => setPrimaryClinicId(clinic.id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-border"
                        />
                        {isPrimary && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Validation Messages */}
          {selectedClinicIds.size === 0 && (
            <p className="text-sm text-danger">Debes seleccionar al menos una clínica</p>
          )}

          {selectedClinicIds.size > 0 && !primaryClinicId && (
            <p className="text-sm text-warning">Debes marcar una clínica como principal</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-border">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={selectedClinicIds.size === 0 || !primaryClinicId || isSaving}
              isLoading={isSaving}
            >
              Guardar Cambios
            </Button>
            <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
