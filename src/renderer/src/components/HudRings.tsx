import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJarvisStore } from '../store/useStore';

export const HudRings: React.FC = () => {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const middleRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const micVolume = useJarvisStore.getState().micVolume || 0;
    const scaleFactor = micVolume / 100;

    // Rotate concentric rings at different speeds and axes, and scale by voice levels
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = elapsed * 0.15;
      outerRingRef.current.rotation.y = elapsed * 0.05;
      const s = 1.0 + scaleFactor * 0.12;
      outerRingRef.current.scale.set(s, s, s);
    }
    if (middleRingRef.current) {
      middleRingRef.current.rotation.x = elapsed * 0.1;
      middleRingRef.current.rotation.y = -elapsed * 0.08;
      const s = 1.0 + scaleFactor * 0.2;
      middleRingRef.current.scale.set(s, s, s);
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y = elapsed * 0.25;
      innerRingRef.current.rotation.z = -elapsed * 0.12;
      const s = 1.0 + scaleFactor * 0.3;
      innerRingRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={[0, 1.8, 0]}>
      {/* Outer Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshBasicMaterial
          color="#00d2ff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Middle Ring */}
      <mesh ref={middleRingRef}>
        <torusGeometry args={[2.0, 0.015, 16, 80]} />
        <meshBasicMaterial
          color="#0088ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[1.5, 0.01, 16, 60]} />
        <meshBasicMaterial
          color="#00ffff"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Faint crosshair in center background */}
      <gridHelper
        args={[4, 8, '#00ffff', '#004466']}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
};
