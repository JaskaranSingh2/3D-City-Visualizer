import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface BuildingOutlineProps {
  geometry: THREE.BufferGeometry;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function BuildingOutline({ 
  geometry, 
  position, 
  rotation, 
  isHovered = false, 
  isSelected = false 
}: BuildingOutlineProps) {
  const outlineRef = useRef<THREE.LineSegments>(null);
  
  // Create edges geometry from the building geometry
  const edges = new THREE.EdgesGeometry(geometry, 30); // 30 degrees threshold
  
  // Animation for outline
  useFrame((state) => {
    if (!outlineRef.current) return;
    
    // Pulse effect for selected buildings
    if (isSelected) {
      const t = state.clock.getElapsedTime();
      outlineRef.current.material.opacity = 0.8 + Math.sin(t * 4) * 0.2;
      outlineRef.current.material.color.setHSL(0.6, 1, 0.5 + Math.sin(t * 2) * 0.2);
    }
  });
  
  // Update outline color based on hover/select state
  useEffect(() => {
    if (!outlineRef.current) return;
    
    const material = outlineRef.current.material as THREE.LineBasicMaterial;
    
    if (isSelected) {
      material.color.set(0x3498db); // Blue for selected
      material.opacity = 1;
    } else if (isHovered) {
      material.color.set(0xf39c12); // Orange for hovered
      material.opacity = 1;
    } else {
      material.color.set(0x2c3e50); // Dark blue for normal
      material.opacity = 0.5;
    }
  }, [isHovered, isSelected]);
  
  return (
    <lineSegments
      ref={outlineRef}
      position={position}
      rotation={rotation}
      geometry={edges}
    >
      <lineBasicMaterial
        attach="material"
        color={isSelected ? 0x3498db : isHovered ? 0xf39c12 : 0x2c3e50}
        transparent
        opacity={isSelected || isHovered ? 1 : 0.5}
        linewidth={1}
      />
    </lineSegments>
  );
}
