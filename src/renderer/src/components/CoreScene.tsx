import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

interface CoreSceneProps {
  children: React.ReactNode;
}

export const CoreScene: React.FC<CoreSceneProps> = ({ children }) => {
  const R3FCanvas = Canvas as any;
  const DreiStars = Stars as any;
  const DreiControls = OrbitControls as any;
  const PostEffectComposer = EffectComposer as any;
  const PostBloom = Bloom as any;

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
      <R3FCanvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#030712']} />
        
        {/* Cinematic ambient and key lighting */}
        <ambientLight intensity={0.15} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          color="#4fc3f7"
          castShadow
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#00ffff" />
        
        {/* Dynamic deep space stars background */}
        <DreiStars
          radius={100}
          depth={50}
          count={4000}
          factor={4}
          saturation={0.5}
          fade
          speed={1.5}
        />
        
        <Suspense fallback={null}>
          {children}
        </Suspense>

        {/* Orbit controls for user interaction */}
        <DreiControls
          enableZoom={true}
          enablePan={false}
          maxDistance={15}
          minDistance={3}
          maxPolarAngle={Math.PI / 2 - 0.05} // prevent going below floor
        />

        {/* Cinematic post-processing for neon glows */}
        <PostEffectComposer>
          <PostBloom
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            height={300}
            intensity={1.2}
          />
        </PostEffectComposer>
      </R3FCanvas>
    </div>
  );
};
