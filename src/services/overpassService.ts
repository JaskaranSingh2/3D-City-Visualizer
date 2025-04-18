// Overpass API rate limiting service
// This service helps prevent overuse of the Overpass API by implementing
// rate limiting and caching mechanisms

// Rate limiting configuration
const MAX_REQUESTS_PER_HOUR = 10; // Overpass API has a limit of ~10k requests per day per IP
const STORAGE_KEY_HOURLY_COUNT = 'overpass_hourly_request_count';
const STORAGE_KEY_HOUR = 'overpass_request_hour';
const CACHE_KEY_BUILDINGS = 'overpass_buildings_cache';
const CACHE_KEY_ROADS = 'overpass_roads_cache';
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Load hourly request count from localStorage
function loadHourlyRequestCount(): number {
  try {
    const storedHour = localStorage.getItem(STORAGE_KEY_HOUR);
    const storedCount = localStorage.getItem(STORAGE_KEY_HOURLY_COUNT);
    
    // Check if we have stored data and if it's from the current hour
    if (storedHour && storedCount) {
      const currentHour = new Date().getHours();
      if (parseInt(storedHour, 10) === currentHour) {
        return parseInt(storedCount, 10);
      }
    }
    
    // If no data or from a different hour, reset the count
    resetHourlyCount();
    return 0;
  } catch (error) {
    console.error('Error loading hourly request count:', error);
    return 0;
  }
}

// Save hourly request count to localStorage
function saveHourlyRequestCount(count: number): void {
  try {
    const currentHour = new Date().getHours();
    localStorage.setItem(STORAGE_KEY_HOUR, currentHour.toString());
    localStorage.setItem(STORAGE_KEY_HOURLY_COUNT, count.toString());
  } catch (error) {
    console.error('Error saving hourly request count:', error);
  }
}

// Reset hourly count (used when a new hour starts)
function resetHourlyCount(): void {
  try {
    const currentHour = new Date().getHours();
    localStorage.setItem(STORAGE_KEY_HOUR, currentHour.toString());
    localStorage.setItem(STORAGE_KEY_HOURLY_COUNT, '0');
  } catch (error) {
    console.error('Error resetting hourly count:', error);
  }
}

// Check if we're within rate limits
export function checkOverpassRateLimit(): boolean {
  const hourlyCount = loadHourlyRequestCount();
  return hourlyCount < MAX_REQUESTS_PER_HOUR;
}

// Track an Overpass API request
export function trackOverpassRequest(): void {
  try {
    const hourlyCount = loadHourlyRequestCount();
    saveHourlyRequestCount(hourlyCount + 1);
  } catch (error) {
    console.error('Error tracking Overpass request:', error);
  }
}

// Get current Overpass API usage statistics
export function getOverpassUsageStats(): { hourlyCount: number, hourlyLimit: number } {
  return {
    hourlyCount: loadHourlyRequestCount(),
    hourlyLimit: MAX_REQUESTS_PER_HOUR
  };
}

// Cache management for Overpass API responses
export function getCachedOverpassData(type: 'buildings' | 'roads'): any | null {
  try {
    const cacheKey = type === 'buildings' ? CACHE_KEY_BUILDINGS : CACHE_KEY_ROADS;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp < CACHE_EXPIRATION_MS) {
        console.log(`Using cached ${type} data`);
        return data;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting cached ${type} data:`, error);
    return null;
  }
}

// Save Overpass API response to cache
export function cacheOverpassData(type: 'buildings' | 'roads', data: any): void {
  try {
    const cacheKey = type === 'buildings' ? CACHE_KEY_BUILDINGS : CACHE_KEY_ROADS;
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error(`Error caching ${type} data:`, error);
  }
}
