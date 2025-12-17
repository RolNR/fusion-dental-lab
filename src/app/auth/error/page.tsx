import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Error de Autenticación | LabWiseLink',
  description: 'Error al iniciar sesión',
};

interface ErrorPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const error = params.error;

  const getErrorMessage = (error?: string) => {
    switch (error) {
      case 'Configuration':
        return 'Hay un problema con la configuración del servidor.';
      case 'AccessDenied':
        return 'Acceso denegado. No tienes permisos para acceder.';
      case 'Verification':
        return 'El token de verificación ha expirado o ya se ha usado.';
      default:
        return 'Ocurrió un error durante la autenticación.';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">LabWiseLink</h1>
          <h2 className="mt-6 text-2xl font-semibold text-danger">Error de Autenticación</h2>
        </div>

        <div className="rounded-md bg-danger/10 p-6">
          <p className="text-center text-sm text-danger">{getErrorMessage(error)}</p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/login" className="block">
            <Button className="w-full">Volver a Iniciar Sesión</Button>
          </Link>
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
