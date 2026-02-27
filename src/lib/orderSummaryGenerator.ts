/**
 * Generates a human-readable case summary from order data for lab staff
 */

import { OrderDetail, OrderWithRelations } from '@/types/order';

const CASE_TYPE_LABELS: Record<string, string> = {
  nuevo: 'caso nuevo',
  garantia: 'garantía',
  regreso_prueba: 'regreso a prueba',
  reparacion_ajuste: 'reparación/ajuste',
};

const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  prueba_estructura: 'para prueba de estructura',
  prueba_estetica: 'para prueba estética',
  prueba: 'para prueba',
  terminado: 'terminado',
};

const RESTORATION_TYPE_LABELS: Record<string, string> = {
  corona: 'corona',
  puente: 'puente',
  incrustacion: 'incrustación',
  maryland: 'maryland',
  carilla: 'carilla',
  provisional: 'provisional',
  pilar: 'pilar',
  barra: 'barra',
  hibrida: 'híbrida',
  toronto: 'toronto',
  removible: 'removible',
  parcial: 'parcial',
  total: 'total',
  sobredentadura: 'sobredentadura',
  encerado: 'encerado',
  mockup: 'mockup',
  guia_quirurgica: 'guía quirúrgica',
  prototipo: 'prototipo',
  guarda_oclusal: 'guarda oclusal',
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

  // Opening — who requests it, for whom, what type of case
  const doctorName = order.doctor?.name ? `Dr. ${order.doctor.name}` : 'El doctor';
  const clinic = order.doctor?.clinicName ? ` (${order.doctor.clinicName})` : '';
  const caseTypeLabel = order.tipoCaso ? CASE_TYPE_LABELS[order.tipoCaso] || order.tipoCaso : null;
  const submissionLabel = order.submissionType
    ? SUBMISSION_TYPE_LABELS[order.submissionType] || null
    : null;

  let opening = `${doctorName}${clinic} solicita para el paciente ${order.patientName}`;

  if (caseTypeLabel) {
    opening += ` — ${caseTypeLabel}`;
  }
  if (submissionLabel) {
    opening += `, ${submissionLabel}`;
  }
  if (order.isUrgent) {
    opening += ' ⚠ URGENTE (+30%)';
  }
  opening += '.';
  sections.push(opening);

  // Warranty reason
  if (order.tipoCaso === 'garantia' && order.motivoGarantia) {
    sections.push(`Motivo de garantía: ${order.motivoGarantia}.`);
  }

  // Return original work
  if (order.seDevuelveTrabajoOriginal) {
    sections.push('Se devuelve el trabajo original.');
  }

  // Teeth — show each tooth's work
  if (order.teeth && order.teeth.length > 0) {
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

      if (tooth.colorInfo) {
        const colorInfo = tooth.colorInfo as Record<string, unknown>;
        if (colorInfo.shadeCode) {
          toothDesc += `, color ${colorInfo.shadeCode}`;
        }
        if (colorInfo.shadeType) {
          toothDesc += ` (${colorInfo.shadeType})`;
        }
      }

      if (tooth.trabajoSobreImplante && tooth.informacionImplante) {
        const implantInfo = tooth.informacionImplante as Record<string, unknown>;
        toothDesc += '. Sobre implante';
        if (implantInfo.marcaImplante) {
          toothDesc += ` ${implantInfo.marcaImplante}`;
        }
        if (implantInfo.sistemaConexion) {
          toothDesc += `, conexión ${implantInfo.sistemaConexion}`;
        }
      }

      toothDesc += '.';
      sections.push(toothDesc);
    });
  }

  // Digital scan
  if (order.isDigitalScan) {
    let scanLine = 'Impresión: escaneo digital';
    if (order.escanerUtilizado) {
      scanLine += ` (${order.escanerUtilizado}`;
      if (order.otroEscaner) {
        scanLine += ` — ${order.otroEscaner}`;
      }
      scanLine += ')';
    }
    scanLine += '.';
    sections.push(scanLine);
  }

  // Occlusion
  if (order.oclusionDiseno) {
    const occlusion = order.oclusionDiseno as Record<string, unknown>;
    if (occlusion.tipoOclusion) {
      sections.push(`Oclusión: ${occlusion.tipoOclusion}.`);
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
      .filter(([, sent]) => sent)
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
    sections.push(`Entrega deseada: ${formattedDate}.`);
  }

  // Description / Notes
  if (order.description) {
    sections.push(`Descripción: ${order.description}`);
  }
  if (order.notes) {
    sections.push(`Notas: ${order.notes}`);
  }

  return sections.join(' ');
}

/**
 * Generates a compact single-line summary for the orders list view.
 * Priority: teeth work > warranty reason > description > case type
 */
export function generateMiniSummary(order: OrderWithRelations): string | null {
  // 1. Teeth work — group by restoration type and count
  if (order.teeth && order.teeth.length > 0) {
    // Group by (tipoRestauracion, material)
    const groups = new Map<string, number>();
    order.teeth.forEach((tooth) => {
      const restLabel = tooth.tipoRestauracion
        ? RESTORATION_TYPE_LABELS[tooth.tipoRestauracion] || tooth.tipoRestauracion
        : 'trabajo';
      const mat = tooth.material ? ` en ${tooth.material}` : '';
      const key = `${restLabel}${mat}`;
      groups.set(key, (groups.get(key) ?? 0) + 1);
    });

    const parts = Array.from(groups.entries()).map(([key, count]) =>
      count === 1 ? key : `${key} ×${count}`
    );

    const toothNums = order.teeth
      .map((t) => t.toothNumber)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .join(', ');

    const work = parts.join(' · ');
    return `${work} — diente${order.teeth.length > 1 ? 's' : ''} ${toothNums}`;
  }

  // 2. Warranty reason
  if (order.tipoCaso === 'garantia' && order.motivoGarantia) {
    return `Garantía: ${order.motivoGarantia}`;
  }

  // 3. Case type label
  if (order.tipoCaso && order.tipoCaso !== 'nuevo') {
    return CASE_TYPE_LABELS[order.tipoCaso] ?? null;
  }

  // 4. Description truncated
  if (order.description) {
    return order.description.length > 80 ? order.description.slice(0, 80) + '…' : order.description;
  }

  return null;
}
