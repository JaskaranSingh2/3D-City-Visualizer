import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface GroundProps {
  size?: number;
  resolution?: number;
}

export function Ground({ size = 2000, resolution = 128 }: GroundProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create an enhanced procedural texture for the ground with fade-out edges
  const [groundTexture] = useState(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; // Higher resolution texture
    canvas.height = 2048;
    const context = canvas.getContext('2d');

    if (context) {
      // Create gradient background with fade-out edges
      const gradient = context.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.45
      );
      gradient.addColorStop(0, '#bdbdbd');
      gradient.addColorStop(0.7, '#bdbdbd');
      gradient.addColorStop(1, '#bdbdbd00'); // Transparent at edges
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Clean solid background without noise pattern
      context.globalAlpha = 1.0;

      // Add grid lines with improved appearance and fade-out at edges
      context.strokeStyle = '#ffffff'; // White grid lines
      context.lineWidth = 0.5;

      // Calculate center and radius for fade effect
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = canvas.width * 0.45; // Match the gradient radius

      // Major grid lines with fade-out
      const majorGridSize = 128;
      for (let i = 0; i < canvas.width; i += majorGridSize) {
        // Draw line segment by segment to apply fade-out effect
        for (let y = 0; y < canvas.height; y += 10) {
          const distToCenter = Math.sqrt(Math.pow(i - centerX, 2) + Math.pow(y - centerY, 2));
          const alpha = Math.max(0, 1 - (distToCenter / maxRadius));
          context.globalAlpha = alpha * 0.4; // Base alpha * 0.4

          context.beginPath();
          context.moveTo(i, y);
          context.lineTo(i, Math.min(y + 10, canvas.height));
          context.stroke();
        }
      }

      for (let i = 0; i < canvas.height; i += majorGridSize) {
        // Draw line segment by segment to apply fade-out effect
        for (let x = 0; x < canvas.width; x += 10) {
          const distToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(i - centerY, 2));
          const alpha = Math.max(0, 1 - (distToCenter / maxRadius));
          context.globalAlpha = alpha * 0.15; // Reduced opacity for cleaner look

          context.beginPath();
          context.moveTo(x, i);
          context.lineTo(Math.min(x + 10, canvas.width), i);
          context.stroke();
        }
      }

      // Minor grid lines with fade-out
      const minorGridSize = 32;
      context.strokeStyle = '#ffffff'; // White for minor grid

      for (let i = 0; i < canvas.width; i += minorGridSize) {
        // Skip if this is also a major grid line
        if (i % majorGridSize === 0) continue;

        // Draw line segment by segment with fade-out
        for (let y = 0; y < canvas.height; y += 20) {
          const distToCenter = Math.sqrt(Math.pow(i - centerX, 2) + Math.pow(y - centerY, 2));
          const alpha = Math.max(0, 1 - (distToCenter / maxRadius));
          context.globalAlpha = alpha * 0.2; // Base alpha * 0.2

          context.beginPath();
          context.moveTo(i, y);
          context.lineTo(i, Math.min(y + 20, canvas.height));
          context.stroke();
        }
      }

      for (let i = 0; i < canvas.height; i += minorGridSize) {
        // Skip if this is also a major grid line
        if (i % majorGridSize === 0) continue;

        // Draw line segment by segment with fade-out
        for (let x = 0; x < canvas.width; x += 20) {
          const distToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(i - centerY, 2));
          const alpha = Math.max(0, 1 - (distToCenter / maxRadius));
          context.globalAlpha = alpha * 0.2; // Base alpha * 0.2

          context.beginPath();
          context.moveTo(x, i);
          context.lineTo(Math.min(x + 20, canvas.width), i);
          context.stroke();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(size / 256, size / 256); // Reduced repeat for better quality
    texture.anisotropy = 16; // Improve texture quality at angles
    texture.needsUpdate = true;

    return texture;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      position={[0, -0.05, 0]}
    >
      <planeGeometry args={[size, size, resolution, resolution]} />
      <meshStandardMaterial
        map={groundTexture}
        color="#bdbdbd"
        envMapIntensity={0.1}
        metalness={0.0}
        roughness={0.8}
        aoMapIntensity={0.0}
        displacementScale={0.0}
        normalScale={new THREE.Vector2(0, 0)}
        transparent={true}
        alphaTest={0.01}
      />
    </mesh>
  );
}
