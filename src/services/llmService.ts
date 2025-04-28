import axios from "axios";

// Rate limiting configuration
const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_REQUESTS_PER_DAY = 100; // Daily limit to avoid overusage
const requestTimestamps: number[] = [];

// API configuration
const API_BASE_URL = "/api"; // Use relative path for API requests (will be redirected by Netlify in production)
const API_TIMEOUT = 30000; // 30 seconds timeout

// Debug flag to log API calls
const DEBUG_API_CALLS = true;

// Storage keys for persisting usage data
const STORAGE_KEY_DAILY_COUNT = "api_daily_request_count";
const STORAGE_KEY_DATE = "api_request_date";

// Cache for building summaries to avoid repeated API calls
interface BuildingSummaryCache {
	[buildingId: string]: {
		data: BuildingSummaryResponse;
		timestamp: number;
	};
}

// Cache expiration time (2 hours)
const CACHE_EXPIRATION_MS = 2 * 60 * 60 * 1000;

// Initialize the cache
const buildingSummaryCache: BuildingSummaryCache = {};

// Create axios instance with configuration
const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: API_TIMEOUT,
	headers: {
		"Content-Type": "application/json",
	},
});

// Load daily request count from localStorage
function loadDailyRequestCount(): number {
	try {
		const storedDate = localStorage.getItem(STORAGE_KEY_DATE);
		const storedCount = localStorage.getItem(STORAGE_KEY_DAILY_COUNT);

		// Check if we have stored data and if it's from today
		if (storedDate && storedCount) {
			const today = new Date().toDateString();
			if (storedDate === today) {
				return parseInt(storedCount, 10);
			}
		}

		// If no data or from a different day, reset the count
		resetDailyCount();
		return 0;
	} catch (error) {
		console.error("Error loading daily request count:", error);
		return 0;
	}
}

// Save daily request count to localStorage
function saveDailyRequestCount(count: number): void {
	try {
		const today = new Date().toDateString();
		localStorage.setItem(STORAGE_KEY_DATE, today);
		localStorage.setItem(STORAGE_KEY_DAILY_COUNT, count.toString());
	} catch (error) {
		console.error("Error saving daily request count:", error);
	}
}

// Reset daily count (used when a new day starts)
function resetDailyCount(): void {
	try {
		const today = new Date().toDateString();
		localStorage.setItem(STORAGE_KEY_DATE, today);
		localStorage.setItem(STORAGE_KEY_DAILY_COUNT, "0");
	} catch (error) {
		console.error("Error resetting daily count:", error);
	}
}

// Check if we're within rate limits
function checkRateLimit(): boolean {
	const now = Date.now();

	// Check minute-based rate limit
	// Remove timestamps older than 1 minute
	const oneMinuteAgo = now - 60 * 1000;
	while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
		requestTimestamps.shift();
	}

	// Check daily rate limit
	const dailyCount = loadDailyRequestCount();

	// Return true only if both limits are satisfied
	return (
		requestTimestamps.length < MAX_REQUESTS_PER_MINUTE &&
		dailyCount < MAX_REQUESTS_PER_DAY
	);
}

// Add current timestamp to the requests array and increment daily count
function trackRequest(): void {
	// Track for minute-based limiting
	requestTimestamps.push(Date.now());

	// Track for daily limiting
	try {
		const dailyCount = loadDailyRequestCount();
		saveDailyRequestCount(dailyCount + 1);
	} catch (error) {
		console.error("Error tracking daily request:", error);
	}
}

// Get current API usage statistics
export function getApiUsageStats(): {
	minuteCount: number;
	dailyCount: number;
	minuteLimit: number;
	dailyLimit: number;
} {
	// Clean up old timestamps
	const now = Date.now();
	const oneMinuteAgo = now - 60 * 1000;
	while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
		requestTimestamps.shift();
	}

	return {
		minuteCount: requestTimestamps.length,
		dailyCount: loadDailyRequestCount(),
		minuteLimit: MAX_REQUESTS_PER_MINUTE,
		dailyLimit: MAX_REQUESTS_PER_DAY,
	};
}

// Building filter criteria interface
export interface BuildingFilter {
	attribute: string;
	operator: string;
	value: string | number;
}

// Building query response interface
export interface BuildingQueryResponse {
	filters: BuildingFilter[];
	explanation: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

// Interface for building summary request
export interface BuildingSummaryRequest {
	buildingData: any;
}

// Interface for building summary response
export interface BuildingSummaryResponse {
	summary: string;
	constructionCost: string;
	buildingType: string;
	urbanSignificance: string;
	assessedValue: string;
	zoning: string;
}

// Get AI-generated summary for a building
export async function getBuildingSummary(
	buildingData: any
): Promise<BuildingSummaryResponse> {
	// Generate a cache key based on building ID and type
	const buildingId =
		buildingData.id?.toString() || buildingData.name?.toString() || "unknown";
	// Add a secondary key based on building type to improve cache hits
	const buildingType = buildingData.building || "unknown";
	const cacheKey = `${buildingId}-${buildingType}`;
	const now = Date.now();

	// Check if we have a valid cached response
	if (
		buildingSummaryCache[cacheKey] &&
		now - buildingSummaryCache[cacheKey].timestamp < CACHE_EXPIRATION_MS
	) {
		console.log(`Using cached building summary for building: ${cacheKey}`);
		return buildingSummaryCache[cacheKey].data;
	}

	// Check rate limit
	if (!checkRateLimit()) {
		const stats = getApiUsageStats();
		if (stats.dailyCount >= stats.dailyLimit) {
			throw new Error("Daily API limit exceeded. Please try again tomorrow.");
		} else {
			throw new Error("Rate limit exceeded. Please try again in a minute.");
		}
	}

	try {
		trackRequest();

		// Check if we need to get contextual information for this building
		let estimatedYear = "unknown";
		let buildingContext = null;

		// Only fetch context if year_built is unknown
		if (!buildingData.start_date) {
			try {
				// Prepare context request payload
				const contextPayload = {
					name: buildingData.name || "Unknown",
					type: buildingData.building || "commercial",
					query_type: "comprehensive", // Request all available information
				};

				// Log context request if debug is enabled
				if (DEBUG_API_CALLS) {
					console.log("Requesting building context:", contextPayload);
				}

				// Make API call to get building context
				const contextResponse = await apiClient.post(
					"/api/building-context",
					contextPayload
				);
				buildingContext = contextResponse.data;

				// Use the estimated year if available
				if (
					buildingContext &&
					buildingContext.estimatedYear &&
					buildingContext.estimatedYear > 0
				) {
					estimatedYear = buildingContext.estimatedYear.toString();
					console.log(
						`Using estimated year ${estimatedYear} for building ${buildingId}`
					);
				}
			} catch (error) {
				console.error("Error fetching building context:", error);
				// Continue with unknown year if context fetch fails
			}
		}

		// Prepare the request payload
		const payload = {
			building_data: {
				id: buildingData.id || "unknown",
				name: buildingData.name || "Unnamed Building",
				type: buildingData.building || "commercial",
				levels: buildingData["building:levels"] || "3",
				height:
					buildingData.height ||
					(buildingData["building:levels"]
						? buildingData["building:levels"] * 3
						: 10),
				actualHeight: buildingData.actualHeight || "unknown",
				amenity: buildingData.amenity || "",
				shop: buildingData.shop || "",
				office: buildingData.office || "",
				year_built: buildingData.start_date || estimatedYear,
				material: buildingData.material || "concrete",
				roof_shape: buildingData["roof:shape"] || "flat",
				"addr:street": buildingData["addr:street"] || "",
				"addr:housenumber": buildingData["addr:housenumber"] || "",
				building_context: buildingContext,
			},
		};

		// Log API call if debug is enabled
		if (DEBUG_API_CALLS) {
			console.log("Sending building summary request:", payload);
		}

		// Make API call to backend
		const response = await apiClient.post("/api/summary", payload);

		// Log response if debug is enabled
		if (DEBUG_API_CALLS) {
			console.log("Building summary response:", response.data);
		}

		// Cache the response
		buildingSummaryCache[cacheKey] = {
			data: response.data,
			timestamp: now,
		};

		// Also cache by ID only for backward compatibility
		if (buildingId !== cacheKey) {
			buildingSummaryCache[buildingId] = {
				data: response.data,
				timestamp: now,
			};
		}

		return response.data;
	} catch (error) {
		console.error("Error fetching building summary:", error);

		// Create fallback data
		const fallbackData = {
			summary: "Unable to generate summary at this time.",
			constructionCost: "Unknown",
			buildingType: buildingData.building || "Commercial",
			urbanSignificance: "This building is part of the urban landscape.",
			assessedValue: buildingData["building:levels"]
				? `$${Number(buildingData["building:levels"]) * 500000}`
				: "$1,500,000",
			zoning:
				buildingData.building?.toLowerCase() === "residential"
					? "RC-G"
					: "C-COR1",
		};

		// Cache the fallback data too to prevent repeated failed requests
		buildingSummaryCache[cacheKey] = {
			data: fallbackData,
			timestamp: now,
		};

		// Also cache by ID only for backward compatibility
		if (buildingId !== cacheKey) {
			buildingSummaryCache[buildingId] = {
				data: fallbackData,
				timestamp: now,
			};
		}

		return fallbackData;
	}
}

// Interface for LLM query request
export interface LLMQueryRequest {
	query: string;
	context?: any;
}

// Interface for LLM query response
export interface LLMQueryResponse {
	response: string;
	sources?: string[];
}

// Send a query to the LLM
export async function sendQuery(
	query: string,
	context?: any
): Promise<LLMQueryResponse> {
	// Check rate limit
	if (!checkRateLimit()) {
		const stats = getApiUsageStats();
		if (stats.dailyCount >= stats.dailyLimit) {
			throw new Error("Daily API limit exceeded. Please try again tomorrow.");
		} else {
			throw new Error("Rate limit exceeded. Please try again in a minute.");
		}
	}

	try {
		trackRequest();

		// Prepare the request payload
		const payload = {
			query,
			context: context || {
				location: "Calgary",
				topic: "urban architecture and city planning",
			},
		};

		// Make API call to backend
		const response = await apiClient.post("/api/query", payload);
		return response.data;
	} catch (error) {
		console.error("Error sending query to LLM:", error);

		// Return fallback data if API call fails
		return {
			response:
				"I apologize, but I am unable to process your query at this time. Please try again later.",
		};
	}
}

// Query buildings using LLM to extract filter criteria
export async function queryBuildings(
	query: string
): Promise<BuildingQueryResponse> {
	// Check rate limit
	if (!checkRateLimit()) {
		const stats = getApiUsageStats();
		if (stats.dailyCount >= stats.dailyLimit) {
			throw new Error("Daily API limit exceeded. Please try again tomorrow.");
		} else {
			throw new Error("Rate limit exceeded. Please try again in a minute.");
		}
	}

	try {
		trackRequest();

		// Prepare the request payload
		const payload = {
			query,
			type: "building_filter",
		};

		// Make API call to backend
		const response = await apiClient.post("/api/filter", payload);
		return response.data;
	} catch (error) {
		console.error("Error querying buildings:", error);

		// Return fallback data if API call fails
		return {
			filters: [],
			explanation:
				"Unable to process your query at this time. Please try again later.",
		};
	}
}

// Check if a building summary is already cached
export async function isBuildingSummaryCached(
	cacheKey: string
): Promise<boolean> {
	const now = Date.now();
	return !!(
		buildingSummaryCache[cacheKey] &&
		now - buildingSummaryCache[cacheKey].timestamp < CACHE_EXPIRATION_MS
	);
}

// Preload building summaries in the background to reduce perceived latency
export async function preloadBuildingSummaries(
	buildings: any[]
): Promise<void> {
	// Only preload up to 5 buildings to avoid rate limiting
	const buildingsToPreload = buildings.slice(0, 5);

	console.log(
		`Preloading summaries for ${buildingsToPreload.length} buildings`
	);

	// Use Promise.all to fetch in parallel but don't wait for completion
	Promise.all(
		buildingsToPreload.map(async (building) => {
			try {
				// Generate cache key
				const buildingId =
					building.id?.toString() || building.name?.toString() || "unknown";
				const buildingType = building.building || "unknown";
				const cacheKey = `${buildingId}-${buildingType}`;

				// Skip if already cached
				if (buildingSummaryCache[cacheKey]) {
					return;
				}

				// Fetch with low priority
				await getBuildingSummary(building);
			} catch (error) {
				// Silently fail for preloading
				console.log("Error preloading building summary:", error);
			}
		})
	).catch((error) => {
		console.log("Error in preload batch:", error);
	});
}
