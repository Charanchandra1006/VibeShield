export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important for sending/receiving HTTP-Only cookies
    });
  } catch {
    throw new Error(`Cannot reach API at ${API_BASE_URL}. Is the backend running on port 3001?`);
  }

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      const msg = (errorData as { message?: unknown }).message;
      if (typeof msg === 'string') errorMessage = msg;
      else if (Array.isArray(msg)) errorMessage = msg.join(', ');
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text.slice(0, 200);
      } catch {
        // ignore
      }
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204 || response.status === 205) {
    return { success: true, data: null };
  }
  const text = await response.text();
  if (!text) return { success: true, data: null };
  try {
    return JSON.parse(text);
  } catch {
    return { success: true, data: text };
  }
}
