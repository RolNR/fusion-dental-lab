import { NavBar } from '@/components/ui/NavBar';

const navItems = [
  { href: '/clinic-admin', label: 'Dashboard' },
  { href: '/clinic-admin/orders', label: 'Órdenes' },
  { href: '/clinic-admin/doctors', label: 'Doctores' },
  { href: '/clinic-admin/assistants', label: 'Asistentes' },
];

export function ClinicAdminNav() {
  return (
    <NavBar
      basePath="/clinic-admin"
      navItems={navItems}
      roleLabel="Clínica"
      roleBadgeColor="secondary"
    />
  );
}
