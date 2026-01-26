'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

interface FieldError {
  field: string;
  message: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    clinicName: '',
    clinicAddress: '',
    razonSocial: '',
    fiscalAddress: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [useNameAsRazonSocial, setUseNameAsRazonSocial] = useState(false);
  const [useClinicAddressAsFiscal, setUseClinicAddressAsFiscal] = useState(false);

  // Sync razón social with name when checkbox is checked
  useEffect(() => {
    if (useNameAsRazonSocial) {
      setFormData((prev) => ({ ...prev, razonSocial: prev.name }));
    }
  }, [useNameAsRazonSocial, formData.name]);

  // Sync fiscal address with clinic address when checkbox is checked
  useEffect(() => {
    if (useClinicAddressAsFiscal) {
      setFormData((prev) => ({ ...prev, fiscalAddress: prev.clinicAddress }));
    }
  }, [useClinicAddressAsFiscal, formData.clinicAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        } else {
          setError(data.error || 'Error al crear la cuenta');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch {
      setError('Error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: string) => {
    return fieldErrors.find((e) => e.field === field)?.message;
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-md bg-success/10 p-6 text-center">
          <p className="text-sm font-medium text-success">
            Cuenta creada exitosamente. Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          name="name"
          label="Nombre completo"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={getFieldError('name')}
          placeholder="Dr. Juan Pérez"
          disabled={isLoading}
        />

        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          label="Correo electrónico"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={getFieldError('email')}
          placeholder="tu@ejemplo.com"
          disabled={isLoading}
        />

        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          label="Contraseña"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={getFieldError('password')}
          placeholder="Mínimo 8 caracteres"
          disabled={isLoading}
        />

        <Input
          id="phone"
          name="phone"
          type="tel"
          label="Teléfono"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={getFieldError('phone')}
          placeholder="(55) 1234-5678"
          disabled={isLoading}
        />

        {/* Datos fiscales section */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Datos fiscales</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="razonSocial"
                name="razonSocial"
                label="Razón social"
                value={formData.razonSocial}
                onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                error={getFieldError('razonSocial')}
                placeholder="Razón social para facturación"
                disabled={isLoading || useNameAsRazonSocial}
              />
              <Checkbox
                id="useNameAsRazonSocial"
                label="Mismo nombre del doctor"
                checked={useNameAsRazonSocial}
                onChange={(e) => setUseNameAsRazonSocial(e.target.checked)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Input
                id="fiscalAddress"
                name="fiscalAddress"
                label="Dirección fiscal"
                value={formData.fiscalAddress}
                onChange={(e) => setFormData({ ...formData, fiscalAddress: e.target.value })}
                error={getFieldError('fiscalAddress')}
                placeholder="Dirección fiscal para facturación"
                disabled={isLoading || useClinicAddressAsFiscal}
              />
              <Checkbox
                id="useClinicAddressAsFiscal"
                label="Misma dirección del consultorio"
                checked={useClinicAddressAsFiscal}
                onChange={(e) => setUseClinicAddressAsFiscal(e.target.checked)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Información del consultorio section */}
        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Información del consultorio
          </p>

          <div className="space-y-4">
            <Input
              id="clinicName"
              name="clinicName"
              label="Nombre del consultorio"
              required
              value={formData.clinicName}
              onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
              error={getFieldError('clinicName')}
              placeholder="Consultorio Dental Ejemplo"
              disabled={isLoading}
            />

            <Input
              id="clinicAddress"
              name="clinicAddress"
              label="Dirección del consultorio"
              value={formData.clinicAddress}
              onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
              error={getFieldError('clinicAddress')}
              placeholder="Calle, Número, Colonia, Ciudad"
              disabled={isLoading}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-danger/10 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{' '}
        <a href="/auth/login" className="font-medium text-primary hover:text-primary/80">
          Inicia sesión
        </a>
      </p>
    </div>
  );
}
