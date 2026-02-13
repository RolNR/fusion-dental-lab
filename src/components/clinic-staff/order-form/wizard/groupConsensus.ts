import { ColorInfo } from '@/types/order';

export interface GroupState {
  material: string;
  shadeType: string;
  shadeCode: string;
  useZoneShading: boolean;
  cervicalShade: string;
  medioShade: string;
  incisalShade: string;
  hasMixedValues: boolean;
}

/** Returns the common value if all non-empty items agree, otherwise null */
function consensus(values: (string | null | undefined)[]): string | null {
  const nonEmpty = values.filter((v) => v != null && v !== '');
  if (nonEmpty.length === 0) return null;
  const first = nonEmpty[0];
  return nonEmpty.every((v) => v === first) ? (first as string) : null;
}

/**
 * Derives a consensus GroupState from parallel arrays of material and colorInfo.
 * Used by both RestorationGroupCard (teeth) and BridgeGroupCard (bridges).
 */
export function deriveGroupState(
  materials: (string | undefined)[],
  colorInfos: (ColorInfo | undefined)[]
): GroupState {
  const shadeTypes = colorInfos.map((c) => c?.shadeType);
  const shadeCodes = colorInfos.map((c) => c?.shadeCode);
  const useZoneShadings = colorInfos.map((c) => c?.useZoneShading);
  const cervicals = colorInfos.map((c) => c?.cervicalShade);
  const medios = colorInfos.map((c) => c?.medioShade);
  const incisals = colorInfos.map((c) => c?.incisalShade);

  const materialConsensus = consensus(materials);
  const shadeTypeConsensus = consensus(shadeTypes);
  const shadeCodeConsensus = consensus(shadeCodes);
  const cervicalConsensus = consensus(cervicals);
  const medioConsensus = consensus(medios);
  const incisalConsensus = consensus(incisals);

  // Zone shading consensus: all must agree
  const nonNullZones = useZoneShadings.filter((v) => v != null);
  const zoneConsensus =
    nonNullZones.length > 0 && nonNullZones.every((v) => v === nonNullZones[0])
      ? nonNullZones[0]!
      : false;

  // Has mixed values if any field that has values doesn't reach consensus
  const anyFieldMixed =
    (materials.some((m) => m) && materialConsensus === null) ||
    (shadeTypes.some((s) => s) && shadeTypeConsensus === null) ||
    (shadeCodes.some((s) => s) && shadeCodeConsensus === null) ||
    (cervicals.some((s) => s) && cervicalConsensus === null) ||
    (medios.some((s) => s) && medioConsensus === null) ||
    (incisals.some((s) => s) && incisalConsensus === null);

  return {
    material: materialConsensus || '',
    shadeType: shadeTypeConsensus || '',
    shadeCode: shadeCodeConsensus || '',
    useZoneShading: zoneConsensus,
    cervicalShade: cervicalConsensus || '',
    medioShade: medioConsensus || '',
    incisalShade: incisalConsensus || '',
    hasMixedValues: !!anyFieldMixed,
  };
}
