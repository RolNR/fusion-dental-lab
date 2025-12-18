'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/ui/LogoutButton';

interface NavItem {
  href: string;
  label: string;
}

interface NavBarProps {
  basePath: string;
  navItems: NavItem[];
  roleLabel: string;
  roleBadgeColor?: 'primary' | 'secondary' | 'success' | 'info';
}

export function NavBar({ basePath, navItems, roleLabel, roleBadgeColor = 'primary' }: NavBarProps) {
  const pathname = usePathname();

  const badgeColorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
  };

  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href={basePath} className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">
                LabWiseLink
              </span>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${badgeColorClasses[roleBadgeColor]}`}>
                {roleLabel}
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== basePath && pathname.startsWith(item.href));

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

          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
