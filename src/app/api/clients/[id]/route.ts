import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await db.client.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { createdAt: 'desc' } },
        tasks: {
          orderBy: { dueDate: 'asc' },
          take: 50,
          include: {
            checklist: { orderBy: { order: 'asc' } },
            comments: { orderBy: { createdAt: 'asc' } },
          },
        },
        documents: { orderBy: { updatedAt: 'desc' }, take: 20 },
        tags: { include: { tag: true } },
        applications: {
          orderBy: { createdAt: 'desc' },
          include: {
            template: { select: { id: true, name: true } },
            templateVersion: { select: { id: true, versionNumber: true, name: true } },
          },
        },
        _count: { select: { tasks: true, documents: true, contacts: true, applications: true } },
      },
    })
    if (!client) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const { tags, ...rest } = client

    // Count overdue tasks
    const now = new Date()
    const overdueTasksCount = await db.task.count({
      where: {
        clientId: id,
        status: { not: 'concluida' },
        dueDate: { lt: now },
      },
    })

    // Count active applications
    const activeApplicationsCount = await db.templateApplication.count({
      where: { clientId: id, status: 'active' },
    })

    // Get next due date
    const nextTask = await db.task.findFirst({
      where: {
        clientId: id,
        status: { not: 'concluida' },
        dueDate: { gte: now },
      },
      orderBy: { dueDate: 'asc' },
      select: { dueDate: true },
    })

    return NextResponse.json({
      ...rest,
      tagsList: tags.map(ct => ct.tag),
      overdueTasksCount,
      activeApplicationsCount,
      nextDueDate: nextTask?.dueDate?.toISOString() || null,
    })
  } catch (error) {
    console.error('Failed to fetch client:', error)
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { tags, addTags, removeTags, ...updateData } = body

    // Build update payload — only include fields that exist on the model
    const data: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'tradeName', 'cnpj', 'ie', 'im', 'cnae',
      'taxRegime', 'companySize', 'segment', 'openDate',
      'email', 'phone', 'address', 'city', 'state', 'zipCode',
      'responsibleId', 'notes', 'portalAccess', 'serviceStartDate',
      'status',
    ]
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    // Update client fields
    await db.client.update({
      where: { id },
      data,
    })

    // Replace all tags if `tags` array is provided
    if (tags && Array.isArray(tags)) {
      await db.clientTag.deleteMany({ where: { clientId: id } })
      if (tags.length > 0) {
        await db.clientTag.createMany({
          data: tags.map((tagId: string) => ({ clientId: id, tagId })),
        })
      }
    }

    // Add specific tags
    if (addTags && Array.isArray(addTags)) {
      await db.clientTag.createMany({
        data: addTags.map((tagId: string) => ({ clientId: id, tagId })),
      })
    }

    // Remove specific tags
    if (removeTags && Array.isArray(removeTags)) {
      await db.clientTag.deleteMany({
        where: {
          clientId: id,
          tagId: { in: removeTags },
        },
      })
    }

    // Fetch updated client with full relations
    const result = await db.client.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        contacts: { select: { id: true, name: true, email: true, role: true } },
        applications: {
          orderBy: { createdAt: 'desc' },
          include: {
            template: { select: { id: true, name: true } },
            templateVersion: { select: { id: true, versionNumber: true, name: true } },
          },
        },
        _count: { select: { tasks: true, documents: true, contacts: true, applications: true } },
      },
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'CNPJ já cadastrado nesta organização' }, { status: 409 })
    }
    console.error('Failed to update client:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete client:', error)
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 })
  }
}
