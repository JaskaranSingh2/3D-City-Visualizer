import { getMockBuildingSummary, getMockQueryResponse } from './api';

// Mock API handler for development
export async function handleApiRequest(url: string, method: string, data: any) {
  // Add artificial delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Handle different API endpoints
  if (url === '/api/summary' && method === 'POST') {
    return getMockBuildingSummary(data.buildingData);
  } else if (url === '/api/query' && method === 'POST') {
    return getMockQueryResponse(data.query);
  } else {
    throw new Error(`Unhandled request: ${method} ${url}`);
  }
}
