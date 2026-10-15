export type ApiEnvelope<T> =
  | { success: true; statusCode: number; data: T; message: string }
  | { success: false; statusCode: number; data: null; message: string };

export type ApiQueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export class ApiError extends Error {
  readonly statusCode: number | null;

  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);

export function buildApiUrl(path: string, params?: ApiQueryParams): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const query = new URLSearchParams();

  for (const key of Object.keys(params ?? {}).sort()) {
    const value = params?.[key];
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return `${API_BASE_URL}${normalizedPath}${suffix}`;
}

export async function requestApi<T>(
  path: string,
  options: {
    method?: HttpMethod;
    params?: ApiQueryParams;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = "GET", params, body, signal } = options;
  let response: Response;

  try {
    response = await fetch(buildApiUrl(path, params), {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Unable to connect to the server. Check your connection and try again.");
  }

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError("The request could not be completed.", response.status);
    }
    return undefined as T;
  }

  const responseText = await response.text();
  let payload: unknown;

  if (responseText.length > 0) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      throw new ApiError(
        response.ok
          ? "The server returned an unreadable response."
          : "The request could not be completed.",
        response.status,
      );
    }
  }

  if (!response.ok) {
    const message = isApiFailure(payload) ? payload.message : "The request could not be completed.";
    throw new ApiError(message, response.status);
  }

  if (!isApiSuccess<T>(payload)) {
    throw new ApiError("The server returned an unexpected response.", response.status);
  }

  return payload.data;
}

function isApiFailure(value: unknown): value is Extract<ApiEnvelope<never>, { success: false }> {
  return typeof value === "object" && value !== null && "success" in value &&
    value.success === false && "message" in value && typeof value.message === "string";
}

function isApiSuccess<T>(value: unknown): value is Extract<ApiEnvelope<T>, { success: true }> {
  return typeof value === "object" && value !== null && "success" in value &&
    value.success === true && "data" in value;
}
