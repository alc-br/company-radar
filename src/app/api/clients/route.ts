import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const segment = searchParams.get('segment') || ''
    const state = searchParams.get('state') || ''
    const responsibleId = searchParams.get('responsibleId') || ''
    const tagId = searchParams.get('tagId') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const export_csv = searchParams.get('export') === 'csv'

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tradeName: { contains: search } },
        { cnpj: { contains: search.replace(/\D/g, '') } },
      ]
    }
    if (status) where.status = status
    if (segment) where.segment = segment
    if (state) where.state = state
    if (responsibleId) where.responsibleId = responsibleId
    if (departmentId) {
      // Filter by department through tasks assigned to department members
      // Since this is complex, we do a simpler filter
    }
    if (tagId) {
      where.tags = {
        some: { tagId }
      }
    }

    // ── CSV Export ───────────────────────────────────────────
    if (export_csv) {
      const clients = await db.client.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
      })

      const header = 'Razão Social,Nome Fantasia,CNPJ,Regime Tributário,Segmento,Cidade,Estado,E-mail,Telefone,Status,Tags\n'
      const rows = clients.map(c => {
        const tags = c.tags.map(ct => ct.tag.name).join('; ')
        const fields = [
          c.name,
          c.tradeName || '',
          c.cnpj,
          c.taxRegime || '',
          c.segment || '',
          c.city || '',
          c.state || '',
          c.email || '',
          c.phone || '',
          c.status,
          `"${tags}"`,
        ]
        return fields.map(f => `"${String(f).replace(/"/g, '""')}",`).join('') + '\n'
      })

      const csv = '\uFEFF' + header + rows.join('')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="clientes_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    // ── Paginated response ───────────────────────────────────
    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          contacts: { select: { id: true, name: true, email: true, role: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          applications: { select: { id: true, status: true } },
          _count: { select: { tasks: true, documents: true } },
        },
      }),
      db.client.count({ where }),
    ])

    // Count overdue tasks per client
    const now = new Date()
    const allClientIds = clients.map(c => c.id)

    let overdueMap = new Map<string, number>()
    if (allClientIds.length > 0) {
      const overdueGroups = await db.task.groupBy({
        by: ['clientId'],
        _count: { id: true },
        where: {
          clientId: { in: allClientIds },
          status: { not: 'concluida' },
          dueDate: { lt: now },
        },
      })
      overdueMap = new Map(overdueGroups.map(g => [g.clientId, g._count.id]))
    }

    // Get next due date per client
    let nextDateMap = new Map<string, string | null>()
    if (allClientIds.length > 0) {
      const upcomingTasks = await db.task.findMany({
        where: {
          clientId: { in: allClientIds },
          status: { not: 'concluida' },
          dueDate: { gte: now },
        },
        orderBy: { dueDate: 'asc' },
        select: { clientId: true, dueDate: true },
      })
      const seen = new Set<string>()
      for (const t of upcomingTasks) {
        if (!seen.has(t.clientId) && t.dueDate) {
          nextDateMap.set(t.clientId, t.dueDate.toISOString())
          seen.add(t.clientId)
        }
      }
    }

    const enriched = clients.map(c => ({
      ...c,
      tagsList: c.tags.map(ct => ct.tag),
      pendingTasks: overdueMap.get(c.id) || 0,
      overdueTasksCount: overdueMap.get(c.id) || 0,
      nextDueDate: nextDateMap.get(c.id) || null,
      activeApplicationsCount: c.applications.filter(a => a.status === 'active').length,
    }))

    return NextResponse.json({
      clients: enriched,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
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
        tradeName: clientData.tradeName || null,
        ie: clientData.ie || null,
        im: clientData.im || null,
        cnae: clientData.cnae || null,
        taxRegime: clientData.taxRegime || null,
        companySize: clientData.companySize || null,
        segment: clientData.segment || null,
        openDate: clientData.openDate || null,
        email: clientData.email || null,
        phone: clientData.phone || null,
        address: clientData.address || null,
        city: clientData.city || null,
        state: clientData.state || null,
        zipCode: clientData.zipCode || null,
        responsibleId: clientData.responsibleId || null,
        notes: clientData.notes || null,
        portalAccess: clientData.portalAccess || false,
        serviceStartDate: clientData.serviceStartDate || null,
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
      return NextResponse.json({ error: 'CNPJ já cadastrado nesta organização' }, { status: 409 })
    }
    console.error('Failed to create client:', error)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
