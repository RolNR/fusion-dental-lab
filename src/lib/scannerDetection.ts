import { ScannerType } from '@prisma/client';

/**
 * Scanner signature patterns to search for in STL file headers
 * The 80-byte header in binary STL files often contains scanner/software info
 */
const SCANNER_SIGNATURES: { patterns: (string | RegExp)[]; scanner: ScannerType }[] = [
  {
    patterns: ['itero', 'align technology', 'align tech'],
    scanner: ScannerType.iTero,
  },
  {
    patterns: ['medit', 'i500', 'i600', 'i700', 'i800'],
    scanner: ScannerType.Medit,
  },
  {
    patterns: ['3shape', 'threeshape', 'trios', '3shape trios'],
    scanner: ScannerType.ThreeShape,
  },
  {
    patterns: ['carestream', 'cs 3600', 'cs3600', 'cs 3700', 'cs3700', 'cs 3800'],
    scanner: ScannerType.Carestream,
  },
  {
    patterns: ['dental wings', 'dentalwings', 'dental-wings', 'virtuo vivo', 'dwos'],
    scanner: ScannerType.DentalWings,
  },
];

/**
 * Reads the header from an STL file and attempts to detect the scanner brand
 * @param file - The STL file to analyze
 * @returns The detected ScannerType or null if not recognized
 */
export async function detectScannerFromSTL(file: File): Promise<ScannerType | null> {
  const fileName = file.name.toLowerCase();

  // Only process STL files
  if (!fileName.endsWith('.stl')) {
    return null;
  }

  try {
    // Read the first 80 bytes (binary STL header) or first line (ASCII STL)
    const headerBytes = await readFileHeader(file, 256); // Read extra for ASCII format

    if (!headerBytes) {
      return null;
    }

    // Convert to string for pattern matching
    const headerText = new TextDecoder('utf-8', { fatal: false }).decode(headerBytes).toLowerCase();

    // Search for scanner signatures
    for (const { patterns, scanner } of SCANNER_SIGNATURES) {
      for (const pattern of patterns) {
        if (typeof pattern === 'string') {
          if (headerText.includes(pattern)) {
            return scanner;
          }
        } else {
          if (pattern.test(headerText)) {
            return scanner;
          }
        }
      }
    }

    // Also check the filename itself for scanner hints
    const detectedFromFilename = detectScannerFromFilename(fileName);
    if (detectedFromFilename) {
      return detectedFromFilename;
    }

    return null;
  } catch (error) {
    console.error('Error detecting scanner from STL:', error);
    return null;
  }
}

/**
 * Reads the first N bytes from a file
 */
async function readFileHeader(file: File, bytes: number): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        resolve(null);
      }
    };

    reader.onerror = () => {
      resolve(null);
    };

    // Read only the header portion
    const blob = file.slice(0, bytes);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Attempts to detect scanner from filename patterns
 * Some scanners add their name to exported filenames
 */
function detectScannerFromFilename(filename: string): ScannerType | null {
  const lowerFilename = filename.toLowerCase();

  // iTero patterns
  if (
    lowerFilename.includes('itero') ||
    lowerFilename.includes('_it_') ||
    lowerFilename.includes('-itero')
  ) {
    return ScannerType.iTero;
  }

  // Medit patterns
  if (
    lowerFilename.includes('medit') ||
    lowerFilename.includes('_medit') ||
    /i[5-8]00/.test(lowerFilename)
  ) {
    return ScannerType.Medit;
  }

  // 3Shape/TRIOS patterns
  if (
    lowerFilename.includes('3shape') ||
    lowerFilename.includes('trios') ||
    lowerFilename.includes('threeshape')
  ) {
    return ScannerType.ThreeShape;
  }

  // Carestream patterns
  if (
    lowerFilename.includes('carestream') ||
    lowerFilename.includes('cs3600') ||
    lowerFilename.includes('cs_3600')
  ) {
    return ScannerType.Carestream;
  }

  // Dental Wings patterns
  if (
    lowerFilename.includes('dentalwings') ||
    lowerFilename.includes('dental-wings') ||
    lowerFilename.includes('dental_wings') ||
    lowerFilename.includes('dwos') ||
    lowerFilename.includes('virtuo')
  ) {
    return ScannerType.DentalWings;
  }

  return null;
}

/**
 * Attempts to detect scanner from multiple files
 * Returns the first detected scanner or null
 */
export async function detectScannerFromFiles(files: File[]): Promise<ScannerType | null> {
  for (const file of files) {
    const detected = await detectScannerFromSTL(file);
    if (detected) {
      return detected;
    }
  }
  return null;
}
