import { NextRequest } from 'next/server';

const ROADMAP_BACKEND_URL = process.env.ROADMAP_SERVICE_URL ?? 'http://localhost:3050';

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

  // Drop /api/roadmap prefix when proxying
  const backendPath = pathname.replace('/api/roadmap', '');
  const backendUrl = `${ROADMAP_BACKEND_URL}${backendPath}${search}`;

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers.entries()),
        host: new URL(ROADMAP_BACKEND_URL).host,
      },
      body: request.method !== 'GET' ? await request.arrayBuffer() : undefined,
    });

    const data = await response.arrayBuffer();

    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Roadmap proxy error:', error);
    return new Response('Proxy error', { status: 500 });
  }
}

