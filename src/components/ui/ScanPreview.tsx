'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

interface ScanPreviewProps {
  file: File;
  onClose?: () => void;
}

function Model({ url, fileExtension }: { url: string; fileExtension: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (fileExtension === '.stl') {
      const loader = new STLLoader();
      loader.load(url, (loadedGeometry) => {
        loadedGeometry.computeVertexNormals();
        setGeometry(loadedGeometry);
      });
    } else if (fileExtension === '.ply') {
      const loader = new PLYLoader();
      loader.load(url, (loadedGeometry) => {
        loadedGeometry.computeVertexNormals();
        setGeometry(loadedGeometry);
      });
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url, fileExtension]);

  if (!geometry) {
    return null;
  }

  return (
    <Center>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#6366f1" flatShading={false} />
      </mesh>
    </Center>
  );
}

export function ScanPreview({ file, onClose }: ScanPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string>('');
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!objectUrl) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <p className="text-muted-foreground">Cargando vista previa...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border">
      <Canvas camera={{ position: [0, 0, 100], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <Model url={objectUrl} fileExtension={fileExtension} />
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
