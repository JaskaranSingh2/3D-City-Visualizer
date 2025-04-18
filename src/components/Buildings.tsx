import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import axios from 'axios';
import { coordsToShape, normalizeCoordinates, calculateCenter, checkBuildingCollision, snapToGrid, calculateElevation } from '../utils/geometry';
import { BuildingInfo } from './BuildingInfo';
import { BuildingOutline } from './BuildingOutline';
import { getBuildingSummary, preloadBuildingSummaries, BuildingFilter, isBuildingSummaryCached } from '../services/llmService';
// import type { GeoJSONFeature } from '../types';
import type { ThreeEvent } from '@react-three/fiber';

interface BuildingWithMetadata extends THREE.Mesh {
  originalColor?: THREE.Color;
  isHovered?: boolean;
  isSelected?: boolean;
  isFiltered?: boolean;
}

interface BuildingWay {
  id: number;
  coordinates: number[][];
  tags: Record<string, any>;
}

interface BuildingsProps {
  filters?: BuildingFilter[];
  onFilteredCountChange?: (count: number) => void;
  onBuildingSelect?: (buildingData: any) => void;
}

export function Buildings({ filters = [], onFilteredCountChange, onBuildingSelect }: BuildingsProps) {
  const [buildings, setBuildings] = useState<BuildingWithMetadata[]>([]);
  const [hoveredBuilding, setHoveredBuilding] = useState<number | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [buildingAIData, setBuildingAIData] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [filteredBuildings, setFilteredBuildings] = useState<number[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  // Apply filters when they change
  useEffect(() => {
    console.log('Filters changed:', filters);

    if (!filters || filters.length === 0) {
      setFilteredBuildings([]);
      return;
    }

    // Check if we have a sortBy parameter in the filters
    const sortBy = (filters as any).sortBy;
    const sortOrder = (filters as any).sortOrder || 'asc';

    console.log('Buildings data:', buildings.map(b => b.userData));

    // Apply filters to buildings
    const matchingBuildingIndices = buildings.map((building, index) => {
      // Check if building matches all filters
      const matches = filters.every(filter => {
        // Get the building value, handling special cases
        let buildingValue;

        // Handle special cases for attribute names
        if (filter.attribute === 'building:levels') {
          buildingValue = building.userData['building:levels'] || building.userData.levels;
        } else if (filter.attribute === 'building') {
          buildingValue = building.userData.building || building.userData.type;
        } else {
          buildingValue = building.userData[filter.attribute];
        }

        console.log(`Checking building ${index}:`, {
          attribute: filter.attribute,
          operator: filter.operator,
          filterValue: filter.value,
          buildingValue: buildingValue,
          userData: building.userData
        });

        if (buildingValue === undefined) {
          console.log(`Building ${index} missing attribute: ${filter.attribute}`);
          return false;
        }

        // For numeric comparisons
        let buildingNumValue = 0, filterNumValue = 0;

        // Check if we should do a numeric or string comparison
        const shouldDoNumericComparison =
          filter.operator === '>' ||
          filter.operator === '<' ||
          filter.operator === '>=' ||
          filter.operator === '<=';

        if (shouldDoNumericComparison) {
          buildingNumValue = parseFloat(buildingValue);
          filterNumValue = parseFloat(filter.value.toString());

          // If we can't parse the values as numbers but we need numeric comparison, return false
          if (isNaN(buildingNumValue) || isNaN(filterNumValue)) {
            console.log(`Building ${index} numeric conversion failed:`, { buildingValue, filterValue: filter.value });
            return false;
          }
        }

        // Convert to lowercase strings for string comparisons
        const buildingStrValue = String(buildingValue).toLowerCase();
        const filterStrValue = String(filter.value).toLowerCase();

        // Handle different operators
        switch (filter.operator) {
          case '>':
            return buildingNumValue > filterNumValue;
          case '<':
            return buildingNumValue < filterNumValue;
          case '=':
          case '==':
            // Try both exact match and case-insensitive string match
            return buildingValue == filter.value || buildingStrValue === filterStrValue;
          case '>=':
            return buildingNumValue >= filterNumValue;
          case '<=':
            return buildingNumValue <= filterNumValue;
          case 'contains':
            return buildingStrValue.includes(filterStrValue);
          default:
            console.log(`Building ${index} unknown operator: ${filter.operator}`);
            return false;
        }
      });

      return matches ? index : -1;
    }).filter(index => index !== -1);

    console.log('Matching building indices:', matchingBuildingIndices);

    // Sort the results if sortBy is specified
    if (sortBy) {
      console.log(`Sorting by ${sortBy} in ${sortOrder} order`);
      matchingBuildingIndices.sort((a, b) => {
        const valueA = buildings[a].userData[sortBy];
        const valueB = buildings[b].userData[sortBy];

        // Handle numeric values
        if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
          return sortOrder === 'asc'
            ? Number(valueA) - Number(valueB)
            : Number(valueB) - Number(valueA);
        }

        // Handle string values
        const strA = String(valueA || '').toLowerCase();
        const strB = String(valueB || '').toLowerCase();
        return sortOrder === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    setFilteredBuildings(matchingBuildingIndices);

    // Notify parent component about the number of filtered buildings
    if (onFilteredCountChange) {
      onFilteredCountChange(matchingBuildingIndices.length);
    }

    console.log('Filtered buildings count:', matchingBuildingIndices.length);
  }, [filters, buildings, onFilteredCountChange]);

  // Handle building hover, selection, and filter effects with enhanced visual feedback
  useFrame(() => {
    buildings.forEach((building, index) => {
      if (!building.originalColor) {
        // Store original color if not already stored
        building.originalColor = (building.material as THREE.MeshStandardMaterial).color.clone();
      }

      const material = building.material as THREE.MeshStandardMaterial;
      const isFiltered = filteredBuildings.includes(index);

      // Debug log for filtered buildings (only log once per second to avoid console spam)
      if (isFiltered && Math.random() < 0.01) {
        console.log(`Building ${index} is filtered, applying highlight`);
      }

      if (index === selectedBuilding) {
        // Selected building - blue highlight (to match reference)
        const originalColor = building.originalColor!.clone();
        const highlightColor = new THREE.Color(0x2196f3); // Bright blue
        material.color.copy(originalColor).lerp(highlightColor, 0.5);
        material.emissive.set(0x2196f3);
        material.emissiveIntensity = 0.2;
        building.isSelected = true;
      } else if (isFiltered && filters.length > 0) {
        // Filtered building - bright green highlight with stronger effect
        const originalColor = building.originalColor!.clone();
        const filterColor = new THREE.Color(0x4caf50); // Green
        material.color.copy(originalColor).lerp(filterColor, 0.6);
        material.emissive.set(0x4caf50);
        material.emissiveIntensity = 0.3;
        building.isFiltered = true;
      } else if (index === hoveredBuilding) {
        // Hovered building - subtle blue highlight
        const originalColor = building.originalColor!.clone();
        const hoverColor = new THREE.Color(0x90caf9); // Light blue
        material.color.copy(originalColor).lerp(hoverColor, 0.3);
        material.emissive.set(0x90caf9);
        material.emissiveIntensity = 0.1;
        building.isHovered = true;
      } else if (building.isHovered || building.isSelected || building.isFiltered) {
        // Reset to original color
        material.color.copy(building.originalColor!);
        material.emissive.set(0x000000);
        material.emissiveIntensity = 0;
        building.isHovered = false;
        building.isSelected = false;
        building.isFiltered = false;
      }

      // If filters are active but this building is not filtered, make it more transparent
      if (filters.length > 0 && !isFiltered && !building.isSelected && !building.isHovered) {
        material.opacity = 0.2; // More transparent for better contrast
        material.color.multiplyScalar(0.7); // Darken non-filtered buildings
      } else {
        material.opacity = 0.95; // Normal opacity
        // Reset color if it was darkened
        if (!building.isSelected && !building.isHovered && !building.isFiltered) {
          material.color.copy(building.originalColor!);
        }
      }
    });
  });

  useEffect(() => {
    async function fetchBuildings() {
      try {
        // Overpass API query for buildings in downtown Calgary - expanded to include Calgary Tower
        const query = `
          [out:json][timeout:30];
          (
            way["building"](51.040, -114.080, 51.052, -114.055);
            relation["building"](51.040, -114.080, 51.052, -114.055);
          );
          out body;
          >;
          out skel qt;
        `;

        const response = await axios.post('https://overpass-api.de/api/interpreter', query);

        // Extract nodes and ways
        const nodes = new Map();
        const ways: BuildingWay[] = [];

        // First, collect all nodes
        response.data.elements.forEach((element: any) => {
          if (element.type === 'node') {
            nodes.set(element.id, [element.lon, element.lat]);
          }
        });

        // Then, process ways (buildings)
        response.data.elements.forEach((element: any) => {
          if (element.type === 'way' && element.tags?.building) {
            const coordinates = element.nodes.map((nodeId: number) => nodes.get(nodeId));
            if (coordinates.length > 2) {
              // Close the polygon if it's not closed
              if (coordinates[0] !== coordinates[coordinates.length - 1]) {
                coordinates.push(coordinates[0]);
              }
              ways.push({
                id: element.id,
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

        const buildingMeshes: BuildingWithMetadata[] = [];

        // Process buildings with collision detection
        for (const way of ways) {
          // Convert coordinates to normalized local space
          const normalizedCoords = normalizeCoordinates(way.coordinates, center);

          // Create building shape
          const shape = coordsToShape(normalizedCoords);

          // Calculate building height with proper fallbacks
          // 1. Use height in meters if available
          // 2. Use building:levels * 4.5 meters if available
          // 3. Fallback to 50 meters if neither is available (as requested)
          // Note: We'll store the original height data in userData
          let height = 50; // Default fallback of 50 meters as requested
          let actualHeight = 'unknown'; // Store the actual height data

          if (way.tags.height) {
            // Check if height is in feet (common in some OSM data)
            const heightValue = parseFloat(way.tags.height);
            const heightUnit = way.tags.height.toString().toLowerCase().includes('ft') ? 'ft' : 'm';
            height = heightUnit === 'ft' ? heightValue * 0.3048 : heightValue; // Convert feet to meters if needed
            actualHeight = way.tags.height.toString(); // Store original height string

            // Apply a scaling factor to make real-world heights look better in the visualization
            height = height * 1.5; // Scale up height by 50% for better visual representation
          } else if (way.tags['building:levels']) {
            const levels = parseFloat(way.tags['building:levels']);
            height = levels * 4.5; // 4.5m per level for better proportions
            actualHeight = `${levels} levels`; // Store level information
          }

          // Sanity check - cap extremely tall buildings
          if (height > 800) height = 800; // Cap at 800 meters (increased from 500m)
          if (height < 4) height = 4; // Minimum height of 4 meters (increased from 3m)

          // Create geometry - extrude along Y axis (up)
          const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: height,
            bevelEnabled: false,
          });

          // Determine building type and assign appropriate color
          let color: THREE.Color;
          const buildingType = way.tags.building?.toLowerCase() || '';
          const amenity = way.tags.amenity?.toLowerCase() || '';
          const shop = way.tags.shop?.toLowerCase() || '';
          const office = way.tags.office?.toLowerCase() || '';

          // Color based on building type - mostly white/gray with blue accents (to match reference)
          if (buildingType === 'commercial' || shop || office) {
            // Commercial buildings - light blue accent
            color = new THREE.Color(0x64b5f6).lerp(new THREE.Color(0x42a5f5), Math.random());
          } else if (buildingType === 'residential' || buildingType === 'apartments' || buildingType === 'house') {
            // Residential buildings - white/light gray
            color = new THREE.Color(0xffffff).lerp(new THREE.Color(0xf5f5f5), Math.random());
          } else if (buildingType === 'industrial' || buildingType === 'warehouse') {
            // Industrial buildings - light gray
            color = new THREE.Color(0xe0e0e0).lerp(new THREE.Color(0xeeeeee), Math.random());
          } else if (amenity === 'school' || amenity === 'university' || amenity === 'college') {
            // Educational buildings - very light blue
            color = new THREE.Color(0xe3f2fd).lerp(new THREE.Color(0xbbdefb), Math.random());
          } else if (amenity === 'hospital' || amenity === 'clinic') {
            // Healthcare buildings - light blue
            color = new THREE.Color(0x90caf9).lerp(new THREE.Color(0x64b5f6), Math.random());
          } else {
            // Default - white/light gray with slight variation
            color = new THREE.Color(0xffffff).lerp(new THREE.Color(0xf5f5f5), Math.random() * 0.3);
          }

          // Adjust color based on height for visual variety
          const heightFactor = Math.min(height / 100, 1); // Normalize height to 0-1 range
          color.lerp(new THREE.Color(0x34495e), heightFactor * 0.3); // Taller buildings are slightly darker

          // Create material with assigned color - lighter appearance
          const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: buildingType === 'commercial' ? 0.3 : 0.1, // Reduced metalness for lighter appearance
            roughness: 0.5, // Smoother appearance
            flatShading: false, // Smoother look
            transparent: true,
            opacity: 0.95, // Slight transparency
          });

          // Create mesh
          const mesh = new THREE.Mesh(geometry, material) as BuildingWithMetadata;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Rotate the building to be upright (extruded along Y axis)
          mesh.rotation.x = -Math.PI / 2;

          // Calculate position based on terrain elevation
          const position = mesh.position.clone();
          const elevation = calculateElevation(position.x, position.z);
          // Add a small y-offset (0.01) to prevent z-fighting with the ground
          mesh.position.y = elevation + 0.01;

          // Snap to grid for better alignment
          mesh.position.copy(snapToGrid(mesh.position, 0.5));

          // Ensure the y-offset is maintained after snapping
          mesh.position.y += 0.01;

          // Store building data for interaction
          mesh.userData = {
            ...way.tags,
            id: way.id,
            position: mesh.position.clone(),
            actualHeight: actualHeight // Store the actual height data
          };

          // Check for collisions with existing buildings
          for (const existingBuilding of buildingMeshes) {
            if (checkBuildingCollision(mesh, existingBuilding)) {
              // Skip buildings that collide (we don't actually use this currently)
              // but the collision check is kept for future use
              // Adjust position slightly to avoid collision
              mesh.position.y += 0.1;
              break;
            }
          }

          buildingMeshes.push(mesh);
        }

        setBuildings(buildingMeshes);

        // Preload building summaries in the background to reduce perceived latency
        // This will fetch data for the first few buildings and cache it
        preloadBuildingSummaries(buildingMeshes.map(mesh => mesh.userData));
      } catch (error) {
        console.error('Error fetching building data:', error);
      }
    }

    fetchBuildings();

    // Cleanup function
    return () => {
      buildings.forEach(building => {
        building.geometry.dispose();
        (building.material as THREE.Material).dispose();
      });
    };
  }, []);

  // Fetch AI data for selected building
  useEffect(() => {
    async function fetchBuildingAIData() {
      if (selectedBuilding !== null) {
        try {
          // Get building data
          const buildingData = buildings[selectedBuilding].userData;
          console.log('Building data for AI request:', buildingData);

          // Generate cache key to check if data is already cached
          const buildingId = buildingData.id?.toString() || buildingData.name?.toString() || 'unknown';
          const buildingType = buildingData.building || 'unknown';
          const cacheKey = `${buildingId}-${buildingType}`;

          // Check if we need to show loading state (only if not cached)
          const isCached = await isBuildingSummaryCached(cacheKey);
          if (!isCached) {
            setIsLoadingAI(true);
            console.log('Fetching AI data for building:', selectedBuilding);
          } else {
            console.log('Using cached data for building:', selectedBuilding);
          }

          const aiData = await getBuildingSummary(buildingData);
          console.log('Received AI data:', aiData);
          setBuildingAIData(aiData);

          // Update the parent component with the combined data
          if (onBuildingSelect) {
            onBuildingSelect({
              ...buildingData,
              ...aiData
            });
          }
        } catch (error) {
          console.error('Error fetching AI data:', error);
        } finally {
          setIsLoadingAI(false);
        }
      } else {
        setBuildingAIData(null);
      }
    }

    fetchBuildingAIData();
  }, [selectedBuilding, buildings, onBuildingSelect]);

  return (
    <group ref={groupRef}>
      {buildings.map((building, index) => {
        const isHovered = hoveredBuilding === index;
        const isSelected = selectedBuilding === index;

        return (
          <group key={index}>
            {/* Building mesh */}
            <primitive
              object={building}
              onPointerOver={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                setHoveredBuilding(index);
              }}
              onPointerOut={() => setHoveredBuilding(null)}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation();
                const newSelectedIndex = index === selectedBuilding ? null : index;
                setSelectedBuilding(newSelectedIndex);

                // Notify parent component about selected building
                if (onBuildingSelect && newSelectedIndex !== null) {
                  // Include AI data if available
                  if (newSelectedIndex === index && buildingAIData) {
                    onBuildingSelect({
                      ...buildings[index].userData,
                      ...buildingAIData
                    });
                  } else {
                    // Fetch AI data first, then update
                    onBuildingSelect(buildings[index].userData);
                  }
                } else if (onBuildingSelect) {
                  onBuildingSelect(null);
                }
              }}
            />

            {/* Building outline */}
            <BuildingOutline
              geometry={building.geometry}
              position={building.position}
              rotation={building.rotation}
              isHovered={isHovered}
              isSelected={isSelected}
            />

            {/* Building info panel */}
            {(isHovered || isSelected) && (
              <BuildingInfo
                position={[
                  building.position.x,
                  building.position.y + (isSelected ? 20 : 15), // Adjust height based on selection
                  building.position.z
                ]}
                userData={{
                  ...building.userData,
                  ...(isSelected && buildingAIData ? buildingAIData : {})
                }}
                visible={true}
                isLoading={isSelected && isLoadingAI}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}