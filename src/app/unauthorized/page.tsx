import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth-helpers';

export const metadata = {
  title: 'Acceso No Autorizado | LabWiseLink',
  description: 'No tienes permisos para acceder a esta página',
};

export default async function UnauthorizedPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900">403</h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">Acceso No Autorizado</h2>
          <p className="mt-2 text-sm text-gray-600">
            No tienes los permisos necesarios para acceder a esta página.
          </p>
        </div>

        <div className="space-y-3">
          {user ? (
            <Link href="/dashboard" className="block">
              <Button className="w-full">Ir al Panel Principal</Button>
            </Link>
          ) : (
            <Link href="/auth/login" className="block">
              <Button className="w-full">Iniciar Sesión</Button>
            </Link>
          )}
          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              Ir a Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
