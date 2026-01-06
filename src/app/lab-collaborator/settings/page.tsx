import { requireRole } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { SettingsPage } from '@/components/settings/SettingsPage';

export const metadata = {
  title: 'Configuración de Perfil | LabWiseLink',
  description: 'Configuración de tu perfil de usuario',
};

export default async function LabCollaboratorSettingsPage() {
  const session = await requireRole([Role.LAB_COLLABORATOR]);
  return <SettingsPage user={session.user} />;
}
