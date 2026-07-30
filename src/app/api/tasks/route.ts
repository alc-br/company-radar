import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const clientId = searchParams.get('clientId') || ''
    const assignedTo = searchParams.get('assignedTo') || ''
    const parentId = searchParams.get('parentId') || ''

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (clientId) where.clientId = clientId
    if (assignedTo) where.assignedTo = assignedTo
    if (parentId) where.parentTaskId = parentId
    else where.parentTaskId = null // only top-level tasks by default

    const tasks = await db.task.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: {
          orderBy: { updatedAt: 'desc' },
          include: {
            checklist: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { subtasks: true, checklist: true, comments: true } },
      },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { checklist, comments, subtasks, client, _count, ...taskData } = body

    const task = await db.task.create({
      data: {
        organizationId: taskData.organizationId || 'org-default',
        clientId: taskData.clientId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        completedAt: taskData.completedAt ? new Date(taskData.completedAt) : null,
        assignedTo: taskData.assignedTo,
        templateId: taskData.templateId,
        templateStepIndex: taskData.templateStepIndex,
        recurrenceRule: taskData.recurrenceRule,
        parentTaskId: taskData.parentTaskId || null,
      },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: true,
        _count: { select: { subtasks: true, checklist: true, comments: true } },
      },
    })

    // Create checklist items if provided
    if (checklist && Array.isArray(checklist) && checklist.length > 0) {
      await db.taskChecklist.createMany({
        data: checklist.map((item: { text: string; done?: boolean; order?: number }, idx: number) => ({
          taskId: task.id,
          text: item.text,
          done: item.done || false,
          order: item.order ?? idx,
        })),
      })
    }

    // Create comments if provided
    if (comments && Array.isArray(comments) && comments.length > 0) {
      await db.taskComment.createMany({
        data: comments.map((c: { userName: string; content: string; userId?: string }) => ({
          taskId: task.id,
          userName: c.userName,
          content: c.content,
          userId: c.userId || null,
        })),
      })
    }

    // Fetch the full task with relations
    const result = await db.task.findUnique({
      where: { id: task.id },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: true,
        _count: { select: { subtasks: true, checklist: true, comments: true } },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}