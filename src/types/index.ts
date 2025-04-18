export interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    height?: number;
    'building:levels'?: number;
    building?: string;
    material?: string;
    'roof:shape'?: string;
    name?: string;
    amenity?: string;
    shop?: string;
    office?: string;
    start_date?: string;
  };
}

export interface BuildingData {
  id: string;
  height: number;
  levels: number;
  position?: [number, number, number];
  tags: {
    building: string;
    material?: string;
    'roof:shape'?: string;
    name?: string;
    amenity?: string;
    shop?: string;
    office?: string;
    start_date?: string;
  };
}

export interface AIAnalysis {
  summary: string;
  constructionCost: string;
  buildingType: string;
  urbanSignificance: string;
}

export interface BuildingCollision {
  building1: string;
  building2: string;
  intersectionVolume: number;
  adjustmentVector: [number, number, number];
}

export interface GridCell {
  x: number;
  z: number;
  occupied: boolean;
  buildingId?: string;
  elevation: number;
}

export interface TerrainData {
  elevation: number;
  type: 'grass' | 'pavement' | 'road' | 'water';
  textureIndex: number;
}