'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/logo-fusion.png"
              alt="Fusión Dental Lab"
              width={250}
              height={60}
              priority
            />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-foreground">Cerrar Sesión</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            ¿Estás seguro que deseas cerrar tu sesión?
          </p>
        </div>

        <div className="rounded-xl bg-background p-6 shadow-md border border-border space-y-4">
          <div className="space-y-3">
            <Button
              onClick={handleSignOut}
              variant="danger"
              className="w-full"
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Cerrando sesión...' : 'Sí, cerrar sesión'}
            </Button>

            <Link href="/" className="block">
              <Button variant="secondary" className="w-full" disabled={isSigningOut}>
                Cancelar
              </Button>
            </Link>
          </div>

          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Al cerrar sesión, regresarás a la página de inicio de sesión
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
