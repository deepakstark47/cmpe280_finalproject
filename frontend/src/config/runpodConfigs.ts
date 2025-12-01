const rawApiUrl = import.meta.env.VITE_RUNPOD_API_URL as string;
const API_KEY = import.meta.env.VITE_RUNPOD_API_KEY as string; 

// Convert RunPod API URL to use Vite proxy to avoid CORS issues
// Replace https://api.runpod.ai with /api/runpod (proxy endpoint)
let API_URL = rawApiUrl;
if (rawApiUrl && rawApiUrl.includes('api.runpod.ai')) {
  // Extract the path from the original URL (e.g., /v2/7npr6mt7n0ulbp/runsync)
  const urlObj = new URL(rawApiUrl);
  API_URL = `/api/runpod${urlObj.pathname}${urlObj.search}`;
}

// Validate RunPod config
if (!API_URL || !API_KEY) {
  console.warn('RunPod API configuration is missing. Please check your .env file.');
  console.warn('Required variables: VITE_RUNPOD_API_URL, VITE_RUNPOD_API_KEY');
} else {
  console.log('RunPod API configured:', { url: API_URL, hasKey: !!API_KEY, usingProxy: API_URL.startsWith('/api/runpod') });
}

export { API_URL, API_KEY };

