'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/lab-admin', label: 'Dashboard' },
  { href: '/lab-admin/clinics', label: 'Clínicas' },
  { href: '/lab-admin/users', label: 'Usuarios' },
];

export function LabAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/lab-admin" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">
                LabWiseLink
              </span>
              <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/lab-admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
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
            className="rounded-md bg-danger px-3 py-2 text-sm font-medium text-danger-foreground hover:bg-danger/90"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>
    </nav>
  );
}
