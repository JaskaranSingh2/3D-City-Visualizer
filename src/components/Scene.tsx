import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Sky,
  Environment,
  ContactShadows,
  PerspectiveCamera,
  PerformanceMonitor,
  AdaptiveDpr
} from '@react-three/drei';
import { WASDControls } from './WASDControls';
import { Suspense, useState, useEffect } from 'react';
import { Buildings } from './Buildings';
import { HighPerformanceGround } from './HighPerformanceGround';
import { OptimizedLighting } from './OptimizedLighting';
import { Sun } from './Sun';
import { BuildingFilter } from '../services/llmService';

interface SceneProps {
  buildingFilters?: BuildingFilter[];
  onFilteredCountChange?: (count: number) => void;
  onBuildingSelect?: (buildingData: any) => void;
}

export function Scene({ buildingFilters = [], onFilteredCountChange, onBuildingSelect }: SceneProps) {
  // Debug mode is now disabled by default
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const [filters, setFilters] = useState<BuildingFilter[]>(buildingFilters);

  // Update filters when buildingFilters prop changes
  useEffect(() => {
    setFilters(buildingFilters);
  }, [buildingFilters]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          logarithmicDepthBuffer: false, // Disabled for better performance
          powerPreference: "high-performance",
          precision: "lowp", // Lower precision for better performance
          depth: true,
          stencil: false // Disabled for better performance
        }}
        className="w-full h-full"
        dpr={dpr}
        frameloop="demand" // Only render when needed for better performance
      >
        <PerformanceMonitor
          onIncline={() => setDpr([1.5, 3])}
          onDecline={() => setDpr([1, 2])}
        >
          <AdaptiveDpr pixelated />
        </PerformanceMonitor>

        <Suspense fallback={null}>
          {/* Optimized camera setup with improved z-buffer precision */}
          <PerspectiveCamera makeDefault position={[400, 300, 400]} fov={45} near={5} far={3000} />

          {/* Simplified sky and environment for better performance */}
          <color attach="background" args={["#87ceeb"]} /> {/* Sky blue background */}
          <fog attach="fog" args={["#e8ecf0", 1000, 4000]} /> {/* Increased fog distance */}
          <Sky
            distance={450000}
            sunPosition={[1000, 800, 1000]}
            inclination={0.6}
            azimuth={0.25}
            turbidity={2}
            rayleigh={0.5}
          />
          <Environment preset="sunset" background={false} />

          {/* Custom sun with glow effect */}
          <Sun
            position={[1000, 800, 1000]}
            size={50}
            intensity={1.5}
          />

          {/* Optimized Lighting System for maximum performance */}
          <OptimizedLighting
            shadowMapSize={1024}
            intensity={1.3}
            showHelpers={false}
          />

          {/* High-performance ground system with enhanced reflections */}
          <HighPerformanceGround
            size={3000} // Reduced size significantly for better performance
            reflectionOpacity={0.6} // Increased for better reflections
            color="#e0e0e0" // Light color for better reflections
          />
          <Buildings
            filters={filters}
            onFilteredCountChange={onFilteredCountChange}
            onBuildingSelect={onBuildingSelect}
          />

          {/* Minimal contact shadows for maximum performance */}
          <ContactShadows
            position={[0, -0.49, 0]}
            opacity={0.2}
            scale={2000}
            blur={2}
            far={15}
            resolution={256}
            color="#333333"
            frames={1}
          />

          {/* Controls with improved settings */}
          <OrbitControls
            enableDamping={true}
            dampingFactor={0.05}
            maxDistance={2000}
            minDistance={30}
            maxPolarAngle={Math.PI / 2.05} // Prevent going below ground
            minPolarAngle={Math.PI / 12} // Limit how high you can go
            rotateSpeed={0.8}
            zoomSpeed={1.0}
            target={[0, 0, 0]}
            enableRotate={true}
            enablePan={true}
            enableZoom={true}
            screenSpacePanning={false} // Disabled for better performance
            autoRotate={false}
            autoRotateSpeed={0.5}
          />

          {/* WASD Controls for keyboard navigation */}
          <WASDControls moveSpeed={300} />

          {/* Grid helpers are now part of the HighPerformanceGround component */}

          {/* Debug helpers removed */}
        </Suspense>
      </Canvas>

      {/* UI Controls removed as requested */}
    </div>
  );
}