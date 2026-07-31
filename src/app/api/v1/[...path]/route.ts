import { NextRequest, NextResponse } from 'next/server'

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000'

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
  const url = `${DJANGO_API_URL}/api/v1/${pathStr}${request.nextUrl.search}`

  const headers = stripHopByHop(request.headers)
  // Forward auth cookie
  const sessionid = request.cookies.get('sessionid')
  const csrftoken = request.cookies.get('csrftoken')
  if (sessionid) headers['cookie'] = `sessionid=${sessionid.value}${csrftoken ? `; csrftoken=${csrftoken.value}` : ''}`

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

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    })
  } catch (err) {
    console.error(`[proxy /api/v1/${pathStr}]`, err)
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
