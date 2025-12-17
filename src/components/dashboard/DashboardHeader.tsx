interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-foreground">Panel Principal</h1>
      <p className="mt-2 text-sm text-muted-foreground">Bienvenido/a, {userName}</p>
    </div>
  );
}
