import { NavBar } from '@/components/ui/NavBar';

const navItems = [
  { href: '/lab-admin', label: 'Dashboard' },
  { href: '/lab-admin/users', label: 'Usuarios' },
  { href: '/lab-admin/orders', label: 'Órdenes' },
  { href: '/lab-admin/laboratory', label: 'Laboratorio' },
];

export function LabAdminNav() {
  return (
    <NavBar basePath="/lab-admin" navItems={navItems} roleLabel="Admin" roleBadgeColor="primary" />
  );
}
