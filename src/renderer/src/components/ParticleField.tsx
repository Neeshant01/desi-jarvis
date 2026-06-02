import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ParticleField: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const count = 1000;
  
  // Initialize random positions, speeds, and sizes
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Sphere distribution around center, radius between 4 and 15
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 4.0 + Math.random() * 11.0;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      spd[i] = 0.05 + Math.random() * 0.15;
    }
    
    return [pos, spd];
  }, []);

  // Update positions in useFrame to create slow drift/attraction toward center
  useFrame((state: any) => {
    if (!pointsRef.current) return;
    
    const geo = pointsRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    
    if (!posAttr) return;
    
    const elapsed = state.clock.getElapsedTime();
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      
      // Calculate vector towards center
      const x = posAttr.array[idx] as number;
      const y = posAttr.array[idx + 1] as number;
      const z = posAttr.array[idx + 2] as number;
      
      // Slow rotation + drift
      const speed = speeds[i] * 0.01;
      
      // Rotate around Y axis
      const cosY = Math.cos(speed);
      const sinY = Math.sin(speed);
      const newX = x * cosY - z * sinY;
      const newZ = x * sinY + z * cosY;
      
      posAttr.array[idx] = newX;
      posAttr.array[idx + 2] = newZ;
      
      // Slow vertical bobbing
      posAttr.array[idx + 1] = y + Math.sin(elapsed + i) * 0.002;
    }
    
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#4488ff"
        size={0.12}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        // Custom texture shader for soft circles
        onBeforeCompile={(shader: any) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <clipping_planes_fragment>',
            `
            #include <clipping_planes_fragment>
            // Circular point clipping
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;
            `
          );
        }}
      />
    </points>
  );
};
