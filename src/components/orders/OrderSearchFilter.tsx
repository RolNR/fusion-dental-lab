'use client';

import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';

interface OrderSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  showAllStatus?: boolean;
}

export function OrderSearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  showAllStatus = true,
}: OrderSearchFilterProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* Search input */}
      <div className="flex-1">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar por paciente, número de orden o doctor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <Icons.x className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status filter */}
      <div className="w-full sm:w-64">
        <Select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
          {showAllStatus && <option value="">Todos los estados</option>}
          <option value="DRAFT">Borrador</option>
          <option value="PENDING_REVIEW">Pendiente Revisión</option>
          <option value="MATERIALS_SENT">Materiales Enviados</option>
          <option value="NEEDS_INFO">Necesita Información</option>
          <option value="IN_PROGRESS">En Proceso</option>
          <option value="COMPLETED">Completado</option>
          <option value="CANCELLED">Cancelado</option>
        </Select>
      </div>
    </div>
  );
}
