interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
      <p className="mt-2 text-sm text-gray-600">Bienvenido/a, {userName}</p>
    </div>
  );
}
