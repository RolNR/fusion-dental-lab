import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Registro | LabWiseLink',
  description: 'Crea tu cuenta en LabWiseLink',
};

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  // Redirect if already logged in
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">LabWiseLink</h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">Crear Cuenta</h2>
          <p className="mt-2 text-sm text-gray-600">
            Regístrate para comenzar a gestionar tus órdenes dentales
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
