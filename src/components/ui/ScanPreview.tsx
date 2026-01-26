'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { Button } from './Button';
import { Icons } from './Icons';

interface ScanPreviewProps {
  file?: File;
  url?: string;
  onClose?: () => void;
}

function ModelWithLoadingState({
  url,
  fileExtension,
  shouldRevokeUrl,
  onLoadingChange,
}: {
  url: string;
  fileExtension: string;
  shouldRevokeUrl: boolean;
  onLoadingChange: (loading: boolean) => void;
}) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [hasVertexColors, setHasVertexColors] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    onLoadingChange(true);
    setError(null);
    setHasVertexColors(false);

    if (fileExtension === '.stl') {
      const loader = new STLLoader();
      loader.load(
        url,
        (loadedGeometry) => {
          loadedGeometry.computeVertexNormals();
          setGeometry(loadedGeometry);
          setIsLoading(false);
          onLoadingChange(false);
        },
        undefined,
        (err) => {
          console.error('Error loading STL:', err);
          setError('Error al cargar el archivo 3D');
          setIsLoading(false);
          onLoadingChange(false);
        }
      );
    } else if (fileExtension === '.ply') {
      const loader = new PLYLoader();
      loader.load(
        url,
        (loadedGeometry) => {
          loadedGeometry.computeVertexNormals();
          // Check if PLY file has vertex colors
          const hasColors = loadedGeometry.getAttribute('color') !== undefined;
          setHasVertexColors(hasColors);
          setGeometry(loadedGeometry);
          setIsLoading(false);
          onLoadingChange(false);
        },
        undefined,
        (err) => {
          console.error('Error loading PLY:', err);
          setError('Error al cargar el archivo 3D');
          setIsLoading(false);
          onLoadingChange(false);
        }
      );
    }

    return () => {
      if (shouldRevokeUrl) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url, fileExtension, shouldRevokeUrl, onLoadingChange]);

  if (isLoading) {
    return null; // Canvas handles the loading state in the parent component
  }

  if (error) {
    return null; // Canvas handles the error state in the parent component
  }

  if (!geometry) {
    return null;
  }

  return (
    <Center>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={hasVertexColors ? undefined : '#9ca3af'}
          vertexColors={hasVertexColors}
          flatShading={false}
        />
      </mesh>
    </Center>
  );
}

export function ScanPreview({ file, url, onClose }: ScanPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [fileExtension, setFileExtension] = useState<string>('');
  const [isLoadingModel, setIsLoadingModel] = useState(true);

  useEffect(() => {
    if (file) {
      // Create object URL from File
      const createdUrl = URL.createObjectURL(file);
      setObjectUrl(createdUrl);
      setFileExtension('.' + file.name.split('.').pop()?.toLowerCase());
      return () => {
        URL.revokeObjectURL(createdUrl);
      };
    } else if (url) {
      // Use provided URL directly
      setObjectUrl(url);
      // Extract extension from URL
      const urlPath = url.split('?')[0]; // Remove query params
      const ext = '.' + urlPath.split('.').pop()?.toLowerCase();
      setFileExtension(ext);
    }
  }, [file, url]);

  if (!objectUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="text-center">
          <Icons.spinner className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Preparando vista previa...</p>
        </div>
      </div>
    );
  }

  const shouldRevokeUrl = !!file; // Only revoke if we created it from a File

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border">
      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80 backdrop-blur-sm">
          <div className="text-center">
            <Icons.spinner className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Cargando modelo 3D...</p>
            <p className="text-xs text-muted-foreground mt-1">Esto puede tomar unos segundos</p>
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 0, 100], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <ModelWithLoadingState
          url={objectUrl}
          fileExtension={fileExtension}
          shouldRevokeUrl={shouldRevokeUrl}
          onLoadingChange={setIsLoadingModel}
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

      <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border">
        <p className="text-xs font-medium text-foreground">Usa el mouse para rotar, zoom y mover</p>
      </div>

      {onClose && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          className="absolute top-3 left-3 !bg-background/90 !backdrop-blur-sm hover:!bg-background !border-border"
        >
          Cerrar Vista Previa
        </Button>
      )}
    </div>
  );
}
