"use client";

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useHelper } from '@react-three/drei';

interface OptimizedLightingProps {
  showHelpers?: boolean;
  shadowMapSize?: number;
  intensity?: number;
}

export function OptimizedLighting({
  showHelpers = false,
  shadowMapSize = 2048, // Increased shadow map size for better quality
  intensity = 0.8 // Reduced intensity since we have a sun now
}: OptimizedLightingProps) {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  // Show light helpers if in debug mode
  if (showHelpers && directionalLightRef.current) {
    useHelper(directionalLightRef, THREE.DirectionalLightHelper, 5, 'red');
  }

  return (
    <>
      {/* Ambient light for overall scene brightness */}
      <ambientLight intensity={0.4} color="#fff8e7" />

      {/* Main directional light (sun) with optimized shadows */}
      <directionalLight
        ref={directionalLightRef}
        castShadow
        position={[1000, 800, 1000]}
        intensity={intensity}
        color="#fffaf0"
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-far={3000}
        shadow-camera-left={-1500}
        shadow-camera-right={1500}
        shadow-camera-top={1500}
        shadow-camera-bottom={-1500}
        shadow-bias={-0.0001}
        shadow-radius={2}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-1500, 1500, 1500, -1500, 0.1, 3000]}
        />
      </directionalLight>

      {/* Hemisphere light for better ambient occlusion - single light for better performance */}
      <hemisphereLight
        args={["#fffaf0", "#e0e0e0", 0.6]}
      />

      {/* Additional fill light from opposite direction for better shadows */}
      <directionalLight
        position={[-800, 300, -800]}
        intensity={0.2}
        color="#b0c4de"
      />
    </>
  );
}
