import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import axios from 'axios';
import { coordsToShape, normalizeCoordinates, calculateCenter } from '../utils/geometry';
import { checkOverpassRateLimit, trackOverpassRequest, getCachedOverpassData, cacheOverpassData } from '../services/overpassService';

export function Roads() {
  const [roads, setRoads] = useState<THREE.Group[]>([]);

  useEffect(() => {
    async function fetchRoads() {
      try {
        // Check if we have cached data first
        const cachedData = getCachedOverpassData('roads');
        if (cachedData) {
          processRoads(cachedData);
          return;
        }

        // Check if we're within rate limits
        if (!checkOverpassRateLimit()) {
          console.error('Overpass API rate limit exceeded. Using fallback data.');
          // TODO: Add fallback data or show error message
          return;
        }

        // Overpass API query for roads in downtown Calgary - using the same bounding box as buildings
        const query = `
          [out:json][timeout:25];
          (
            way["highway"](51.039, -114.089, 51.051, -114.051);
            >;
          );
          out body;
        `;

        // Track this request for rate limiting
        trackOverpassRequest();

        const response = await axios.post('https://overpass-api.de/api/interpreter', query);

        // Cache the response data
        cacheOverpassData('roads', response.data);

        // Process the road data
        processRoads(response.data);

      } catch (error) {
        console.error('Error fetching road data:', error);
      }
    }

    // Function to process road data from either API or cache
    function processRoads(data: any) {
      try {
        // Extract nodes and ways
        const nodes = new Map();
        const ways: Array<{coordinates: number[][], tags: any}> = [];

        // First, collect all nodes
        data.elements.forEach((element: any) => {
          if (element.type === 'node') {
            nodes.set(element.id, [element.lon, element.lat]);
          }
        });

        // Then, process ways (roads)
        data.elements.forEach((element: any) => {
          if (element.type === 'way' && element.tags?.highway) {
            const coordinates = element.nodes.map((nodeId: number) => nodes.get(nodeId));
            if (coordinates.length > 1) {
              ways.push({
                coordinates,
                tags: element.tags
              });
            }
          }
        });

        // Calculate center point for coordinate normalization
        const center = calculateCenter(ways.map(way => ({
          geometry: { coordinates: [way.coordinates] }
        })));

        const roadMeshes = ways.map((way) => {
          // Convert coordinates to normalized local space
          const normalizedCoords = normalizeCoordinates(way.coordinates, center);

          // Determine road width based on type
          let roadWidth = 1;
          const roadType = way.tags.highway;

          if (roadType === 'primary' || roadType === 'trunk') {
            roadWidth = 4;
          } else if (roadType === 'secondary') {
            roadWidth = 3;
          } else if (roadType === 'tertiary') {
            roadWidth = 2;
          } else if (roadType === 'residential' || roadType === 'service') {
            roadWidth = 1.5;
          }

          // Create road material with white colors for a clean look
          let roadColor;
          if (roadType === 'primary' || roadType === 'trunk') {
            roadColor = 0xffffff; // White for major roads
          } else if (roadType === 'secondary') {
            roadColor = 0xfafafa; // Very slightly off-white for secondary roads
          } else if (roadType === 'tertiary') {
            roadColor = 0xf5f5f5; // Very light gray for tertiary roads
          } else if (roadType === 'residential' || roadType === 'service') {
            roadColor = 0xf0f0f0; // Light gray for residential roads
          } else {
            roadColor = 0xeeeeee; // Light gray default
          }

          // Create actual road mesh
          const roadShape = new THREE.Shape();

          for (let i = 0; i < normalizedCoords.length - 1; i++) {
            const current = new THREE.Vector2(normalizedCoords[i][0], normalizedCoords[i][1]);
            const next = new THREE.Vector2(normalizedCoords[i+1][0], normalizedCoords[i+1][1]);

            const direction = next.clone().sub(current).normalize();
            const perpendicular = new THREE.Vector2(-direction.y, direction.x).multiplyScalar(roadWidth / 2);

            if (i === 0) {
              roadShape.moveTo(
                current.x + perpendicular.x,
                current.y + perpendicular.y
              );
            }

            roadShape.lineTo(
              next.x + perpendicular.x,
              next.y + perpendicular.y
            );
          }

          for (let i = normalizedCoords.length - 1; i > 0; i--) {
            const current = new THREE.Vector2(normalizedCoords[i][0], normalizedCoords[i][1]);
            const prev = new THREE.Vector2(normalizedCoords[i-1][0], normalizedCoords[i-1][1]);

            const direction = prev.clone().sub(current).normalize();
            const perpendicular = new THREE.Vector2(-direction.y, direction.x).multiplyScalar(roadWidth / 2);

            roadShape.lineTo(
              current.x + perpendicular.x,
              current.y + perpendicular.y
            );
          }

          roadShape.closePath();

          const roadMeshGeometry = new THREE.ShapeGeometry(roadShape);
          // Create road mesh material with better appearance
          const roadMeshMaterial = new THREE.MeshStandardMaterial({
            color: roadColor,
            roughness: 0.7,
            metalness: 0.0,
            // No emissive for light theme
            emissive: 0x000000,
            emissiveIntensity: 0,
            transparent: true,
            opacity: 0.9
          });

          // Add yellow center line for major roads
          let centerLineMesh = null;
          if (roadType === 'primary' || roadType === 'secondary' || roadType === 'trunk') {
            // Create a thinner line in the center of the road
            const centerLinePoints = [];
            for (let i = 0; i < normalizedCoords.length; i++) {
              centerLinePoints.push(new THREE.Vector3(normalizedCoords[i][0], 0.06, normalizedCoords[i][1]));
            }

            const centerLineGeometry = new THREE.BufferGeometry().setFromPoints(centerLinePoints);
            const centerLineMaterial = new THREE.LineBasicMaterial({
              color: 0xbdbdbd, // Gray for center lines
              linewidth: 1,
              opacity: 0.5,
              transparent: true
            });

            centerLineMesh = new THREE.Line(centerLineGeometry, centerLineMaterial);
          }

          const roadMesh = new THREE.Mesh(roadMeshGeometry, roadMeshMaterial);
          roadMesh.rotation.x = -Math.PI / 2;
          roadMesh.position.y = 0.01; // Slightly above ground to prevent z-fighting
          roadMesh.receiveShadow = true;

          // Store road data
          roadMesh.userData = {
            ...way.tags,
            type: 'road',
            roadType: way.tags.highway
          };

          // Create a group to hold the road and center line
          const roadGroup = new THREE.Group();
          roadGroup.add(roadMesh);

          // Add center line if it exists
          if (centerLineMesh) {
            roadGroup.add(centerLineMesh);
          }

          // Add road name text for major roads
          if ((roadType === 'primary' || roadType === 'secondary' || roadType === 'trunk') && way.tags.name) {
            // We'll implement this in a future update if needed
          }

          // Store road data in the group
          roadGroup.userData = {
            ...way.tags,
            type: 'road',
            roadType: way.tags.highway
          };

          return roadGroup;
        });

        setRoads(roadMeshes);
      } catch (error) {
        console.error('Error processing road data:', error);
      }
    }

    fetchRoads();

    // Cleanup function
    return () => {
      roads.forEach(roadGroup => {
        // Dispose of all children in the group
        roadGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          } else if (child instanceof THREE.Line) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
    };
  }, []);

  return (
    <group>
      {roads.map((road, index) => (
        <primitive key={index} object={road} />
      ))}
    </group>
  );
}
