import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const clientId = searchParams.get('clientId') || ''

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (clientId) where.clientId = clientId

    const tasks = await db.task.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { client: { select: { name: true, tradeName: true } } },
    })
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar tarefas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const task = await db.task.create({
      data: {
        organizationId: body.organizationId || 'org-default',
        clientId: body.clientId,
        title: body.title,
        description: body.description,
        status: body.status || 'pending',
        priority: body.priority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignedTo: body.assignedTo,
        templateId: body.templateId,
        checklist: JSON.stringify(body.checklist || []),
      },
    })
    return NextResponse.json(task, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}