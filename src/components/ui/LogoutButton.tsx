import Link from 'next/link';

export function LogoutButton() {
  return (
    <Link
      href="/auth/signout"
      className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground hover:bg-danger-hover transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger active:scale-[0.98]"
    >
      Cerrar sesión
    </Link>
  );
}
