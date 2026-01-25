import { Order } from '@/types/order';
import { CollapsibleToothList } from './CollapsibleToothCard';

interface OrderDetailsProps {
  order: Order;
  showDoctorInfo?: boolean;
}

export function OrderDetails({ order, showDoctorInfo = false }: OrderDetailsProps) {
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
          {order.fechaEntregaDeseada && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Fecha de Entrega Deseada
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {new Date(order.fechaEntregaDeseada).toLocaleDateString('es-ES')}
              </dd>
            </div>
          )}
          {order.teethNumbers && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Números de Dientes</dt>
              <dd className="mt-1 text-sm text-foreground">{order.teethNumbers}</dd>
            </div>
          )}
          {order.tipoCaso && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tipo de Caso</dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.tipoCaso === 'nuevo' ? 'Nuevo' : 'Garantía'}
              </dd>
            </div>
          )}
          {order.isDigitalScan && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Escaneo Digital</dt>
              <dd className="mt-1 text-sm text-foreground">Sí</dd>
            </div>
          )}
          {order.submissionType && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tipo de Envío</dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.submissionType === 'prueba_estructura' && 'Prueba de Estructura'}
                {order.submissionType === 'prueba_estetica' && 'Prueba Estética'}
                {order.submissionType === 'terminado' && 'Terminado'}
              </dd>
            </div>
          )}
          {order.articulatedBy && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Articulado Por</dt>
              <dd className="mt-1 text-sm text-foreground capitalize">{order.articulatedBy}</dd>
            </div>
          )}
        </dl>

        {order.motivoGarantia && (
          <div className="mt-4">
            <dt className="text-sm font-medium text-muted-foreground">Motivo de Garantía</dt>
            <dd className="mt-1 text-sm text-foreground">{order.motivoGarantia}</dd>
          </div>
        )}
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

      {/* Digital Scan Details */}
      {(order.escanerUtilizado || order.otroEscaner) && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Detalles de Escaneo Digital</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {order.escanerUtilizado && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Escáner Utilizado</dt>
                <dd className="mt-1 text-sm text-foreground">{order.escanerUtilizado}</dd>
              </div>
            )}
            {order.otroEscaner && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Otro Escáner</dt>
                <dd className="mt-1 text-sm text-foreground">{order.otroEscaner}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Teeth Configuration */}
      {order.teeth && order.teeth.length > 0 && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Configuración de Dientes</h2>
          <CollapsibleToothList
            teeth={order.teeth}
            renderToothDetails={(tooth) => (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tooth.material && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Material</dt>
                    <dd className="mt-1 text-sm text-foreground">{tooth.material}</dd>
                  </div>
                )}
                {tooth.tipoRestauracion && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Tipo de Restauración
                    </dt>
                    <dd className="mt-1 text-sm text-foreground capitalize">
                      {tooth.tipoRestauracion}
                    </dd>
                  </div>
                )}
                {tooth.trabajoSobreImplante && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Trabajo sobre Implante
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">Sí</dd>
                  </div>
                )}
                {tooth.colorInfo && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Información de Color
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {(tooth.colorInfo as any).shadeType && (
                        <span>Sistema: {(tooth.colorInfo as any).shadeType}</span>
                      )}
                      {(tooth.colorInfo as any).shadeCode && (
                        <span className="ml-2">Código: {(tooth.colorInfo as any).shadeCode}</span>
                      )}
                    </dd>
                  </div>
                )}
                {tooth.informacionImplante && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground mb-2">
                      Información de Implante
                    </dt>
                    <dd className="mt-1 text-sm text-foreground space-y-1">
                      {(tooth.informacionImplante as any).marcaImplante && (
                        <div>Marca: {(tooth.informacionImplante as any).marcaImplante}</div>
                      )}
                      {(tooth.informacionImplante as any).sistemaConexion && (
                        <div>
                          Sistema de Conexión: {(tooth.informacionImplante as any).sistemaConexion}
                        </div>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          />
        </div>
      )}

      {/* Occlusion Design */}
      {order.oclusionDiseno && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Oclusión y Diseño</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tipo de Oclusión</dt>
              <dd className="mt-1 text-sm text-foreground capitalize">
                {order.oclusionDiseno.tipoOclusion?.replace(/_/g, ' ') || 'No especificado'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Espacio Interoclusal Suficiente
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.oclusionDiseno.espacioInteroclusalSuficiente !== undefined
                  ? order.oclusionDiseno.espacioInteroclusalSuficiente
                    ? 'Sí'
                    : 'No'
                  : 'No especificado'}
              </dd>
            </div>
            {order.oclusionDiseno.solucionEspacioInsuficiente && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Solución para Espacio Insuficiente
                </dt>
                <dd className="mt-1 text-sm text-foreground capitalize">
                  {order.oclusionDiseno.solucionEspacioInsuficiente.replace(/_/g, ' ')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Material Sent */}
      {order.materialSent && Object.keys(order.materialSent).length > 0 && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Material Enviado</h2>
          <dl className="grid grid-cols-1 gap-2">
            {Object.entries(order.materialSent).map(
              ([key, value]) =>
                value && (
                  <div key={key} className="flex items-center">
                    <dd className="text-sm text-foreground">✓ {key.replace(/_/g, ' ')}</dd>
                  </div>
                )
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
            {order.doctor.phone && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
                <dd className="mt-1 text-sm text-foreground">{order.doctor.phone}</dd>
              </div>
            )}
            {order.doctor.clinicName && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Consultorio</dt>
                <dd className="mt-1 text-sm text-foreground">{order.doctor.clinicName}</dd>
              </div>
            )}
            {order.doctor.clinicAddress && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Dirección</dt>
                <dd className="mt-1 text-sm text-foreground">{order.doctor.clinicAddress}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
