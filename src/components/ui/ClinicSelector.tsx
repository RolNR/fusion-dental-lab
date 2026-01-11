'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface Clinic {
  id: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
  isCurrent: boolean;
}

interface ClinicSelectorProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function ClinicSelector({ isMobile = false, onClose }: ClinicSelectorProps) {
  const { data: session, update } = useSession();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch clinics on mount
  useEffect(() => {
    async function fetchClinics() {
      try {
        const response = await fetch('/api/doctor/clinics');
        if (!response.ok) {
          throw new Error('Error al cargar clínicas');
        }
        const data = await response.json();
        setClinics(data.clinics || []);
      } catch (err) {
        console.error('Error fetching clinics:', err);
        setError('Error al cargar clínicas');
      }
    }

    if (session?.user?.role === 'DOCTOR') {
      fetchClinics();
    }
  }, [session]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Only show for doctors
  if (session?.user?.role !== 'DOCTOR') {
    return null;
  }

  // Don't show if no clinics loaded yet
  if (clinics.length === 0) {
    return null;
  }

  const currentClinic = clinics.find((c) => c.isCurrent);

  const handleClinicSwitch = async (clinicId: string) => {
    if (isLoading) return;

    // Don't switch if already current
    if (clinics.find((c) => c.id === clinicId)?.isCurrent) {
      setIsOpen(false);
      if (onClose) onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/doctor/active-clinic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clinicId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar clínica');
      }

      // Update session to reflect new active clinic
      await update();

      // Update local state
      setClinics((prev) =>
        prev.map((c) => ({
          ...c,
          isCurrent: c.id === clinicId,
        }))
      );

      // Close dropdown
      setIsOpen(false);
      if (onClose) onClose();

      // Reload page to refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error switching clinic:', err);
      setError(err instanceof Error ? err.message : 'Error al cambiar clínica');
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile version - full width buttons
  if (isMobile) {
    return (
      <div className="space-y-1">
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
          Clínicas
        </div>
        {clinics.map((clinic) => (
          <Button
            key={clinic.id}
            onClick={() => handleClinicSwitch(clinic.id)}
            disabled={isLoading || clinic.isCurrent}
            variant={clinic.isCurrent ? 'secondary' : 'ghost'}
            fullWidth
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              {clinic.name}
              {clinic.isPrimary && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  Principal
                </span>
              )}
            </span>
            {clinic.isCurrent && <Icons.check className="h-5 w-5" />}
          </Button>
        ))}
        {error && <div className="px-4 py-2 text-sm text-danger">{error}</div>}
      </div>
    );
  }

  // Desktop version - dropdown
  return (
    <div className="relative" ref={menuRef}>
      {/* Clinic Selector Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="sm"
        disabled={isLoading}
        className="gap-2"
        aria-label="Seleccionar clínica"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icons.settings className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {currentClinic?.name || 'Seleccionar clínica'}
        </span>
        <Icons.chevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-background rounded-lg shadow-lg border border-border py-2 z-50">
          {/* Header */}
          <div className="px-4 py-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Seleccionar clínica
            </p>
          </div>

          {/* Clinic List */}
          <div className="py-1 max-h-64 overflow-y-auto space-y-1 px-2">
            {clinics.map((clinic) => (
              <Button
                key={clinic.id}
                onClick={() => handleClinicSwitch(clinic.id)}
                disabled={isLoading || clinic.isCurrent}
                variant={clinic.isCurrent ? 'secondary' : 'ghost'}
                size="sm"
                fullWidth
                className="justify-between"
              >
                <span className="flex items-center gap-2">
                  {clinic.name}
                  {clinic.isPrimary && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      Principal
                    </span>
                  )}
                </span>
                {clinic.isCurrent && <Icons.check className="h-4 w-4" />}
              </Button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 border-t border-border">
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="px-4 py-2 border-t border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Icons.spinner className="h-3 w-3 animate-spin" />
                Cambiando clínica...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
