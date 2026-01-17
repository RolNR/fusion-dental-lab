import { DetailRow, SectionTitle } from './ReviewSectionComponents';

interface OcclusionDesign {
  tipoOclusion?:
    | 'normal'
    | 'clase_i'
    | 'clase_ii'
    | 'clase_iii'
    | 'borde_a_borde'
    | 'mordida_cruzada';
  espacioInteroclusalSuficiente?: boolean;
  solucionEspacioInsuficiente?: 'reduccion_oclusal' | 'aumento_vertical' | 'ambas';
}

interface OcclusionDesignSectionProps {
  oclusionDiseno?: OcclusionDesign;
}

export function OcclusionDesignSection({ oclusionDiseno }: OcclusionDesignSectionProps) {
  if (!oclusionDiseno) return null;

  const getTipoOclusionLabel = (tipo?: string) => {
    switch (tipo) {
      case 'normal':
        return 'Normal';
      case 'clase_i':
        return 'Clase I';
      case 'clase_ii':
        return 'Clase II';
      case 'clase_iii':
        return 'Clase III';
      case 'borde_a_borde':
        return 'Borde a Borde';
      case 'mordida_cruzada':
        return 'Mordida Cruzada';
      default:
        return undefined;
    }
  };

  const getSolucionLabel = (solucion?: string) => {
    switch (solucion) {
      case 'reduccion_oclusal':
        return 'Reducción Oclusal';
      case 'aumento_vertical':
        return 'Aumento Vertical';
      case 'ambas':
        return 'Ambas';
      default:
        return undefined;
    }
  };

  return (
    <>
      <SectionTitle>Diseño de Oclusión</SectionTitle>
      <dl className="space-y-1">
        <DetailRow
          label="Tipo de Oclusión"
          value={getTipoOclusionLabel(oclusionDiseno.tipoOclusion)}
        />
        <DetailRow
          label="Espacio Interoclusal Suficiente"
          value={oclusionDiseno.espacioInteroclusalSuficiente ? 'Sí' : 'No'}
        />
        {oclusionDiseno.solucionEspacioInsuficiente && (
          <DetailRow
            label="Solución para Espacio Insuficiente"
            value={getSolucionLabel(oclusionDiseno.solucionEspacioInsuficiente)}
          />
        )}
      </dl>
    </>
  );
}
