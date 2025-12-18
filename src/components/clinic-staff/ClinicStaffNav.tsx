import { NavBar } from '@/components/ui/NavBar';

interface ClinicStaffNavProps {
  role: 'doctor' | 'assistant';
  basePath: string;
}

export function ClinicStaffNav({ role, basePath }: ClinicStaffNavProps) {
  const navItems = [
    { href: basePath, label: 'Dashboard' },
    { href: `${basePath}/orders`, label: 'Órdenes' },
    { href: `${basePath}/orders/new`, label: 'Nueva Orden' },
  ];

  const roleLabel = role === 'doctor' ? 'Doctor' : 'Asistente';

  return (
    <NavBar
      basePath={basePath}
      navItems={navItems}
      roleLabel={roleLabel}
      roleBadgeColor="success"
    />
  );
}
