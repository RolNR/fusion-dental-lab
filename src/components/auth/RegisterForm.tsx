'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Role } from '@prisma/client';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as Role | '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.role) {
      newErrors.role = 'Por favor selecciona un tipo de cuenta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach((detail: { field: string; message: string }) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.error || 'Error al registrar la cuenta' });
        }
        return;
      }

      setSuccess(true);
    } catch (err) {
      setErrors({ general: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-md bg-green-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            ¡Registro exitoso!
          </h3>
          <p className="text-sm text-green-800 mb-4">
            Tu cuenta ha sido creada. Por favor espera la aprobación del administrador para acceder
            al sistema.
          </p>
          <Button onClick={() => router.push('/auth/login')} className="w-full">
            Ir a inicio de sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="name"
          name="name"
          type="text"
          label="Nombre completo"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Juan Pérez"
          disabled={isLoading}
          error={errors.name}
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Correo electrónico"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="tu@ejemplo.com"
          disabled={isLoading}
          error={errors.email}
        />

        <Select
          id="role"
          name="role"
          label="Tipo de cuenta"
          required
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
          disabled={isLoading}
          error={errors.role}
        >
          <option value="">Selecciona un tipo</option>
          <option value={Role.DENTIST}>Doctor/Dentista</option>
          <option value={Role.LAB}>Laboratorio Dental</option>
        </Select>

        <PasswordInput
          id="password"
          name="password"
          label="Contraseña"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          disabled={isLoading}
          error={errors.password}
          helperText="Mínimo 8 caracteres, incluye mayúscula, minúscula, número y carácter especial"
        />

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar contraseña"
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="••••••••"
          disabled={isLoading}
          error={errors.confirmPassword}
        />

        {errors.general && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Registrarse
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        ¿Ya tienes una cuenta?{' '}
        <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
          Inicia sesión aquí
        </a>
      </p>
    </div>
  );
}
