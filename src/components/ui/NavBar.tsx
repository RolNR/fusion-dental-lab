'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from '@/components/ui/UserMenu';
import { ClinicSelector } from '@/components/ui/ClinicSelector';
import { Icons } from '@/components/ui/Icons';

interface NavItem {
  href: string;
  label: string;
}

interface NavBarProps {
  basePath: string;
  navItems: NavItem[];
  roleLabel: string;
  roleBadgeColor?: 'primary' | 'secondary' | 'success';
}

export function NavBar({ basePath, navItems, roleLabel, roleBadgeColor = 'primary' }: NavBarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const badgeColorClasses = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
  };

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={basePath} className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-primary">LabWiseLink</span>
              <span
                className={`rounded-lg px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-xs font-semibold ${badgeColorClasses[roleBadgeColor]}`}
              >
                {roleLabel}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              // Exact match or starts with (but not if another item is a better match)
              const isExactMatch = pathname === item.href;
              const isStartMatch = item.href !== basePath && pathname.startsWith(item.href);

              // Check if any other nav item is a longer, more specific match
              const hasMoreSpecificMatch = navItems.some(
                (other) =>
                  other.href !== item.href &&
                  other.href.startsWith(item.href) &&
                  pathname.startsWith(other.href)
              );

              const isActive = isExactMatch || (isStartMatch && !hasMoreSpecificMatch);

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

          {/* Desktop Clinic Selector & User Menu - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <ClinicSelector />
            <UserMenu basePath={basePath} />
          </div>

          {/* Mobile Menu Button - Hidden on desktop */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <Icons.x className="h-6 w-6" /> : <Icons.menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown - appears below navbar, overlays content */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="block rounded-lg px-4  text-base font-semibold transition-all duration-200 "
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu */}
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border shadow-lg py-3 px-4 sm:px-6 z-50">
            <div className="space-y-1">
              {navItems.map((item) => {
                // Exact match or starts with (but not if another item is a better match)
                const isExactMatch = pathname === item.href;
                const isStartMatch = item.href !== basePath && pathname.startsWith(item.href);

                // Check if any other nav item is a longer, more specific match
                const hasMoreSpecificMatch = navItems.some(
                  (other) =>
                    other.href !== item.href &&
                    other.href.startsWith(item.href) &&
                    pathname.startsWith(other.href)
                );

                const isActive = isExactMatch || (isStartMatch && !hasMoreSpecificMatch);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-base font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-border mt-2 space-y-2">
                <ClinicSelector isMobile={true} onClose={() => setMobileMenuOpen(false)} />
                <UserMenu
                  basePath={basePath}
                  isMobile={true}
                  onClose={() => setMobileMenuOpen(false)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
