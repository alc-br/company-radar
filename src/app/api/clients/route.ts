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
      pendingTasks: pendingMap.get(c.id) || 0,
    }))

    return NextResponse.json({ clients: enriched, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const client = await db.client.create({
      data: {
        organizationId: body.organizationId || 'org-default',
        name: body.name,
        cnpj: body.cnpj,
        tradeName: body.tradeName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        segment: body.segment,
        tags: body.tags,
      },
    })
    return NextResponse.json(client, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'CNPJ ja cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}