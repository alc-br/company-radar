import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const segment = searchParams.get('segment') || ''
    const state = searchParams.get('state') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tradeName: { contains: search } },
        { cnpj: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (segment) where.segment = segment
    if (state) where.state = state

    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          contacts: { select: { id: true, name: true, email: true, role: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          _count: { select: { tasks: true, documents: true } },
        },
      }),
      db.client.count({ where }),
    ])

    const tasksPerClient = await db.task.groupBy({
      by: ['clientId'],
      _count: { status: true },
      where: { status: 'pending' },
    })

    const pendingMap = new Map(tasksPerClient.map(t => [t.clientId, t._count.status]))

    const enriched = clients.map(c => ({
      ...c,
      tagsList: c.tags.map(ct => ct.tag),
      pendingTasks: pendingMap.get(c.id) || 0,
    }))

    return NextResponse.json({ clients: enriched, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tags, ...clientData } = body

    const client = await db.client.create({
      data: {
        organizationId: clientData.organizationId || 'org-default',
        name: clientData.name,
        cnpj: clientData.cnpj,
        tradeName: clientData.tradeName,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        segment: clientData.segment,
        notes: clientData.notes,
        portalAccess: clientData.portalAccess,
      },
      include: {
        tags: { include: { tag: true } },
        contacts: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { tasks: true, documents: true } },
      },
    })

    // Create ClientTag relations
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await db.clientTag.createMany({
        data: tags.map((tagId: string) => ({ clientId: client.id, tagId })),
      })
    }

    const result = await db.client.findUnique({
      where: { id: client.id },
      include: {
        tags: { include: { tag: true } },
        contacts: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { tasks: true, documents: true } },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'CNPJ already registered' }, { status: 409 })
    }
    console.error('Failed to create client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}