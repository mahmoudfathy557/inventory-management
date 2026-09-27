/**
 * Safe API Client & Response Parser
 * Strictly adheres to response verification before calling response.json()
 * Prevents "Unexpected token 'o', 'no available server ' is not valid JSON" errors
 */

export async function parseApiResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();

  // Handle Cloud Run / upstream ingress proxy warming up message
  if (raw.includes('no available server') || raw.trim() === 'no available server') {
    throw new Error('الخادم في وضع الاستعداد السحابي، جاري الاتصال... يرجى إعادة المحاولة.');
  }

  if (!response.ok) {
    let errorMessage = `API request failed (${response.status}): ${raw.slice(0, 120)}`;
    if (contentType.includes('application/json') || raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.error) {
          errorMessage = parsed.error;
        } else if (parsed.message) {
          errorMessage = parsed.message;
        }
      } catch {}
    }
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    throw new Error(`استجابة غير صالحة من الخادم: ${raw.slice(0, 100)}`);
  }
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  return parseApiResponse<T>(response);
}

/**
 * Fetch with automatic quick retry for transient server warming up / 502 / 503 / network glitches
 */
export async function safeFetchWithRetry<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 2,
  delayMs = 400
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, init);
      return await parseApiResponse<T>(response);
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
