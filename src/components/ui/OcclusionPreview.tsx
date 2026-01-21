'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';

interface OcclusionPreviewProps {
  upperFile?: File | null;
  lowerFile?: File | null;
  upperUrl?: string | null;
  lowerUrl?: string | null;
  onClose?: () => void;
}

interface ArchModelProps {
  url: string;
  fileExtension: string;
  shouldRevokeUrl: boolean;
  position: [number, number, number];
  color: string;
  label: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

function ArchModel({
  url,
  fileExtension,
  shouldRevokeUrl,
  position,
  color,
  label,
  onLoadingChange,
}: ArchModelProps) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    onLoadingChange?.(true);

    const loadGeometry = (loadedGeometry: THREE.BufferGeometry) => {
      loadedGeometry.computeVertexNormals();
      setGeometry(loadedGeometry);
      setIsLoading(false);
      onLoadingChange?.(false);
    };

    const handleError = (err: unknown) => {
      console.error(`Error loading ${label}:`, err);
      setError(`Error al cargar ${label}`);
      setIsLoading(false);
      onLoadingChange?.(false);
    };

    if (fileExtension === '.stl') {
      const loader = new STLLoader();
      loader.load(url, loadGeometry, undefined, handleError);
    } else if (fileExtension === '.ply') {
      const loader = new PLYLoader();
      loader.load(url, loadGeometry, undefined, handleError);
    }

    return () => {
      if (shouldRevokeUrl) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url, fileExtension, shouldRevokeUrl, label]);

  if (error) {
    return null;
  }

  if (!geometry) {
    return null;
  }

  return (
    <mesh geometry={geometry} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color={color} flatShading={false} />
    </mesh>
  );
}

function Scene({
  upperUrl,
  upperExtension,
  lowerUrl,
  lowerExtension,
  shouldRevokeUpperUrl,
  shouldRevokeLowerUrl,
  biteOpen,
  onUpperLoadingChange,
  onLowerLoadingChange,
}: {
  upperUrl: string | null;
  upperExtension: string | null;
  lowerUrl: string | null;
  lowerExtension: string | null;
  shouldRevokeUpperUrl: boolean;
  shouldRevokeLowerUrl: boolean;
  biteOpen: boolean;
  onUpperLoadingChange?: (isLoading: boolean) => void;
  onLowerLoadingChange?: (isLoading: boolean) => void;
}) {
  // Calculate positions based on bite open/close
  // When bite is open, separate the arches vertically
  const upperPosition: [number, number, number] = biteOpen ? [0, 15, 0] : [0, 0, 0];
  const lowerPosition: [number, number, number] = biteOpen ? [0, -15, 0] : [0, 0, 0];

  return (
    <Center>
      <group>
        {upperUrl && upperExtension && (
          <ArchModel
            url={upperUrl}
            fileExtension={upperExtension}
            shouldRevokeUrl={shouldRevokeUpperUrl}
            position={upperPosition}
            color="#9ca3af"
            label="arcada superior"
            onLoadingChange={onUpperLoadingChange}
          />
        )}
        {lowerUrl && lowerExtension && (
          <ArchModel
            url={lowerUrl}
            fileExtension={lowerExtension}
            shouldRevokeUrl={shouldRevokeLowerUrl}
            position={lowerPosition}
            color="#6b7280"
            label="arcada inferior"
            onLoadingChange={onLowerLoadingChange}
          />
        )}
      </group>
    </Center>
  );
}

export function OcclusionPreview({
  upperFile,
  lowerFile,
  upperUrl,
  lowerUrl,
  onClose,
}: OcclusionPreviewProps) {
  const [upperObjectUrl, setUpperObjectUrl] = useState<string | null>(null);
  const [lowerObjectUrl, setLowerObjectUrl] = useState<string | null>(null);
  const [upperExtension, setUpperExtension] = useState<string | null>(null);
  const [lowerExtension, setLowerExtension] = useState<string | null>(null);
  const [biteOpen, setBiteOpen] = useState(false);
  const [isUpperLoading, setIsUpperLoading] = useState(false);
  const [isLowerLoading, setIsLowerLoading] = useState(false);

  useEffect(() => {
    if (upperFile) {
      const createdUrl = URL.createObjectURL(upperFile);
      setUpperObjectUrl(createdUrl);
      setUpperExtension('.' + upperFile.name.split('.').pop()?.toLowerCase());
      return () => {
        URL.revokeObjectURL(createdUrl);
      };
    } else if (upperUrl) {
      setUpperObjectUrl(upperUrl);
      const urlPath = upperUrl.split('?')[0];
      const ext = '.' + urlPath.split('.').pop()?.toLowerCase();
      setUpperExtension(ext);
    } else {
      setUpperObjectUrl(null);
      setUpperExtension(null);
    }
  }, [upperFile, upperUrl]);

  useEffect(() => {
    if (lowerFile) {
      const createdUrl = URL.createObjectURL(lowerFile);
      setLowerObjectUrl(createdUrl);
      setLowerExtension('.' + lowerFile.name.split('.').pop()?.toLowerCase());
      return () => {
        URL.revokeObjectURL(createdUrl);
      };
    } else if (lowerUrl) {
      setLowerObjectUrl(lowerUrl);
      const urlPath = lowerUrl.split('?')[0];
      const ext = '.' + urlPath.split('.').pop()?.toLowerCase();
      setLowerExtension(ext);
    } else {
      setLowerObjectUrl(null);
      setLowerExtension(null);
    }
  }, [lowerFile, lowerUrl]);

  // Check if we have at least one scan to show
  const hasUpperScan = upperObjectUrl && upperExtension;
  const hasLowerScan = lowerObjectUrl && lowerExtension;
  const hasBothScans = hasUpperScan && hasLowerScan;

  // Determine if we're loading based on which scans exist
  const isLoading = (hasUpperScan && isUpperLoading) || (hasLowerScan && isLowerLoading);

  if (!hasUpperScan && !hasLowerScan) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <p className="text-muted-foreground">Cargando vista previa...</p>
      </div>
    );
  }

  const shouldRevokeUpperUrl = !!upperFile;
  const shouldRevokeLowerUrl = !!lowerFile;

  // Determine title based on what's loaded
  let title = '';
  if (hasBothScans) {
    title = 'Vista de Oclusión';
  } else if (hasUpperScan) {
    title = 'Arcada Superior';
  } else if (hasLowerScan) {
    title = 'Arcada Inferior';
  }

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border">
      <Canvas camera={{ position: [0, 0, 100], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <Scene
          upperUrl={upperObjectUrl}
          upperExtension={upperExtension}
          lowerUrl={lowerObjectUrl}
          lowerExtension={lowerExtension}
          shouldRevokeUpperUrl={shouldRevokeUpperUrl}
          shouldRevokeLowerUrl={shouldRevokeLowerUrl}
          biteOpen={biteOpen}
          onUpperLoadingChange={setIsUpperLoading}
          onLowerLoadingChange={setIsLowerLoading}
        />
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.4}
        />
      </Canvas>

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Cargando modelo 3D...</p>
          </div>
        </div>
      )}

      {/* Title and instructions */}
      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border">
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Usa el mouse para rotar, zoom y mover
        </p>
      </div>

      {/* Bite toggle button (only show if both scans are loaded) */}
      {hasBothScans && (
        <div className="absolute bottom-3 right-3">
          <Button
            type="button"
            variant={biteOpen ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setBiteOpen(!biteOpen)}
            className="shadow-lg"
          >
            {biteOpen ? (
              <>
                <Icons.check className="h-4 w-4 mr-1.5" />
                Cerrar Mordida
              </>
            ) : (
              <>
                <Icons.x className="h-4 w-4 mr-1.5" />
                Abrir Mordida
              </>
            )}
          </Button>
        </div>
      )}

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm hover:bg-background px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-foreground transition-colors"
        >
          Cerrar Vista Previa
        </button>
      )}
    </div>
  );
}
