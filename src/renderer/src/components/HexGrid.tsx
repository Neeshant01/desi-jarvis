import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const HexGrid: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const count = 400; // 20x20 grid
  const cols = 20;
  const rows = 20;
  const spacingX = 0.65;
  const spacingZ = 0.56; // 0.65 * sin(pi/3)

  // Compute base positions for all instances once
  const positions = useMemo(() => {
    const arr = [];
    const offsetX = (cols * spacingX) / 2;
    const offsetZ = (rows * spacingZ) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Hexagonal staggered alignment
        const x = (c + (r % 2) * 0.5) * spacingX - offsetX;
        const z = r * spacingZ - offsetZ;
        arr.push({ x, z });
      }
    }
    return arr;
  }, [cols, rows, spacingX, spacingZ]);

  // Temporary objects to update matrices and colors in the loop
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      if (!pos) continue;

      // Base Wave ripple effect
      const distance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      const wave = Math.sin(time * 2.0 - distance * 0.8) * 0.08;

      tempObject.position.set(pos.x, wave - 0.5, pos.z);
      tempObject.rotation.set(0, 0, 0);

      // Hover interaction scale and height
      if (i === hoveredId) {
        tempObject.scale.set(1.1, 3.5, 1.1);
        tempColor.set('#00ffff');
      } else {
        tempObject.scale.set(1.0, 1.0, 1.0);
        // Fade grid color based on distance
        const intensity = Math.max(0.1, 1.0 - distance / 10.0);
        tempColor.setRGB(0.0, 0.05 * intensity, 0.2 * intensity);
      }

      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
      meshRef.current.setColorAt(i, tempColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null as any, null as any, count]}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) {
          setHoveredId(e.instanceId);
        }
      }}
      onPointerOut={() => setHoveredId(null)}
      position={[0, 0, 0]}
    >
      <cylinderGeometry args={[0.3, 0.3, 0.1, 6]} />
      <meshStandardMaterial
        roughness={0.2}
        metalness={0.8}
        emissive="#000e26"
        emissiveIntensity={1.5}
      />
    </instancedMesh>
  );
};
