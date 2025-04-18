import React, { useState, useEffect } from 'react';
import { getApiUsageStats } from '../services/llmService';
import { getOverpassUsageStats } from '../services/overpassService';

export function ApiUsageStats() {
  const [llmStats, setLlmStats] = useState({
    minuteCount: 0,
    dailyCount: 0,
    minuteLimit: 10,
    dailyLimit: 100
  });
  
  const [overpassStats, setOverpassStats] = useState({
    hourlyCount: 0,
    hourlyLimit: 10
  });
  
  // Update stats every 5 seconds
  useEffect(() => {
    function updateStats() {
      setLlmStats(getApiUsageStats());
      setOverpassStats(getOverpassUsageStats());
    }
    
    // Update immediately
    updateStats();
    
    // Then update every 5 seconds
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="api-usage-stats">
      <div className="stats-container">
        <h3>API Usage Statistics</h3>
        
        <div className="stats-section">
          <h4>LLM API (Gemini)</h4>
          <div className="stat-row">
            <div className="stat-label">Per Minute:</div>
            <div className="stat-value">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(100, (llmStats.minuteCount / llmStats.minuteLimit) * 100)}%`,
                    backgroundColor: llmStats.minuteCount > llmStats.minuteLimit * 0.8 ? '#f44336' : '#4caf50'
                  }}
                />
              </div>
              <span>{llmStats.minuteCount} / {llmStats.minuteLimit}</span>
            </div>
          </div>
          
          <div className="stat-row">
            <div className="stat-label">Daily:</div>
            <div className="stat-value">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(100, (llmStats.dailyCount / llmStats.dailyLimit) * 100)}%`,
                    backgroundColor: llmStats.dailyCount > llmStats.dailyLimit * 0.8 ? '#f44336' : '#4caf50'
                  }}
                />
              </div>
              <span>{llmStats.dailyCount} / {llmStats.dailyLimit}</span>
            </div>
          </div>
        </div>
        
        <div className="stats-section">
          <h4>Overpass API (Map Data)</h4>
          <div className="stat-row">
            <div className="stat-label">Per Hour:</div>
            <div className="stat-value">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(100, (overpassStats.hourlyCount / overpassStats.hourlyLimit) * 100)}%`,
                    backgroundColor: overpassStats.hourlyCount > overpassStats.hourlyLimit * 0.8 ? '#f44336' : '#4caf50'
                  }}
                />
              </div>
              <span>{overpassStats.hourlyCount} / {overpassStats.hourlyLimit}</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .api-usage-stats {
          position: fixed;
          bottom: 10px;
          right: 10px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-size: 12px;
          z-index: 1000;
          max-width: 300px;
        }
        
        .stats-container h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          padding-bottom: 5px;
        }
        
        .stats-section {
          margin-bottom: 10px;
        }
        
        .stats-section h4 {
          margin: 0 0 5px 0;
          font-size: 13px;
          color: #bbdefb;
        }
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .stat-label {
          flex: 0 0 80px;
        }
        
        .stat-value {
          flex: 1;
          display: flex;
          align-items: center;
        }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          margin-right: 8px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        .stat-value span {
          min-width: 60px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
