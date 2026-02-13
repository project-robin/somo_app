import { z } from 'zod';

// In development, use relative URLs to leverage the proxy
// In production, use the full URL
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const defaultBaseUrl = isDev ? '' : 'https://astro-shiva-app.vercel.app';

export const AstroShivaConfigSchema = z.object({
  baseUrl: z.string().default(defaultBaseUrl),
});

export type AstroShivaConfig = z.infer<typeof AstroShivaConfigSchema>;

export const env = AstroShivaConfigSchema.parse({
  baseUrl: process.env.NEXT_PUBLIC_ASTRO_API_URL || defaultBaseUrl,
});

/**
 * Error codes returned by the Astro Shiva API.
 * These correspond to specific HTTP status codes and error scenarios.
 */
export type ApiErrorCode =
  | 'FORBIDDEN'
  | 'USER_NOT_READY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ASTRO_API_ERROR'
  | 'ASTRO_API_TIMEOUT'
  | 'UNAUTHORIZED'
  | 'USER_NOT_FOUND'
  | 'NO_TOKEN'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

/**
 * Standard error response structure from the Astro Shiva API.
 * All error responses follow this format for consistent error handling.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode | string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Custom error class for Astro Shiva API errors.
 * Provides structured error information including the error code and HTTP status.
 */
export class AstroShivaApiError extends Error {
  public readonly code: ApiErrorCode | string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(code: ApiErrorCode | string, message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AstroShivaApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * Creates an AstroShivaApiError from a parsed API error response.
   */
  static fromResponse(errorResponse: ApiErrorResponse, statusCode: number): AstroShivaApiError {
    return new AstroShivaApiError(
      errorResponse.error.code,
      errorResponse.error.message,
      statusCode,
      errorResponse.error.details
    );
  }
}

/**
 * Parses a JSON error response body from the API.
 * Returns a structured ApiErrorResponse or a fallback error structure.
 */
async function parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
  try {
    const body = await response.text();
    const parsed = JSON.parse(body);
    
    if (parsed.success === false && parsed.error?.code && parsed.error?.message) {
      return parsed as ApiErrorResponse;
    }
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: parsed.message || `HTTP ${response.status}: ${response.statusText}`,
        details: parsed,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      },
    };
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intentTag: string | null;
  createdAt: string;
  sessionId: string;
  tokensUsed: number | null;
  model: string | null;
}

export interface Session {
  id: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  summary: string | null;
}

export interface SessionsResponse {
  success: boolean;
  data: {
    sessions: Session[];
    total: number;
    hasMore: boolean;
  };
}

export interface SessionMessagesResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    session: {
      id: string;
      title: string | null;
      status: string | null;
      messageCount: number | null;
      createdAt: number;
    };
  };
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    sessionId: string;
    timestamp: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  status: 'processing' | 'completed' | 'failed' | 'onboarding';
  email: string;
  astroProfile?: {
    astroSummary: string;
  };
  createdAt: string;
}

export interface OnboardResponse {
  success: boolean;
  message?: string;
  data?: {
    uid: string;
    status: string;
  };
}

/**
 * Event types yielded by the streamChat generator.
 * - 'session-id': Emitted first with the canonical session ID from the X-Session-ID header
 * - 'chunk': A text chunk from the assistant's response
 * - 'thinking': Reasoning/thinking content from thinking models
 * - 'done': Stream completed successfully
 */
export type StreamChatEvent =
  | { type: 'session-id'; sessionId: string }
  | { type: 'chunk'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'done' };

export class AstroShivaClient {
  private baseUrl: string;
  
  constructor(config?: Partial<AstroShivaConfig>) {
    // In development, use empty baseUrl to leverage proxy
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      this.baseUrl = config?.baseUrl || '';
    } else {
      this.baseUrl = config?.baseUrl || env.baseUrl || 'https://astro-shiva-app.vercel.app';
    }
  }
  
  async getAuthHeader(required = true): Promise<Record<string, string>> {
    if (typeof window === 'undefined') {
      if (required) {
        throw new Error('Client-side only for now');
      }
      return {};
    }

    const clerk = (window as any).Clerk;
    if (!clerk?.session) {
      if (required) {
        throw new Error('Clerk not initialized');
      }
      return {};
    }

    let token: string | null | undefined;
    let tokenError: Error | undefined;

    try {
      token = await clerk.session.getToken({ template: 'convex' });
    } catch (error) {
      tokenError = error instanceof Error ? error : new Error('Failed to get convex token');
      console.warn('Failed to get convex token:', tokenError.message);
      token = undefined;
    }

    if (!token) {
      try {
        token = await clerk.session.getToken();
      } catch (error) {
        tokenError = error instanceof Error ? error : new Error('Failed to get session token');
        console.warn('Failed to get session token:', tokenError.message);
        token = undefined;
      }
    }

    if (!token) {
      if (required) {
        throw new Error('No auth token available. Please ensure you are signed in.');
      }
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  }
  
  /**
   * Get the API URL (uses proxy in development)
   */
  private getApiUrl(path: string): string {
    if (this.baseUrl) {
      return `${this.baseUrl}${path}`;
    }
    return `/api${path}`;
  }
  
  /**
   * Streams a chat message to the API and yields events as they arrive.
   * 
   * The first event yielded is always 'session-id' containing the canonical
   * session ID from the X-Session-ID response header. This should be used
   * for subsequent requests in the conversation.
   * 
   * @param message - The user's message to send
   * @param sessionId - Optional session ID to continue an existing conversation
   * @yields StreamChatEvent - Events including session-id, chunk, thinking, and done
   * @throws AstroShivaApiError for known API error conditions:
   *   - 403 FORBIDDEN: Session ownership error
   *   - 409 USER_NOT_READY: User has not completed onboarding
   *   - 429 RATE_LIMIT_EXCEEDED: Rate limit exceeded
   */
  async *streamChat(message: string, sessionId?: string): AsyncGenerator<StreamChatEvent> {
    const authHeader = await this.getAuthHeader(false);
    const response = await fetch(this.getApiUrl('/v1/chat/stream'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      const errorResponse = await parseErrorResponse(response);
      
      // Handle specific error status codes
      switch (response.status) {
        case 403:
          throw new AstroShivaApiError(
            'FORBIDDEN',
            'Session ownership error. You do not have access to this session.',
            403,
            errorResponse.error.details
          );
        case 409:
          throw new AstroShivaApiError(
            'USER_NOT_READY',
            'Please complete onboarding before starting a chat.',
            409,
            errorResponse.error.details
          );
        case 429:
          throw new AstroShivaApiError(
            'RATE_LIMIT_EXCEEDED',
            errorResponse.error.message || 'Rate limit exceeded. Please wait before sending another message.',
            429,
            errorResponse.error.details
          );
        default:
          throw AstroShivaApiError.fromResponse(errorResponse, response.status);
      }
    }

    // Capture the canonical session ID from the X-Session-ID header
    const canonicalSessionId = response.headers.get('X-Session-ID');
    if (canonicalSessionId) {
      yield { type: 'session-id', sessionId: canonicalSessionId };
    }

    // Check if response is actually SSE
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream') && !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Unexpected response type:', contentType, 'Body:', responseText.substring(0, 500));
      throw new Error(`Unexpected response type: ${contentType}. Expected text/event-stream.`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value);

      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataContent = line.slice(6);
          if (!dataContent.trim()) continue;
          if (dataContent.trim() === '[DONE]') continue;
          try {
            const data = JSON.parse(dataContent);
            // Handle text-delta events (API sends 'delta' field, not 'text')
            if (data.type === 'text-delta' && (data.delta || data.text)) {
              yield { type: 'chunk' as const, content: data.delta || data.text };
            } else if (data.type === 'reasoning-delta' && data.delta) {
              yield { type: 'thinking' as const, content: data.delta };
            } else if (data.content) {
              yield { type: 'chunk' as const, content: data.content };
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, 'Raw data:', dataContent.substring(0, 200));
          }
        }
      }
    }

    yield { type: 'done' as const };
  }
  
  /**
   * Submits user onboarding data to create their astrological profile.
   * 
   * @param data - User's birth information including name, date, time, and location
   * @param token - Optional auth token (uses Clerk session if not provided)
   * @throws AstroShivaApiError for known API error conditions:
   *   - 401 UNAUTHORIZED: Authentication failed
   *   - 502 ASTRO_API_ERROR: Upstream astrology API failed
   *   - 504 ASTRO_API_TIMEOUT: Cold start timeout (suggest retry)
   */
  async onboarding(data: {
    name: string;
    dateOfBirth: string;
    timeOfBirth: string;
    place: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }, token?: string): Promise<OnboardResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const authHeader = await this.getAuthHeader();
      Object.assign(headers, authHeader);
    }
    
    const response = await fetch(this.getApiUrl('/v1/users/onboard'), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorResponse = await parseErrorResponse(response);
      
      switch (response.status) {
        case 401:
          throw new AstroShivaApiError(
            'UNAUTHORIZED',
            'Authentication failed. Please ensure you are signed in.',
            401,
            errorResponse.error.details
          );
        case 502:
          throw new AstroShivaApiError(
            'ASTRO_API_ERROR',
            'The astrology calculation service is temporarily unavailable. Please try again later.',
            502,
            errorResponse.error.details
          );
        case 504:
          throw new AstroShivaApiError(
            'ASTRO_API_TIMEOUT',
            'The request timed out. This may happen during server cold starts. Please try again - subsequent attempts will be faster.',
            504,
            errorResponse.error.details
          );
        default:
          throw AstroShivaApiError.fromResponse(errorResponse, response.status);
      }
    }
    
    return response.json();
  }
  
  async getProfile(token?: string): Promise<{ success: true; data: UserProfile } | { success: false; error: { code: string; message: string } }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      try {
        const authHeader = await this.getAuthHeader();
        Object.assign(headers, authHeader);
      } catch (e) {
        return { success: false, error: { code: 'NO_TOKEN', message: 'Authentication required' } };
      }
    }
    
    const response = await fetch(this.getApiUrl('/v1/users/profile'), {
      method: 'GET',
      headers,
    });
    
    if (response.status === 404) {
      return { success: false, error: { code: 'USER_NOT_FOUND', message: 'User profile not found' } };
    }
    
    if (response.status === 401) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication failed. Please sign in again.' } };
    }
    
    if (!response.ok) {
      throw new Error(`Profile fetch failed: HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  async pollProfileStatus(token?: string, maxAttempts = 20, intervalMs = 3000): Promise<{ success: boolean; data: UserProfile }> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getProfile(token);
      
      if (result.success) {
        const { status } = result.data;
        
        if (status === 'completed') {
          return result;
        }
        
        if (status === 'failed') {
          throw new Error('Onboarding failed. Please try again.');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Onboarding polling timeout');
  }
  
  async getSessions(token?: string, limit = 20, offset = 0): Promise<SessionsResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      try {
        const authHeader = await this.getAuthHeader();
        Object.assign(headers, authHeader);
      } catch (e) {
        throw new Error('Authentication required');
      }
    }
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    const response = await fetch(`${this.getApiUrl('/v1/chat/sessions')}?${params}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Sessions API error:', response.status, errorText.substring(0, 500));
      throw new Error(`Sessions fetch failed: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid sessions response: not an object');
    }

    if (!data.success) {
      console.error('Sessions API returned unsuccessful response:', data);
    }

    if (!data.data) {
      data.data = { sessions: [], total: 0, hasMore: false };
    } else if (!data.data.sessions) {
      data.data.sessions = [];
    }

    return data;
  }
  
  async getSessionMessages(sessionId: string, token?: string, limit = 50, offset = 0): Promise<SessionMessagesResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      try {
        const authHeader = await this.getAuthHeader();
        Object.assign(headers, authHeader);
      } catch (e) {
        throw new Error('Authentication required');
      }
    }
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    const response = await fetch(`${this.getApiUrl('/v1/chat/sessions')}/${sessionId}/messages?${params}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Session messages fetch failed: HTTP ${response.status}`);
    }
    
    return response.json();
  }
  
  async deleteSession(sessionId: string, token?: string): Promise<{ success: boolean }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      try {
        const authHeader = await this.getAuthHeader();
        Object.assign(headers, authHeader);
      } catch (e) {
        throw new Error('Authentication required');
      }
    }

    const response = await fetch(`${this.getApiUrl('/v1/chat/sessions')}/${sessionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Delete session failed: HTTP ${response.status}`);
    }

    return { success: true };
  }

  async createSession(title?: string, token?: string): Promise<{ success: boolean; data: { session: Session } }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      try {
        const authHeader = await this.getAuthHeader();
        Object.assign(headers, authHeader);
      } catch (e) {
        throw new Error('Authentication required');
      }
    }

    const response = await fetch(this.getApiUrl('/v1/chat/sessions'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: title || 'New Chat' }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Create session API error:', response.status, errorText.substring(0, 500));
      throw new Error(`Create session failed: HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const astroShivaClient = new AstroShivaClient();
