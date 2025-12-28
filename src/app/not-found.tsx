import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Página no encontrada | LabWiseLink',
  description: 'La página que buscas no existe',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="mt-6 text-2xl font-semibold text-foreground">
            Página no encontrada
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="rounded-xl bg-background p-6 shadow-md border border-border space-y-4">
          <p className="text-sm text-muted-foreground">
            Verifica que la URL sea correcta o regresa a la página de inicio.
          </p>

          <div className="space-y-3">
            <Link href="/" className="block">
              <Button variant="primary" className="w-full">
                Ir a Inicio
              </Button>
            </Link>

            <Link href="/auth/login" className="block">
              <Button variant="secondary" className="w-full">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
