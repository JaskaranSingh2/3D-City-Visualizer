import React, { Suspense, useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { BuildingIcon } from './components/BuildingIcon';
import { LoadingScreen } from './components/LoadingScreen';
import { FilterNotification } from './components/FilterNotification';
import { BuildingFilter, queryBuildings } from './services/llmService';

function App() {
  const [buildingFilters, setBuildingFilters] = useState<BuildingFilter[]>([]);
  const [filterExplanation, setFilterExplanation] = useState<string>('');
  const [showNotification, setShowNotification] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [queryInput, setQueryInput] = useState('');

  // Update filtered count when receiving it from the Scene component
  const handleFilteredCountChange = (count: number) => {
    setFilteredCount(count);
  };

  // Handle building selection
  const handleBuildingSelect = (buildingData: any) => {
    setSelectedBuilding(buildingData);
  };

  // Handle query submission
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    try {
      const results = await queryBuildings(queryInput);
      setBuildingFilters(results.filters);
      setFilterExplanation(results.explanation);
      setShowNotification(true);
    } catch (err) {
      console.error('Error querying buildings:', err);
    }
  };

  // Hide notification when filters are cleared
  useEffect(() => {
    if (buildingFilters.length === 0) {
      setShowNotification(false);
    }
  }, [buildingFilters]);

  return (
    <div className="flex flex-col h-screen bg-black text-white font-mono">
      {/* Main content with border */}
      <div className="flex-1 m-4 border border-[#1a2747] rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <header className="p-3 border-b border-[#1a2747] flex items-center justify-between bg-black">
          <div className="flex items-center space-x-2">
            <BuildingIcon className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-semibold">Calgary City Dashboard</h1>
          </div>
          <div className="text-sm text-gray-400">A Demo of Downtown Calgary</div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* 3D Scene - Main content */}
          <div className="flex-1 relative bg-[#e8ecf0]">
            {filteredCount > 0 && (
              <div className="absolute top-4 left-4 z-10 bg-[#1a2747] bg-opacity-80 text-white text-xs px-3 py-1.5 rounded-full">
                <span className="font-medium">{filteredCount}</span> buildings matched
              </div>
            )}

            <Suspense fallback={<LoadingScreen />}>
              <Scene
                buildingFilters={buildingFilters}
                onFilteredCountChange={handleFilteredCountChange}
                onBuildingSelect={handleBuildingSelect}
              />
            </Suspense>

            {/* Filter notification */}
            {showNotification && (
              <FilterNotification
                explanation={filterExplanation}
                count={filteredCount}
                onClose={() => setShowNotification(false)}
              />
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-72 bg-black border-l border-[#1a2747] overflow-y-auto" style={{ boxShadow: '0 0 20px rgba(0, 100, 255, 0.15) inset' }}>
            {/* Query section */}
            <div className="p-4 border-b border-[#1a2747]">
              <h2 className="flex items-center text-sm font-semibold mb-3 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Query Buildings
              </h2>

              <form onSubmit={handleQuerySubmit} className="space-y-3">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="highlight buildings over 30 meters"
                  className="w-full bg-[#111] border border-[#333] text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded transition-colors"
                  style={{ boxShadow: '0 0 10px rgba(0, 100, 255, 0.3)' }}
                >
                  Search
                </button>
              </form>

              <div className="mt-4 bg-[#111] p-2 rounded border border-[#333]">
                <h3 className="text-xs text-blue-400 mb-1 font-medium">Example queries:</h3>
                <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
                  <li>"highlight buildings over 30 meters"</li>
                  <li>"show commercial buildings"</li>
                  <li>"find buildings with RC-G zoning"</li>
                  <li>"what is the tallest building"</li>
                  <li>"show buildings less than $500,000 in value"</li>
                </ul>
              </div>
            </div>

            {/* Building information section */}
            <div className="p-4">
              <h2 className="flex items-center text-sm font-semibold mb-4 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Building Information
              </h2>

              {selectedBuilding ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <div>
                      <div className="text-xs text-gray-400">ID</div>
                      <div className="text-sm">{selectedBuilding.id || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <div className="text-xs text-gray-400">Address</div>
                      <div className="text-sm">{selectedBuilding['addr:street'] || '470 1st Ave'}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    <div>
                      <div className="text-xs text-gray-400">Height</div>
                      <div className="text-sm">{selectedBuilding.height || '30'} meters</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <div>
                      <div className="text-xs text-gray-400">Zoning</div>
                      <div className="text-sm">{selectedBuilding.zoning || 'RC-G'}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-xs text-gray-400">Assessed Value</div>
                      <div className="text-sm">{selectedBuilding.assessedValue || '$1,927,748'}</div>
                    </div>
                  </div>

                  {selectedBuilding.summary && (
                    <div className="mt-4 p-3 bg-[#111] rounded border-l-2 border-blue-500">
                      <div className="text-sm font-semibold text-blue-400 mb-2">AI Summary</div>
                      <div className="text-xs leading-relaxed text-gray-300">{selectedBuilding.summary}</div>
                      {selectedBuilding.constructionCost && (
                        <div className="mt-2 text-xs text-gray-400">
                          <span className="text-blue-400 font-medium">Est. Cost:</span> {selectedBuilding.constructionCost}
                        </div>
                      )}
                      {selectedBuilding.urbanSignificance && (
                        <div className="mt-2 text-xs text-gray-400">
                          <span className="text-blue-400 font-medium">Significance:</span> {selectedBuilding.urbanSignificance}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-400">
                  <p>Select a building to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;