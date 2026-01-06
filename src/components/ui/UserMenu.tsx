'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';
import { LogoutButton } from '@/components/ui/LogoutButton';

interface UserMenuProps {
  basePath: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export function UserMenu({ basePath, isMobile = false, onClose }: UserMenuProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (!session?.user) {
    return null;
  }

  // Get user initials for avatar
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const initials = getInitials(session.user.name, session.user.email);

  // Mobile version - simple menu items
  if (isMobile) {
    return (
      <div className="space-y-1">
        <Link
          href={`${basePath}/settings`}
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-semibold text-foreground hover:bg-muted transition-all duration-200"
        >
          <Icons.settings className="h-5 w-5 text-muted-foreground" />
          <span>Configuración</span>
        </Link>
        <div className="pt-1">
          <LogoutButton
            variant="ghost"
            showIcon={true}
            className="w-full justify-start px-4 py-3 text-base font-semibold"
          />
        </div>
      </div>
    );
  }

  // Desktop version - avatar dropdown
  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar Circle */}
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        <Icons.chevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background rounded-lg shadow-lg border border-border py-2 z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">
              {session.user.name || 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href={`${basePath}/settings`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Icons.settings className="h-4 w-4 text-muted-foreground" />
              <span>Configuración</span>
            </Link>
          </div>

          {/* Logout Section */}
          <div className="border-t border-border pt-1">
            <div className="px-4 py-2">
              <LogoutButton
                variant="ghost"
                showIcon={true}
                className="w-full justify-start"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
