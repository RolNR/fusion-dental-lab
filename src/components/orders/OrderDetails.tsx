import { Order } from '@/types/order';

interface OrderDetailsProps {
  order: Order;
  showClinicInfo?: boolean;
  showDoctorInfo?: boolean;
}

export function OrderDetails({ order, showClinicInfo = true, showDoctorInfo = false }: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Información del Paciente</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
            <dd className="mt-1 text-sm text-foreground">{order.patientName}</dd>
          </div>
          {order.patientId && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">ID del Paciente</dt>
              <dd className="mt-1 text-sm text-foreground">{order.patientId}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-xl bg-background p-6 shadow-md border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Detalles de la Orden</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {order.teethNumbers && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Números de Dientes</dt>
              <dd className="mt-1 text-sm text-foreground">{order.teethNumbers}</dd>
            </div>
          )}
          {order.material && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Material</dt>
              <dd className="mt-1 text-sm text-foreground">{order.material}</dd>
            </div>
          )}
          {order.materialBrand && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Marca del Material</dt>
              <dd className="mt-1 text-sm text-foreground">{order.materialBrand}</dd>
            </div>
          )}
          {order.color && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Color</dt>
              <dd className="mt-1 text-sm text-foreground">{order.color}</dd>
            </div>
          )}
          {order.scanType && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tipo de Escaneo</dt>
              <dd className="mt-1 text-sm text-foreground">{order.scanType}</dd>
            </div>
          )}
        </dl>
        {order.description && (
          <div className="mt-4">
            <dt className="text-sm font-medium text-muted-foreground">Descripción</dt>
            <dd className="mt-1 text-sm text-foreground">{order.description}</dd>
          </div>
        )}
        {order.notes && (
          <div className="mt-4">
            <dt className="text-sm font-medium text-muted-foreground">Notas</dt>
            <dd className="mt-1 text-sm text-foreground">{order.notes}</dd>
          </div>
        )}
      </div>

      {showClinicInfo && order.clinic && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Información de la Clínica</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Clínica</dt>
              <dd className="mt-1 text-sm text-foreground">{order.clinic.name}</dd>
            </div>
            {order.clinic.email && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="mt-1 text-sm text-foreground">{order.clinic.email}</dd>
              </div>
            )}
            {order.clinic.phone && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
                <dd className="mt-1 text-sm text-foreground">{order.clinic.phone}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {showDoctorInfo && order.doctor && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Información del Doctor</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Doctor</dt>
              <dd className="mt-1 text-sm text-foreground">{order.doctor.name}</dd>
            </div>
            {order.doctor.email && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="mt-1 text-sm text-foreground">{order.doctor.email}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
