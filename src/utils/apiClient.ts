/**
 * Safe API Client & Response Parser
 * Strictly adheres to response verification before calling response.json()
 * Prevents "Unexpected token 'o', 'no available server ' is not valid JSON" errors
 */

/**
 * Safe API Client & Response Parser
 * Strictly adheres to response verification before attempting JSON parsing.
 * Eliminates "Unexpected token 'o', 'no available server ' is not valid JSON" errors completely.
 */

export interface ApiDiagnostics {
  endpoint: string;
  status: number;
  statusText: string;
  contentType: string;
  bodySnippet: string;
  isUnavailableServer: boolean;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  endpoint: string;
  contentType: string;
  rawBody: string;
  isUnavailableServer: boolean;

  constructor(message: string, diagnostics: ApiDiagnostics) {
    super(message);
    this.name = 'ApiError';
    this.status = diagnostics.status;
    this.statusText = diagnostics.statusText;
    this.endpoint = diagnostics.endpoint;
    this.contentType = diagnostics.contentType;
    this.rawBody = diagnostics.bodySnippet;
    this.isUnavailableServer = diagnostics.isUnavailableServer;
  }
}

/**
 * Parses an API Response safely without ever calling native response.json() blindly.
 * Inspects response.ok, Content-Type, HTML/plain text, and unavailable-server signatures.
 * Logs diagnostics without masking underlying issues.
 */
export async function parseApiResponse<T = any>(
  response: Response,
  endpointOverride?: string
): Promise<T> {
  const endpoint = endpointOverride || response.url || 'API Endpoint';
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const status = response.status;
  const statusText = response.statusText || '';

  // 1. Read body text safely without triggering C++ JSON parse exceptions
  let rawText = '';
  try {
    rawText = await response.text();
  } catch (readErr: any) {
    console.error(`[API Diagnostics] Failed reading response body from ${endpoint}:`, readErr);
    throw new ApiError(
      'فشل قراءة الاستجابة من الخادم (Connection Read Error)',
      {
        endpoint,
        status,
        statusText,
        contentType,
        bodySnippet: '',
        isUnavailableServer: true
      }
    );
  }

  const trimmedText = rawText.trim();
  const isServerUnavailable =
    status === 502 ||
    status === 503 ||
    status === 504 ||
    trimmedText === 'no available server' ||
    trimmedText.includes('no available server') ||
    trimmedText.includes('502 Bad Gateway') ||
    trimmedText.includes('503 Service Temporarily Unavailable') ||
    trimmedText.includes('504 Gateway Timeout');

  const isHtml =
    contentType.includes('text/html') ||
    trimmedText.startsWith('<!doctype') ||
    trimmedText.startsWith('<!DOCTYPE') ||
    trimmedText.startsWith('<html');

  const hasJsonHeader = contentType.includes('application/json');
  const looksLikeJson =
    (trimmedText.startsWith('{') && trimmedText.endsWith('}')) ||
    (trimmedText.startsWith('[') && trimmedText.endsWith(']'));

  // 2. Handle server-unavailable situations (Cloud Run proxy / Nginx warming up)
  if (isServerUnavailable) {
    console.warn(`[API Diagnostics] Server unavailable for "${endpoint}":`, {
      endpoint,
      status,
      statusText,
      contentType,
      body: rawText.slice(0, 300)
    });

    throw new ApiError(
      'الخادم في وضع الاستعداد السحابي، جاري الاتصال... يرجى إعادة المحاولة (Server warming up / unavailable).',
      {
        endpoint,
        status,
        statusText,
        contentType,
        bodySnippet: rawText.slice(0, 300),
        isUnavailableServer: true
      }
    );
  }

  // 3. Handle non-2xx responses (HTTP 4xx / 5xx)
  if (!response.ok) {
    let parsedErrorMessage = '';

    // If server returned structured JSON error, extract the application message
    if (hasJsonHeader || looksLikeJson) {
      try {
        const parsed = JSON.parse(rawText);
        parsedErrorMessage = parsed.error || parsed.message || parsed.detail || '';
      } catch {
        // Fallback if JSON parse fails
      }
    }

    // Diagnostics logging for non-OK responses
    console.warn(`[API Diagnostics] Request failed with HTTP ${status} for "${endpoint}":`, {
      endpoint,
      status,
      statusText,
      contentType,
      body: rawText.slice(0, 300)
    });

    const finalMessage = parsedErrorMessage || (
      isHtml
        ? `خطأ من الخادم (${status}): تعذر معالجة الطلب (HTML error page)`
        : `فشل طلب الخادم (${status}): ${rawText.slice(0, 150) || statusText}`
    );

    throw new ApiError(finalMessage, {
      endpoint,
      status,
      statusText,
      contentType,
      bodySnippet: rawText.slice(0, 300),
      isUnavailableServer: false
    });
  }

  // 4. Handle 2xx responses that are NOT JSON (e.g. unexpected HTML fallback or plain text)
  if (!hasJsonHeader && !looksLikeJson) {
    console.warn(`[API Diagnostics] Expected JSON from "${endpoint}" but received non-JSON (${contentType}):`, {
      endpoint,
      status,
      contentType,
      body: rawText.slice(0, 300)
    });

    throw new ApiError(
      `استجابة غير متوقعة من الخادم (نوع المحتوى: ${contentType || 'غير محدد'})`,
      {
        endpoint,
        status,
        statusText,
        contentType,
        bodySnippet: rawText.slice(0, 300),
        isUnavailableServer: false
      }
    );
  }

  // 5. Parse valid JSON payload safely inside try/catch
  try {
    return JSON.parse(rawText) as T;
  } catch (jsonErr: any) {
    console.error(`[API Diagnostics] JSON parse error for "${endpoint}":`, {
      endpoint,
      status,
      contentType,
      bodySnippet: rawText.slice(0, 300),
      parseError: jsonErr?.message
    });

    throw new ApiError(
      `استجابة غير صالحة بتنسيق JSON من الخادم (${status})`,
      {
        endpoint,
        status,
        statusText,
        contentType,
        bodySnippet: rawText.slice(0, 300),
        isUnavailableServer: false
      }
    );
  }
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  const response = await fetch(input, init);
  return parseApiResponse<T>(response, urlStr);
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
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, init);
      return await parseApiResponse<T>(response, urlStr);
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
