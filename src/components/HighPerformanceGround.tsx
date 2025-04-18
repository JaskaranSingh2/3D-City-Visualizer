"use client";

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';

interface GroundProps {
  size?: number;
  reflectionOpacity?: number;
  color?: string;
}

export function HighPerformanceGround({
  size = 5000, // Reduced from 10000 for better performance
  reflectionOpacity = 0.6, // Increased for even better reflections
  color = "#e0e0e0" // Light color for better reflections
}: GroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      position={[0, -0.5, 0]}
    >
      <planeGeometry args={[size, size, 1, 1]} /> {/* Minimal segments for maximum performance */}
      <MeshReflectorMaterial
        resolution={1024} // Increased for higher quality reflections
        mirror={0.8} // Increased for stronger reflections
        mixBlur={3} // Reduced for sharper reflections
        mixStrength={reflectionOpacity * 1.5} // Increased for stronger reflections
        blur={[200, 100]} // Reduced blur for sharper reflections
        metalness={0.3} // Increased for better reflections
        roughness={0.4} // Reduced for clearer reflections
        color={color}
        depthScale={0.15} // Reduced for better reflections
        minDepthThreshold={0.8} // Adjusted for better depth effect
        maxDepthThreshold={1}
        depthToBlurRatioBias={0.25} // Adjusted for better depth-based blur
        distortion={0.2} // Reduced for clearer reflections
        debug={0} // No debug visualization
        polygonOffset={true} // Enable polygon offset to prevent z-fighting
        polygonOffsetFactor={1} // Push the ground down in the depth buffer
        polygonOffsetUnits={1} // Additional offset units
      />
    </mesh>
  );
}
