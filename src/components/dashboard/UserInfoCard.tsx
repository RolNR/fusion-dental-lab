import { Role } from '@prisma/client';

interface UserInfoCardProps {
  name: string;
  email: string;
  role: Role;
}

const getRoleTitle = (role: Role) => {
  switch (role) {
    case Role.ADMIN:
      return 'Administrador';
    case Role.DENTIST:
      return 'Doctor/Dentista';
    case Role.LAB:
      return 'Laboratorio';
    default:
      return role;
  }
};

export function UserInfoCard({ name, email, role }: UserInfoCardProps) {
  return (
    <div className="rounded-lg bg-background p-6 shadow border border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">Información de la cuenta</h2>
      <dl className="space-y-3">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
          <dd className="mt-1 text-sm text-foreground">{name}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted-foreground">Correo electrónico</dt>
          <dd className="mt-1 text-sm text-foreground">{email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted-foreground">Tipo de cuenta</dt>
          <dd className="mt-1 text-sm text-foreground">{getRoleTitle(role)}</dd>
        </div>
      </dl>
    </div>
  );
}
