import { NavBar } from '@/components/ui/NavBar';

const navItems = [
  { href: '/lab-admin', label: 'Dashboard' },
  { href: '/lab-admin/clinics', label: 'Clínicas' },
  { href: '/lab-admin/users', label: 'Usuarios' },
  { href: '/lab-admin/collaborators', label: 'Colaboradores' },
  { href: '/lab-admin/orders', label: 'Órdenes' },
];

export function LabAdminNav() {
  return (
    <NavBar basePath="/lab-admin" navItems={navItems} roleLabel="Admin" roleBadgeColor="primary" />
  );
}
