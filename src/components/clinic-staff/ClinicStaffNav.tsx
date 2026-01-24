import { NavBar } from '@/components/ui/NavBar';

interface ClinicStaffNavProps {
  basePath: string;
}

export function ClinicStaffNav({ basePath }: ClinicStaffNavProps) {
  const navItems = [
    { href: basePath, label: 'Dashboard' },
    { href: `${basePath}/orders`, label: 'Órdenes' },
    { href: `${basePath}/orders/new`, label: 'Nueva Orden' },
  ];

  return (
    <NavBar basePath={basePath} navItems={navItems} roleLabel="Doctor" roleBadgeColor="success" />
  );
}
