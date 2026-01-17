'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { getRoleBasedRedirect } from '@/lib/redirect-helpers';
import { Role } from '@prisma/client';

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        // Fetch session to get user role
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        // Redirect based on role
        if (session?.user?.role) {
          router.push(getRoleBasedRedirect(session.user.role as Role));
        } else {
          router.push('/unauthorized');
        }
        router.refresh();
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          label="Correo electrónico"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="tu@ejemplo.com"
          disabled={isLoading}
        />

        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          label="Contraseña"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="••••••••"
          disabled={isLoading}
        />

        {error && (
          <div className="rounded-md bg-danger/10 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{' '}
        <a href="/auth/register" className="font-medium text-primary hover:text-primary/80">
          Regístrate aquí
        </a>
      </p>
    </div>
  );
}
