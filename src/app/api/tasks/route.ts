import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ── GET /api/tasks ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statuses = searchParams.get('statuses') || ''
    const priority = searchParams.get('priority') || ''
    const clientId = searchParams.get('clientId') || ''
    const assignedTo = searchParams.get('assignedTo') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const search = searchParams.get('search') || ''
    const viewMode = searchParams.get('viewMode') || 'tabela'
    const limit = searchParams.get('limit')
    const myQueue = searchParams.get('myQueue') === 'true'

    const where: Record<string, unknown> = {}

    // Status filter (multi)
    if (statuses) {
      const statusList = statuses.split(',').filter(Boolean)
      if (statusList.length === 1) {
        where.status = statusList[0]
      } else if (statusList.length > 1) {
        where.status = { in: statusList }
      }
    }

    // Single status (backward compat)
    if (!statuses && searchParams.get('status')) {
      where.status = searchParams.get('status')!
    }

    if (priority) where.priority = priority
    if (clientId) where.clientId = clientId
    if (assignedTo) where.assignedTo = assignedTo
    if (departmentId) where.departmentId = departmentId

    // Date range
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.dueDate = dateFilter
    }

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { client: { name: { contains: search } } },
        { assignedTo: { contains: search } },
      ]
    }

    // Only top-level tasks by default (unless viewing subtasks)
    if (!searchParams.get('parentId')) {
      where.parentTaskId = null
    } else {
      where.parentTaskId = searchParams.get('parentId')
    }

    // Recurrence: exclude child occurrences by default for list views
    if (viewMode === 'tabela' || viewMode === 'quadro' || myQueue) {
      where.recurrenceParentId = null
    }

    const include: Prisma.TaskInclude = {
      client: { select: { id: true, name: true, tradeName: true } },
      checklist: { orderBy: { order: 'asc' } },
      comments: { orderBy: { createdAt: 'asc' } },
      followers: true,
      dependencies: {
        include: {
          dependsOnTask: {
            select: { id: true, title: true, status: true, priority: true, client: { select: { name: true } } },
          },
        },
      },
      _count: {
        select: {
          subtasks: true,
          checklist: true,
          comments: true,
          followers: true,
        },
      },
    }

    // Include subtasks only in detail/grouped views
    if (viewMode === 'agrupamento') {
      include.subtasks = {
        orderBy: { updatedAt: 'desc' },
        include: { checklist: { orderBy: { order: 'asc' } } },
      }
    }

    const query: Prisma.TaskFindManyArgs = {
      where,
      orderBy: { updatedAt: 'desc' },
      include,
    }

    if (limit) {
      query.take = parseInt(limit)
    }

    const tasks = await db.task.findMany(query)

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// ── POST /api/tasks ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      checklist,
      comments,
      subtasks,
      client,
      _count,
      tags,
      dependencies,
      addDependency,
      removeDependency,
      removeChecklistItem,
      reorderChecklist,
      toggleChecklist,
      addChecklist,
      addComment,
      updateStatus,
      template,
      application,
      followers,
      dependsOn,
      parentTask,
      ...taskData
    } = body

    const task = await db.task.create({
      data: {
        organizationId: taskData.organizationId || 'org-default',
        clientId: taskData.clientId,
        title: taskData.title,
        description: taskData.description || null,
        status: taskData.status || 'a_fazer',
        priority: taskData.priority || 'medium',
        category: taskData.category || null,
        departmentId: taskData.departmentId || null,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        completedAt: taskData.completedAt ? new Date(taskData.completedAt) : null,
        assignedTo: taskData.assignedTo || null,
        assignedToId: taskData.assignedToId || null,
        reviewerId: taskData.reviewerId || null,
        templateId: taskData.templateId || null,
        templateVersionId: taskData.templateVersionId || null,
        templateApplicationId: taskData.templateApplicationId || null,
        templateStageIndex: taskData.templateStageIndex ?? null,
        templateTaskIndex: taskData.templateTaskIndex ?? null,
        recurrenceRule: taskData.recurrenceRule || null,
        recurrenceParentId: taskData.recurrenceParentId || null,
        parentTaskId: taskData.parentTaskId || null,
        portalVisible: taskData.portalVisible || false,
        portalInstructions: taskData.portalInstructions || null,
        estimatedMinutes: taskData.estimatedMinutes || null,
        isOptional: taskData.isOptional || false,
      },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        template: { select: { id: true, name: true } },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        followers: true,
        dependencies: {
          include: {
            dependsOnTask: {
              select: { id: true, title: true, status: true, priority: true, client: { select: { name: true } } },
            },
          },
        },
        subtasks: true,
        _count: { select: { subtasks: true, checklist: true, comments: true, followers: true } },
      },
    })

    // Create checklist items if provided
    if (checklist && Array.isArray(checklist) && checklist.length > 0) {
      await db.taskChecklist.createMany({
        data: checklist.map((item: { text: string; done?: boolean; required?: boolean; order?: number }, idx: number) => ({
          taskId: task.id,
          text: item.text,
          done: item.done || false,
          required: item.required || false,
          order: item.order ?? idx,
        })),
      })
    }

    // Create comments if provided
    if (comments && Array.isArray(comments) && comments.length > 0) {
      await db.taskComment.createMany({
        data: comments.map((c: { userName: string; content: string; userId?: string; memberId?: string }) => ({
          taskId: task.id,
          userName: c.userName,
          content: c.content,
          userId: c.userId || null,
          memberId: c.memberId || null,
        })),
      })
    }

    // Create dependencies if provided
    if (dependencies && Array.isArray(dependencies) && dependencies.length > 0) {
      await db.taskDependency.createMany({
        data: dependencies.map((dep: { dependsOnId: string; blockingType?: string }) => ({
          taskId: task.id,
          dependsOnId: dep.dependsOnId,
          blockingType: dep.blockingType || 'finish_start',
        })),
      })
    }

    // Create followers if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await db.taskFollower.createMany({
        data: tags.map((memberId: string) => ({
          taskId: task.id,
          memberId,
        })),
        skipDuplicates: true,
      })
    }

    // Fetch the full task with relations
    const result = await db.task.findUnique({
      where: { id: task.id },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        template: { select: { id: true, name: true } },
        application: { select: { id: true, templateVersionId: true } },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        followers: true,
        dependencies: {
          include: {
            dependsOnTask: {
              select: { id: true, title: true, status: true, priority: true, client: { select: { name: true } } },
            },
          },
        },
        dependsOn: {
          include: {
            task: {
              select: { id: true, title: true, status: true, priority: true, client: { select: { name: true } } },
            },
          },
        },
        subtasks: true,
        parentTask: { select: { id: true, title: true } },
        _count: { select: { subtasks: true, checklist: true, comments: true, followers: true } },
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
