'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/lab-admin', label: 'Dashboard' },
  { href: '/lab-admin/clinics', label: 'Clínicas' },
  { href: '/lab-admin/users', label: 'Usuarios' },
  { href: '/lab-admin/collaborators', label: 'Colaboradores' },
  { href: '/lab-admin/orders', label: 'Órdenes' },
];

export function LabAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/lab-admin" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">
                LabWiseLink
              </span>
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/lab-admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <Link
            href="/api/auth/signout"
            className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground hover:bg-danger-hover transition-all duration-200 shadow-sm"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>
    </nav>
  );
}
