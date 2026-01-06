import { ProfileSettingsForm } from '@/components/settings/ProfileSettingsForm';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface SettingsPageProps {
  user: User;
}

export function SettingsPage({ user }: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-muted py-8 px-4 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Configuración de Perfil
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Administra la información de tu cuenta
          </p>
        </div>

        <ProfileSettingsForm user={user} />
      </div>
    </div>
  );
}
