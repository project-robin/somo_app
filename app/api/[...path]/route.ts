import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://astro-shiva-app.vercel.app';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'DELETE');
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-User-ID, X-Guest-ID, X-Request-ID',
    },
  });
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    
    // Get query params
    const url = new URL(request.url);
    const queryString = url.search;
    
    // Forward headers
    const headers: HeadersInit = {};
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const contentType = request.headers.get('Content-Type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    // Get body for POST/PUT
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      body = await request.text();
    }
    
    console.log(`[Proxy] ${method} /api/${pathString} - Forwarding request...`);
    
    const response = await fetch(`${API_BASE_URL}/api/${pathString}${queryString}`, {
      method,
      headers,
      body,
    });
    
    console.log(`[Proxy] Response status: ${response.status}, content-type: ${response.headers.get('content-type')}`);
    
    // Forward response headers
    const responseHeaders: HeadersInit = {
      'Access-Control-Allow-Origin': '*',
    };
    
    const sessionId = response.headers.get('X-Session-ID');
    if (sessionId) {
      console.log(`[Proxy] X-Session-ID: ${sessionId}`);
      responseHeaders['X-Session-ID'] = sessionId;
    }
    const requestId = response.headers.get('X-Request-ID');
    if (requestId) {
      responseHeaders['X-Request-ID'] = requestId;
    }
    const contentTypeResponse = response.headers.get('Content-Type');
    if (contentTypeResponse) {
      responseHeaders['Content-Type'] = contentTypeResponse;
    }
    
    // For SSE streams - use TransformStream for proper streaming
    if (contentTypeResponse?.includes('text/event-stream')) {
      console.log('[Proxy] SSE stream detected - setting up streaming response');
      
      // Create a TransformStream to handle the streaming
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      
      // Start reading from the upstream in the background
      (async () => {
        const reader = response.body?.getReader();
        if (!reader) {
          writer.close();
          return;
        }
        
        const decoder = new TextDecoder();
        try {
          let chunkCount = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log(`[Proxy] Stream complete - ${chunkCount} chunks sent`);
              break;
            }
            chunkCount++;
            const text = decoder.decode(value, { stream: true });
            console.log(`[Proxy] Chunk ${chunkCount}: ${text.substring(0, 100)}...`);
            await writer.write(value);
          }
        } catch (e) {
          console.error('[Proxy] Stream error:', e);
        } finally {
          writer.close();
        }
      })();
      
      return new NextResponse(readable, {
        status: response.status,
        headers: {
          ...responseHeaders,
          // Ensure no buffering
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    const responseText = await response.text();
    
    return new NextResponse(responseText, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: 'Failed to proxy request' } },
      { status: 500 }
    );
  }
}
