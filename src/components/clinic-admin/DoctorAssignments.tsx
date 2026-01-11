'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Doctor } from '@/types/user';

interface DoctorAssignmentsProps {
  assistantId: string;
  assignedDoctors: {
    doctor: Doctor;
  }[];
  onUpdate: () => void;
}

export function DoctorAssignments({
  assistantId,
  assignedDoctors,
  onUpdate,
}: DoctorAssignmentsProps) {
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableDoctors();
  }, []);

  async function fetchAvailableDoctors() {
    try {
      const response = await fetch('/api/clinic-admin/doctors');
      if (response.ok) {
        const data = await response.json();
        setAvailableDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  }

  async function handleAssignDoctor() {
    if (!selectedDoctorId) return;

    setIsAssigning(true);
    setError(null);

    try {
      const response = await fetch(`/api/clinic-admin/assistants/${assistantId}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: selectedDoctorId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al asignar doctor');
      }

      setSelectedDoctorId('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleRemoveDoctor(doctorId: string) {
    if (!confirm('¿Estás seguro de remover este doctor del asistente?')) return;

    try {
      const response = await fetch(
        `/api/clinic-admin/assistants/${assistantId}/doctors/${doctorId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al remover doctor');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  const assignedDoctorIds = assignedDoctors.map((ad) => ad.doctor.id);
  const unassignedDoctors = availableDoctors.filter((d) => !assignedDoctorIds.includes(d.id));

  return (
    <div className="rounded-xl bg-background p-6 shadow-md border border-border">
      <h2 className="mb-6 text-xl font-semibold text-foreground">Doctores Asignados</h2>

      {error && <div className="mb-4 rounded-lg bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      {/* Assign new doctor */}
      {unassignedDoctors.length > 0 && (
        <div className="mb-6 flex gap-3">
          <div className="flex-1">
            <Select
              id="doctor"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              disabled={isAssigning}
            >
              <option value="">Seleccionar doctor...</option>
              {unassignedDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.email})
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="primary"
            onClick={handleAssignDoctor}
            disabled={!selectedDoctorId || isAssigning}
          >
            {isAssigning ? 'Asignando...' : 'Asignar Doctor'}
          </Button>
        </div>
      )}

      {/* List of assigned doctors */}
      {assignedDoctors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay doctores asignados a este asistente.</p>
      ) : (
        <div className="space-y-3">
          {assignedDoctors.map(({ doctor }) => (
            <div
              key={doctor.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
            >
              <div>
                <p className="font-medium text-foreground">{doctor.name}</p>
                <p className="text-sm text-muted-foreground">{doctor.email}</p>
              </div>
              <Button variant="danger" onClick={() => handleRemoveDoctor(doctor.id)}>
                Remover
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
