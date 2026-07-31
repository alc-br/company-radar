import { NextRequest, NextResponse } from 'next/server'

/**
 * Catch-all API proxy — routes /api/clients, /api/tasks, /api/dashboard, etc.
 * to the Django REST API at DJANGO_API_URL/api/v1/.
 *
 * Specific prefixes are handled by their own route handlers:
 *   /api/v1/...  → api/v1/[...path]/route.ts
 *   /api/auth/... → api/auth/[...path]/route.ts
 *   /api/account/... → api/account/[...path]/route.ts
 *
 * Everything else lands here and is forwarded to Django.
 */

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000/api/v1'

const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailers', 'transfer-encoding', 'upgrade',
])

function stripHopByHop(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((v, k) => { if (!HOP_BY_HOP.has(k.toLowerCase())) out[k] = v })
  return out
}

function rewriteCookies(setCookie: string | null, req: NextRequest): string | null {
  if (!setCookie) return null
  const reqHost = req.headers.get('host') || 'localhost'
  return setCookie.replace(/Domain=[^;]+;?/gi, `Domain=${reqHost};`).replace(/Secure;?/gi, '').replace(/SameSite=[^;]+;?/gi, 'SameSite=Lax;')
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const pathStr = path.join('/')
  const url = `${DJANGO_API_URL}/${pathStr}${request.nextUrl.search}`

  const headers = stripHopByHop(request.headers)
  // Forward auth cookies for session authentication
  const sessionid = request.cookies.get('sessionid')
  const csrftoken = request.cookies.get('csrftoken')
  if (sessionid) {
    headers['cookie'] = `sessionid=${sessionid.value}${csrftoken ? `; csrftoken=${csrftoken.value}` : ''}`
  }
  // Forward CSRF token for POST/PUT/PATCH/DELETE
  if (csrftoken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    headers['x-csrftoken'] = csrftoken.value
  }
  headers['content-type'] = request.headers.get('content-type') || 'application/json'
  headers['accept'] = request.headers.get('accept') || 'application/json'

  try {
    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual',
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body
      init.duplex = 'half'
    }
    const res = await fetch(url, init)
    const resHeaders = new Headers(res.headers)
    resHeaders.delete('transfer-encoding')
    const setCookie = rewriteCookies(res.headers.get('set-cookie'), request)
    if (setCookie) resHeaders.set('set-cookie', setCookie)
    return new NextResponse(res.body, { status: res.status, statusText: res.statusText, headers: resHeaders })
  } catch (err) {
    console.error(`[proxy /api/${pathStr}]`, err)
    return NextResponse.json({ error: 'Serviço indisponível. Tente novamente em alguns instantes.' }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
