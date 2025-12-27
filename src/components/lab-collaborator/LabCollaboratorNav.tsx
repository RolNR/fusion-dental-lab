import { NavBar } from '@/components/ui/NavBar';

const navItems = [
  { href: '/lab-collaborator', label: 'Dashboard' },
  { href: '/lab-collaborator/orders', label: 'Órdenes' },
];

export function LabCollaboratorNav() {
  return (
    <NavBar
      basePath="/lab-collaborator"
      navItems={navItems}
      roleLabel="Colaborador"
      roleBadgeColor="secondary"
    />
  );
}
