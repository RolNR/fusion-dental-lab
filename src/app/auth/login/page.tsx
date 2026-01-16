import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Image from 'next/image';
import { authOptions } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { getRoleBasedRedirect } from '@/lib/redirect-helpers';

export const metadata = {
  title: 'Iniciar Sesión | Fusión Dental Lab',
  description: 'Inicia sesión en tu cuenta de Fusión Dental Lab',
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // Redirect if already logged in
  if (session?.user?.role) {
    redirect(getRoleBasedRedirect(session.user.role));
  }

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
          <h2 className="mt-6 text-2xl font-semibold text-foreground">Iniciar Sesión</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Accede a tu cuenta para gestionar tus órdenes dentales
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
