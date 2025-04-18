"use client";

import React, { useState } from 'react';
import { queryBuildings, BuildingQueryResponse } from '../services/llmService';
import { LoaderIcon } from './LoaderIcon';

interface BuildingQueryProps {
  onQueryResults: (results: BuildingQueryResponse) => void;
}

export function BuildingQuery({ onQueryResults }: BuildingQueryProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Send building query to LLM
      const results = await queryBuildings(query);
      onQueryResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-3 text-green-300">Query Buildings</h2>
      <p className="text-sm text-gray-300 mb-4">
        Filter buildings using natural language queries
      </p>

      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Example queries:</h3>
        <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
          <li>"show buildings taller than 50 meters"</li>
          <li>"highlight commercial buildings"</li>
          <li>"find buildings with more than 5 floors"</li>
          <li>"show residential buildings"</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your building query..."
          className="bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-600"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoaderIcon className="w-5 h-5 animate-spin" />
              <span>Processing Query...</span>
            </div>
          ) : (
            'Filter Buildings'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-500 text-white p-3 rounded-lg text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
}
