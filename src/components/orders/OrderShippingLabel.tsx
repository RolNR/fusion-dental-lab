'use client';

import { Order } from '@/types/order';
import { formatDate } from '@/lib/formatters';

interface OrderShippingLabelProps {
  order: Order;
}

export function OrderShippingLabel({ order }: OrderShippingLabelProps) {
  return (
    <div className="shipping-label hidden print:block print:m-0">
      {/* Header */}
      <div className="bg-white p-3 flex items-center justify-between border-b-4 border-[#D40511] rounded-t-lg">
        <div className="flex items-center gap-2">
          <img src="/ftd_logo.svg" alt="Logo" className="h-6 w-auto" />
          <div className="border-l-2 border-gray-400 pl-2">
            <h1 className="text-xl font-bold text-black">CONTROL DE ENVÍO</h1>
          </div>
        </div>
        <div className="text-right flex-1 ml-4">
          <p className="text-xs font-semibold text-gray-600">Orden:</p>
          <p className="text-xl font-bold text-[#D40511] break-words">{order.orderNumber}</p>
        </div>
      </div>

      <div className="p-3 bg-white">
        {/* From/To Section */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* From - Doctor/Consultorio */}
          <div className="border-2 border-gray-700 p-3 rounded-lg shadow-sm">
            <div className="bg-black text-white px-3 py-1 mb-3 inline-block font-bold rounded">
              DE
            </div>
            <div className="space-y-1">
              {order.doctor && (
                <>
                  {order.doctor.clinicName && (
                    <p className="font-bold text-lg">{order.doctor.clinicName}</p>
                  )}
                  {order.doctor.clinicAddress && (
                    <p className="text-sm">{order.doctor.clinicAddress}</p>
                  )}
                  {order.doctor.phone && <p className="text-sm">Tel: {order.doctor.phone}</p>}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-sm font-semibold">Doctor:</p>
                    <p className="text-sm">{order.doctor.name}</p>
                    {order.doctor.email && (
                      <p className="text-xs text-gray-600">{order.doctor.email}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* To - Laboratory */}
          <div className="border-2 border-gray-700 p-3 bg-gray-100 rounded-lg shadow-sm">
            <div className="bg-[#D40511] text-white px-3 py-1 mb-3 inline-block font-bold rounded">
              PARA
            </div>
            <div className="space-y-1">
              {order.doctor?.doctorLaboratory ? (
                <>
                  <p className="font-bold text-lg">{order.doctor.doctorLaboratory.name}</p>
                  {order.doctor.doctorLaboratory.address && (
                    <p className="text-sm">{order.doctor.doctorLaboratory.address}</p>
                  )}
                  {order.doctor.doctorLaboratory.phone && (
                    <p className="text-sm">Tel: {order.doctor.doctorLaboratory.phone}</p>
                  )}
                  {order.doctor.doctorLaboratory.email && (
                    <p className="text-sm">Email: {order.doctor.doctorLaboratory.email}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-bold text-lg">Laboratorio Dental</p>
                  <p className="text-sm">Dirección del laboratorio</p>
                  <p className="text-sm">Ciudad, Estado, CP</p>
                  <p className="text-sm">Tel: (XXX) XXX-XXXX</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="border-2 border-gray-700 p-3 mb-3 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-gray-200 px-3 py-1 inline-block font-bold rounded">
              DETALLES DEL PEDIDO
            </div>
            {order.isUrgent && (
              <div className="bg-[#D40511] text-white px-3 py-1 inline-block font-bold rounded shadow-sm">
                ⚡ URGENTE (+30%)
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Paciente:</p>
              <p className="font-semibold">{order.patientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Dientes:</p>
              <p className="font-semibold">{order.teethNumbers || 'N/A'}</p>
            </div>
            {order.isDigitalScan && (
              <div>
                <p className="text-xs text-gray-600 font-semibold">Tipo de Impresión:</p>
                <p className="font-semibold">Escaneo Digital</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-600 font-semibold">Fecha de Creación:</p>
              <p className="font-semibold">{formatDate(order.createdAt, false)}</p>
            </div>
            {order.fechaEntregaDeseada && (
              <div className="col-span-2">
                <p className="text-xs text-gray-600 font-semibold">Fecha de Entrega Deseada:</p>
                <p className="font-semibold text-[#D40511]">
                  {formatDate(order.fechaEntregaDeseada, false)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Materials Sent */}
        {order.materialSent && Object.entries(order.materialSent).some(([_, sent]) => sent) && (
          <div className="border-2 border-gray-700 p-3 mb-3 rounded-lg shadow-sm">
            <div className="bg-gray-200 px-3 py-1 mb-3 inline-block font-bold rounded">
              MATERIALES ENVIADOS
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(order.materialSent)
                .filter(([_, sent]) => sent)
                .map(([material]) => (
                  <div
                    key={material}
                    className="bg-[#FFCC00] px-3 py-1 rounded font-semibold text-sm border border-black"
                  >
                    ✓ {material.replace(/_/g, ' ')}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-2 border-t-2 border-dashed border-gray-400 pt-2">
          <p className="text-xs text-gray-600">
            <strong>INSTRUCCIONES:</strong> Coloque esta guía en un lugar visible de la caja.
            Asegúrese de que el paquete esté bien sellado.
          </p>
        </div>
      </div>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0.5in;
          }

          /* Hide everything */
          body * {
            visibility: hidden !important;
          }

          /* Show only shipping label and its children */
          .shipping-label,
          .shipping-label * {
            visibility: visible !important;
          }

          /* Position shipping label */
          .shipping-label {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Ensure colors print */
          .shipping-label * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
