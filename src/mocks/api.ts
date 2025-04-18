import { BuildingSummaryResponse, LLMQueryResponse } from '../services/llmService';

// Mock building summary data
export function getMockBuildingSummary(buildingData: any): BuildingSummaryResponse {
  const buildingType = buildingData.building || 'commercial';
  const levels = buildingData['building:levels'] || '3';
  const name = buildingData.name || 'Unnamed Building';

  return {
    summary: `This is a ${levels}-story ${buildingType} building (approximately ${parseInt(levels) * 3} meters tall) located in downtown Calgary. ${
      buildingData.amenity ? `It houses ${buildingData.amenity} facilities.` : ''
    } ${
      buildingData.shop ? `It contains retail shops including ${buildingData.shop}.` : ''
    } ${
      buildingData.office ? `It contains office space for ${buildingData.office}.` : ''
    }`,
    constructionCost: `$${(parseInt(levels) * 2.5).toFixed(1)} million (estimated)`,
    buildingType: buildingType.charAt(0).toUpperCase() + buildingType.slice(1),
    urbanSignificance: `This building contributes to the urban fabric of Calgary's downtown core, providing ${
      buildingData.amenity || buildingData.shop || buildingData.office || 'commercial'
    } services to the area.`,
    assessedValue: `$${(parseInt(levels) * 500000).toLocaleString()} (estimated)`,
    zoning: buildingData.building?.toLowerCase() === 'residential' ? 'RC-G' : 'C-COR1'
  };
}

// Mock LLM query responses
export function getMockQueryResponse(query: string): LLMQueryResponse {
  // Convert query to lowercase for easier matching
  const lowerQuery = query.toLowerCase();

  // Define some common responses
  if (lowerQuery.includes('tallest building')) {
    return {
      response: 'The tallest building in Calgary is The Bow, which stands at 236 meters tall with 58 floors. It was completed in 2012 and serves as the headquarters for energy companies Cenovus Energy and Ovintiv.',
      sources: ['Calgary City Data', 'Architectural Records']
    };
  } else if (lowerQuery.includes('how many buildings')) {
    return {
      response: 'Downtown Calgary has approximately 180 significant buildings, with about 50 of them being skyscrapers (buildings taller than 100 meters).',
      sources: ['Calgary Downtown Association']
    };
  } else if (lowerQuery.includes('oldest building')) {
    return {
      response: 'One of the oldest buildings still standing in downtown Calgary is the Lougheed Building, completed in 1912. The historic sandstone City Hall was built even earlier, between 1907 and 1911.',
      sources: ['Calgary Heritage Authority']
    };
  } else if (lowerQuery.includes('architecture') || lowerQuery.includes('architectural style')) {
    return {
      response: 'Calgary\'s downtown features a mix of architectural styles. The core is dominated by modern and postmodern skyscrapers built during various oil booms, particularly in the 1970s-80s and 2000s. There are also some historic buildings with Romanesque Revival and Chicago School influences, especially in the Stephen Avenue historic district.',
      sources: ['Calgary Urban Design Review']
    };
  } else {
    return {
      response: `I don't have specific information about "${query}" in my current dataset. For the most accurate and up-to-date information, I'd recommend checking the City of Calgary's official resources or contacting their planning department.`,
      sources: []
    };
  }
}
