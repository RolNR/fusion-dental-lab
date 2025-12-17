interface ComingSoonCardProps {
  message: string;
}

export function ComingSoonCard({ message }: ComingSoonCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="text-center py-8 text-gray-500">
        <p>{message}</p>
      </div>
    </div>
  );
}
