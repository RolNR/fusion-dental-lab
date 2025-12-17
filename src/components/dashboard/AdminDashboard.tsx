import { PendingUsers } from '@/components/admin/PendingUsers';
import { StatsCard } from './StatsCard';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'DENTIST' | 'LAB' | 'ADMIN';
  createdAt: Date;
}

interface AdminDashboardProps {
  pendingUsers: User[];
  approvedCount: number;
}

export function AdminDashboard({ pendingUsers, approvedCount }: AdminDashboardProps) {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <StatsCard title="Usuarios Pendientes" value={pendingUsers.length} />
        <StatsCard title="Usuarios Aprobados" value={approvedCount} />
      </div>

      <div className="rounded-lg bg-background p-6 shadow border border-border">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Solicitudes Pendientes</h2>
        <PendingUsers users={pendingUsers} />
      </div>
    </>
  );
}
