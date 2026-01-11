import { Order } from '@/types/order';

interface OrderDetailsProps {
  order: Order;
  showClinicInfo?: boolean;
  showDoctorInfo?: boolean;
}

export function OrderDetails({
  order,
  showClinicInfo = true,
  showDoctorInfo = false,
}: OrderDetailsProps) {
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
          {order.tipoTrabajo && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tipo de Trabajo</dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.tipoTrabajo === 'restauracion' ? 'Restauración' : 'Otro'}
              </dd>
            </div>
          )}
          {order.tipoRestauracion && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tipo de Restauración</dt>
              <dd className="mt-1 text-sm text-foreground capitalize">{order.tipoRestauracion}</dd>
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

      {/* Impression/Scanning Details */}
      {(order.escanerUtilizado || order.tipoSilicon || order.notaModeloFisico) && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Detalles de Impresión</h2>
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
            {order.tipoSilicon && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tipo de Silicona</dt>
                <dd className="mt-1 text-sm text-foreground capitalize">{order.tipoSilicon}</dd>
              </div>
            )}
          </dl>
          {order.notaModeloFisico && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-muted-foreground">Nota de Modelo Físico</dt>
              <dd className="mt-1 text-sm text-foreground">{order.notaModeloFisico}</dd>
            </div>
          )}
        </div>
      )}

      {/* Implant Information */}
      {order.trabajoSobreImplante && order.informacionImplante && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Información de Implante</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Marca del Implante</dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.informacionImplante.marcaImplante}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Sistema de Conexión</dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.informacionImplante.sistemaConexion}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Número de Implantes</dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.informacionImplante.numeroImplantes}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tipo de Restauración</dt>
              <dd className="mt-1 text-sm text-foreground capitalize">
                {order.informacionImplante.tipoRestauracion}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Tipo de Aditamento</dt>
              <dd className="mt-1 text-sm text-foreground capitalize">
                {order.informacionImplante.tipoAditamento}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Perfil de Emergencia</dt>
              <dd className="mt-1 text-sm text-foreground capitalize">
                {order.informacionImplante.perfilEmergencia}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Condición de Tejido Blando
              </dt>
              <dd className="mt-1 text-sm text-foreground capitalize">
                {order.informacionImplante.condicionTejidoBlando}
              </dd>
            </div>
          </dl>
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
                {order.oclusionDiseno.tipoOclusion.replace(/_/g, ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Espacio Interoclusal Suficiente
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.oclusionDiseno.espacioInteroclusalSuficiente ? 'Sí' : 'No'}
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

      {/* Extended Color Information */}
      {order.colorInfo && (
        <div className="rounded-xl bg-background p-6 shadow-md border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Información de Color</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {order.colorInfo.shadeType && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tipo de Sombra</dt>
                <dd className="mt-1 text-sm text-foreground">{order.colorInfo.shadeType}</dd>
              </div>
            )}
            {order.colorInfo.shadeCode && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Código de Sombra</dt>
                <dd className="mt-1 text-sm text-foreground">{order.colorInfo.shadeCode}</dd>
              </div>
            )}
            {order.colorInfo.colorimeter && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Colorímetro</dt>
                <dd className="mt-1 text-sm text-foreground">{order.colorInfo.colorimeter}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Mamelones</dt>
              <dd className="mt-1 text-sm text-foreground capitalize">
                {order.colorInfo.mamelones}
              </dd>
            </div>
            {order.colorInfo.texture && order.colorInfo.texture.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Textura</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.colorInfo.texture.join(', ')}
                </dd>
              </div>
            )}
            {order.colorInfo.gloss && order.colorInfo.gloss.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Brillo</dt>
                <dd className="mt-1 text-sm text-foreground">{order.colorInfo.gloss.join(', ')}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Nivel de Translucidez</dt>
              <dd className="mt-1 text-sm text-foreground">
                {order.colorInfo.translucency.level}/10 - {order.colorInfo.translucency.description}
              </dd>
            </div>
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
