const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Fetch wrapper that automatically injects the JWT token from localStorage.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // 1. Get current session token from local storage (if in browser)
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("gls_nexus_token");
  }

  // 2. Setup headers
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Only set Content-Type to JSON if it's not FormData (used for file uploads)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // 3. Make request
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 4. Handle errors
  if (!response.ok) {
    // If 401 Unauthorized, we might want to clear token and redirect to login
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("gls_nexus_token");
      localStorage.removeItem("gls_nexus_user");
      // Don't auto-redirect here to avoid infinite loops, let the UI handle it
    }

    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore JSON parse error on non-JSON response
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
