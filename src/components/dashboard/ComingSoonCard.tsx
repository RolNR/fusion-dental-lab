interface ComingSoonCardProps {
  message: string;
}

export function ComingSoonCard({ message }: ComingSoonCardProps) {
  return (
    <div className="rounded-lg bg-background p-6 shadow border border-border">
      <div className="text-center py-8 text-muted-foreground">
        <p>{message}</p>
      </div>
    </div>
  );
}
