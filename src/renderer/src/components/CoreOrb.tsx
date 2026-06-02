import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJarvisStore } from '../store/useStore';

export const CoreOrb: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // Get CPU metrics to drive cognitive load animations
  const cpu = useJarvisStore((state) => state.metrics.cpu);
  const socketStatus = useJarvisStore((state) => state.status);

  // Custom Shader Material uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0.2 },
    uMicVolume: { value: 0.0 }
  }), []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const micVolume = useJarvisStore.getState().micVolume || 0;
    const normMicVolume = micVolume / 100;
    
    // Update uniforms
    uniforms.uTime.value = elapsed;
    uniforms.uMicVolume.value = normMicVolume;
    
    // Cognitive load factor: higher CPU usage = faster & more intense pulsing
    const intensityFactor = socketStatus === 'connected' ? 0.3 + (cpu / 100) * 0.7 : 0.2;
    const pulseSpeed = socketStatus === 'connected' ? 1.0 + (cpu / 100) * 3.0 : 1.0;
    
    // Pulse uIntensity between 0.3 and 1.0
    const pulseVal = 0.5 + Math.sin(elapsed * pulseSpeed * 2.0) * 0.3 * intensityFactor;
    uniforms.uIntensity.value = pulseVal;

    // Scale mesh based on pulse + voice amplitude
    if (meshRef.current) {
      const scale = 1.0 + Math.sin(elapsed * pulseSpeed * 2.0) * 0.08 * intensityFactor + normMicVolume * 0.35;
      meshRef.current.scale.set(scale, scale, scale);
      
      // Rotate core faster when speaking
      meshRef.current.rotation.y = elapsed * (0.2 + normMicVolume * 0.6);
      meshRef.current.rotation.z = elapsed * (0.1 + normMicVolume * 0.3);
    }

    // Pulse inside point light intensity with voice spikes
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 2.0 + pulseVal * 3.0 + normMicVolume * 10.0;
    }
  });

  return (
    <group position={[0, 1.8, 0]}>
      {/* 3D Sphere Mesh with Shader */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[0.9, 64, 64]} />
        <shaderMaterial
          vertexShader={`
            uniform float uTime;
            uniform float uIntensity;
            uniform float uMicVolume;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vPosition;
 
            // Trigonometric displacement simulating brainwaves
            float waveNoise(vec3 p) {
              return sin(p.x * 3.0 + uTime * 2.0) * 
                     cos(p.y * 3.0 - uTime * 1.5) * 
                     sin(p.z * 3.0 + uTime) * (0.15 * uIntensity + uMicVolume * 0.4);
            }
 
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = position;
              vec3 displacedPosition = position + normal * waveNoise(position);
              vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
              vViewPosition = -mvPosition.xyz;
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uIntensity;
            uniform float uMicVolume;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vPosition;
 
            void main() {
              vec3 normal = normalize(vNormal);
              vec3 viewDir = normalize(vViewPosition);
              
              // Fresnel rim glow
              float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);
              
              // Color definition: Cyan to Deep Space Blue
              vec3 cyan = vec3(0.0, 1.0, 1.0);
              vec3 deepBlue = vec3(0.0, 0.05, 0.4);
              vec3 corePurple = vec3(0.5, 0.0, 1.0);
              vec3 voiceGreen = vec3(0.0, 1.0, 0.25);
              
              // Multi-wave plasma noise
              float noise = sin(vPosition.x * 4.0 + uTime) * 
                            cos(vPosition.y * 4.0 - uTime * 0.8) * 
                            sin(vPosition.z * 4.0 + uTime * 0.5);
              float plasmaMix = (noise + 1.0) * 0.5;
              
              // Mix base colors dynamically
              vec3 baseColor = mix(deepBlue, corePurple, plasmaMix * uIntensity);
              
              // Inject glowing green tint when speaking
              vec3 activeGlow = mix(cyan, voiceGreen, uMicVolume);
              
              // Add Fresnel outer rim glow
              vec3 finalColor = baseColor + activeGlow * fresnel * (1.5 + uIntensity * 1.0 + uMicVolume * 2.0);
              
              // Compute opacity based on Fresnel & intensity
              float alpha = clamp(fresnel * 1.8 + uIntensity * 0.2 + uMicVolume * 0.3, 0.25, 1.0);
              
              gl_FragColor = vec4(finalColor, alpha);
            }
          `}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Internal light source projecting glow outwards */}
      <pointLight
        ref={pointLightRef}
        color="#00ffff"
        intensity={3}
        distance={10}
        decay={2}
      />
    </group>
  );
};
