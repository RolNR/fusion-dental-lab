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
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la cuenta</h2>
      <dl className="space-y-3">
        <div>
          <dt className="text-sm font-medium text-gray-500">Nombre</dt>
          <dd className="mt-1 text-sm text-gray-900">{name}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Correo electrónico</dt>
          <dd className="mt-1 text-sm text-gray-900">{email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Tipo de cuenta</dt>
          <dd className="mt-1 text-sm text-gray-900">{getRoleTitle(role)}</dd>
        </div>
      </dl>
    </div>
  );
}
