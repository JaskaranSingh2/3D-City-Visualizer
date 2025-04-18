import * as THREE from 'three';

export function coordsToShape(coordinates: number[][]): THREE.Shape {
  const shape = new THREE.Shape();

  // Move to the first point
  // Note: We're using x,z coordinates for the shape since it will be extruded along the y-axis
  shape.moveTo(coordinates[0][0], coordinates[0][1]);

  // Draw lines to subsequent points
  for (let i = 1; i < coordinates.length; i++) {
    shape.lineTo(coordinates[i][0], coordinates[i][1]);
  }

  return shape;
}

// Convert latitude/longitude to local coordinates with improved accuracy
export function normalizeCoordinates(coords: number[][], center: [number, number]): number[][] {
  // Earth's radius in meters
  const EARTH_RADIUS = 6378137;

  // Scale factor to make buildings more visible
  const SCALE_FACTOR = 3.0;

  return coords.map(([lon, lat]) => {
    // Convert to meters using Mercator projection with improved accuracy
    // For Three.js, we use x and z as the horizontal plane, with y as up
    const x = (lon - center[0]) * Math.PI * EARTH_RADIUS * Math.cos(center[1] * Math.PI / 180) / 180 * SCALE_FACTOR;
    const z = (lat - center[1]) * Math.PI * EARTH_RADIUS / 180 * SCALE_FACTOR;
    return [x, z]; // Return as [x, z] for the horizontal plane
  });
}

// Calculate center point of all features
export function calculateCenter(features: any[]): [number, number] {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  features.forEach(feature => {
    feature.geometry.coordinates[0].forEach(([lon, lat]: number[]) => {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
  });

  return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
}

// Check if two buildings collide using bounding boxes
export function checkBuildingCollision(building1: THREE.Mesh, building2: THREE.Mesh): boolean {
  const box1 = new THREE.Box3().setFromObject(building1);
  const box2 = new THREE.Box3().setFromObject(building2);

  return box1.intersectsBox(box2);
}

// Snap position to grid
export function snapToGrid(position: THREE.Vector3, gridSize: number = 1): THREE.Vector3 {
  return new THREE.Vector3(
    Math.round(position.x / gridSize) * gridSize,
    Math.round(position.y / gridSize) * gridSize,
    Math.round(position.z / gridSize) * gridSize
  );
}

// Calculate elevation at a given point (for terrain variation)
export function calculateElevation(x: number, z: number, amplitude: number = 0.5, frequency: number = 0.005): number {
  // Simple Perlin-like noise function for elevation
  // Reduced amplitude and frequency for more subtle variation and to match new ground position
  return amplitude * Math.sin(x * frequency) * Math.cos(z * frequency);
}