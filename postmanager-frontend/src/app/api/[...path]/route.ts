import { NextRequest } from 'next/server';

const BACKEND_URL = 'http://localhost:3045';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Убираем /api из пути для проксирования
  const backendPath = pathname.replace('/api', '');
  const backendUrl = `${BACKEND_URL}${backendPath}${search}`;
  
  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        'host': 'localhost:3045'
      },
      body: request.method !== 'GET' ? await request.text() : undefined
    });

    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Proxy error', { status: 500 });
  }
}
