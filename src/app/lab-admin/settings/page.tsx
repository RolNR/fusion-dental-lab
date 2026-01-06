import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm';

export const metadata = {
  title: 'Configuración de Perfil | LabWiseLink',
  description: 'Configuración de tu perfil de usuario',
};

export default async function LabAdminSettingsPage() {
  const session = await requireRole([Role.LAB_ADMIN]);

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Configuración de Perfil</h1>
          <p className="mt-2 text-muted-foreground">
            Administra la información de tu cuenta
          </p>
        </div>

        <ProfileSettingsForm user={session.user} />
      </div>
    </div>
  );
}
