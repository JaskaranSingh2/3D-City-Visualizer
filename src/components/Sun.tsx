"use client";

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sphere, Billboard } from '@react-three/drei';

interface SunProps {
  position?: [number, number, number];
  size?: number;
  color?: string;
  intensity?: number;
}

export function Sun({
  position = [1000, 800, 1000],
  size = 50,
  color = "#FDB813",
  intensity = 1.5
}: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Animate the sun glow
  useFrame(({ clock }) => {
    if (glowRef.current) {
      // Pulse the glow slightly
      const scale = 1.0 + Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      {/* Sun sphere */}
      <Sphere ref={sunRef} args={[size, 16, 16]}>
        <meshBasicMaterial color={color} />
      </Sphere>

      {/* Sun glow */}
      <Billboard>
        <Sphere ref={glowRef} args={[size * 1.2, 16, 16]}>
          <meshBasicMaterial
            color={color}
            transparent={true}
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
      </Billboard>

      {/* Sun glow effect without square shape */}
      <Billboard>
        <mesh>
          <circleGeometry args={[size * 3, 32]} />
          <meshBasicMaterial
            color={"#ffffff"}
            transparent={true}
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Point light to simulate sun light */}
      <pointLight
        color="#FFF8E7"
        intensity={intensity * 50}
        distance={3000}
        decay={0.5}
      />
    </group>
  );
}
