/**
 * Generates a human-readable case summary from order data for lab staff
 */

import { OrderDetail } from '@/types/order';

// Translation maps for enum values
const CASE_TYPE_LABELS: Record<string, string> = {
  nuevo: 'un caso nuevo',
  garantia: 'un caso de garantía',
};

const RESTORATION_TYPE_LABELS: Record<string, string> = {
  corona: 'corona',
  puente: 'puente',
  inlay: 'inlay',
  onlay: 'onlay',
  carilla: 'carilla',
  provisional: 'provisional',
};

const SCAN_TYPE_LABELS: Record<string, string> = {
  DIGITAL_SCAN: 'escaneo digital',
  ANALOG_MOLD: 'modelo análogo',
};

const ARTICULATED_BY_LABELS: Record<string, string> = {
  doctor: 'doctor',
  laboratorio: 'laboratorio',
};

/**
 * Generates a natural language case summary
 */
export function generateCaseSummary(order: OrderDetail): string {
  const sections: string[] = [];

  // Opening - Patient and case type
  const caseType = order.tipoCaso ? CASE_TYPE_LABELS[order.tipoCaso] || order.tipoCaso : 'un caso';
  let opening = `El paciente ${order.patientName} necesita ${caseType}`;

  if (order.isUrgent) {
    opening += ' (URGENTE - 30% recargo)';
  }
  opening += '.';
  sections.push(opening);

  // Warranty reason if applicable
  if (order.tipoCaso === 'garantia' && order.motivoGarantia) {
    sections.push(`Motivo de garantía: ${order.motivoGarantia}.`);
  }

  // Return original work if applicable
  if (order.seDevuelveTrabajoOriginal) {
    sections.push('Se debe devolver el trabajo original.');
  }

  // Teeth and work details - show each tooth individually
  if (order.teeth && order.teeth.length > 0) {
    const toothSummaries: string[] = [];

    // Sort teeth numerically
    const sortedTeeth = [...order.teeth].sort(
      (a, b) => parseInt(a.toothNumber) - parseInt(b.toothNumber)
    );

    sortedTeeth.forEach((tooth) => {
      const restType = tooth.tipoRestauracion
        ? RESTORATION_TYPE_LABELS[tooth.tipoRestauracion] || tooth.tipoRestauracion
        : '';
      const material = tooth.material || '';

      let toothDesc = `Diente ${tooth.toothNumber}: `;

      if (restType) {
        toothDesc += restType;
      }

      if (material) {
        toothDesc += restType ? ` en ${material}` : material;
      }

      // Color information
      if (tooth.colorInfo) {
        const colorInfo = tooth.colorInfo as any;
        if (colorInfo.shadeCode) {
          toothDesc += `, color ${colorInfo.shadeCode}`;
        }
        if (colorInfo.shadeType) {
          toothDesc += ` (${colorInfo.shadeType})`;
        }
      }

      // Implant information
      if (tooth.trabajoSobreImplante && tooth.informacionImplante) {
        const implantInfo = tooth.informacionImplante as any;
        toothDesc += '. Sobre implante';
        if (implantInfo.marcaImplante) {
          toothDesc += ` ${implantInfo.marcaImplante}`;
        }
        if (implantInfo.sistemaConexion) {
          toothDesc += `, conexión ${implantInfo.sistemaConexion}`;
        }
      }

      toothDesc += '.';
      toothSummaries.push(toothDesc);
    });

    sections.push(...toothSummaries);
  }

  // Scan/Impression type
  if (order.scanType) {
    const scanLabel = SCAN_TYPE_LABELS[order.scanType] || order.scanType;
    sections.push(`Tipo de impresión: ${scanLabel}.`);

    if (order.scanType === 'DIGITAL_SCAN' && order.escanerUtilizado) {
      sections.push(`Escáner utilizado: ${order.escanerUtilizado}.`);
      if (order.otroEscaner) {
        sections.push(`Detalle del escáner: ${order.otroEscaner}.`);
      }
    }

    if (order.scanType === 'ANALOG_MOLD') {
      if (order.tipoSilicon) {
        sections.push(`Tipo de silicón: ${order.tipoSilicon}.`);
      }
      if (order.notaModeloFisico) {
        sections.push(`Nota del modelo: ${order.notaModeloFisico}.`);
      }
    }
  }

  // Occlusion design
  if (order.oclusionDiseno) {
    const occlusion = order.oclusionDiseno as any;
    if (occlusion.tipoOclusion) {
      sections.push(`Tipo de oclusión: ${occlusion.tipoOclusion}.`);
    }
  }

  // Articulation
  if (order.articulatedBy) {
    const artLabel = ARTICULATED_BY_LABELS[order.articulatedBy] || order.articulatedBy;
    sections.push(`Articulado por: ${artLabel}.`);
  }

  // Materials sent
  if (order.materialSent) {
    const materials = Object.entries(order.materialSent)
      .filter(([_, sent]) => sent)
      .map(([material]) => material);
    if (materials.length > 0) {
      sections.push(`Materiales enviados: ${materials.join(', ')}.`);
    }
  }

  // Delivery date
  if (order.fechaEntregaDeseada) {
    const date = new Date(order.fechaEntregaDeseada);
    const formattedDate = date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    sections.push(`Fecha de entrega deseada: ${formattedDate}.`);
  }

  // Description
  if (order.description) {
    sections.push(`Descripción: ${order.description}`);
  }

  // Notes
  if (order.notes) {
    sections.push(`Notas adicionales: ${order.notes}`);
  }

  return sections.join(' ');
}
