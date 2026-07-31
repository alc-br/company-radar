import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Valid status transitions ──────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  a_fazer: ['em_andamento', 'aguardando_cliente', 'aguardando_terceiro', 'bloqueada', 'cancelada'],
  em_andamento: ['a_fazer', 'concluida', 'aguardando_cliente', 'aguardando_terceiro', 'bloqueada', 'cancelada'],
  aguardando_cliente: ['a_fazer', 'em_andamento', 'concluida', 'bloqueada', 'cancelada'],
  aguardando_terceiro: ['a_fazer', 'em_andamento', 'concluida', 'bloqueada', 'cancelada'],
  bloqueada: ['a_fazer', 'em_andamento', 'cancelada'],
  concluida: ['a_fazer'], // reopen
  cancelada: ['a_fazer'], // reopen
}

// ── GET /api/tasks/[id] ─────────────────────────────────
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const task = await db.task.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        template: { select: { id: true, name: true } },
        application: {
          select: {
            id: true,
            templateVersionId: true,
            template: { select: { id: true, name: true } },
          },
        },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        followers: true,
        dependencies: {
          include: {
            dependsOnTask: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                client: { select: { name: true } },
              },
            },
          },
        },
        dependsOn: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                client: { select: { name: true } },
              },
            },
          },
        },
        subtasks: {
          orderBy: { updatedAt: 'desc' },
          include: { checklist: { orderBy: { order: 'asc' } } },
        },
        parentTask: { select: { id: true, title: true, status: true } },
        _count: {
          select: {
            subtasks: true,
            checklist: true,
            comments: true,
            followers: true,
          },
        },
      },
    })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to fetch task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

// ── PUT /api/tasks/[id] ─────────────────────────────────
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      addChecklist,
      toggleChecklist,
      removeChecklistItem,
      reorderChecklist,
      addComment,
      addDependency,
      removeDependency,
      updateStatus,
      client,
      template,
      checklist,
      comments,
      subtasks,
      parentTask,
      application,
      followers,
      dependencies,
      dependsOn,
      _count,
      ...updateData
    } = body

    // ── Handle adding checklist items ──
    if (addChecklist && Array.isArray(addChecklist)) {
      const existingItems = await db.taskChecklist.findMany({
        where: { taskId: id },
        orderBy: { order: 'desc' },
        take: 1,
      })
      const nextOrder = (existingItems[0]?.order ?? -1) + 1

      await db.taskChecklist.createMany({
        data: addChecklist.map((item: { text: string; done?: boolean; required?: boolean }, idx: number) => ({
          taskId: id,
          text: item.text,
          done: item.done || false,
          required: item.required || false,
          order: nextOrder + idx,
        })),
      })
    }

    // ── Handle toggling a checklist item ──
    if (toggleChecklist && typeof toggleChecklist === 'string') {
      const item = await db.taskChecklist.findUnique({ where: { id: toggleChecklist } })
      if (item) {
        await db.taskChecklist.update({
          where: { id: toggleChecklist },
          data: { done: !item.done },
        })
      }
    }

    // ── Handle removing a checklist item ──
    if (removeChecklistItem && typeof removeChecklistItem === 'string') {
      await db.taskChecklist.delete({ where: { id: removeChecklistItem } })
    }

    // ── Handle reordering checklist ──
    if (reorderChecklist && Array.isArray(reorderChecklist)) {
      for (const item of reorderChecklist) {
        if (item.id && typeof item.order === 'number') {
          await db.taskChecklist.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        }
      }
    }

    // ── Handle adding a comment ──
    if (addComment) {
      await db.taskComment.create({
        data: {
          taskId: id,
          userName: addComment.userName,
          content: addComment.content,
          userId: addComment.userId || null,
          memberId: addComment.memberId || null,
        },
      })
    }

    // ── Handle adding a dependency ──
    if (addDependency) {
      await db.taskDependency.create({
        data: {
          taskId: id,
          dependsOnId: addDependency,
          blockingType: 'finish_start',
        },
      })
    }

    // ── Handle removing a dependency ──
    if (removeDependency) {
      await db.taskDependency.delete({
        where: {
          taskId_dependsOnId: {
            taskId: id,
            dependsOnId: removeDependency,
          },
        },
      })
    }

    // ── Handle status update with transition validation ──
    if (updateStatus) {
      // Fetch current task for validation
      const currentTask = await db.task.findUnique({
        where: { id },
        include: {
          checklist: true,
          dependencies: {
            include: {
              dependsOnTask: { select: { id: true, title: true, status: true } },
            },
          },
        },
      })

      if (!currentTask) {
        return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
      }

      // Validate transition
      const allowed = VALID_TRANSITIONS[currentTask.status] || []
      if (!allowed.includes(updateStatus)) {
        return NextResponse.json({
          error: `Transição inválida: não é possível ir de "${currentTask.status}" para "${updateStatus}"`,
        }, { status: 400 })
      }

      // Check if blocked - cannot complete if blocked
      if (updateStatus === 'concluida') {
        const blockedBy = currentTask.dependencies.filter(
          (d) => d.dependsOnTask.status !== 'concluida' && d.dependsOnTask.status !== 'cancelada'
        )
        if (blockedBy.length > 0) {
          const blockingTasks = blockedBy.map((d) => d.dependsOnTask.title).join(', ')
          return NextResponse.json({
            error: `Não é possível concluir: tarefa bloqueada por: ${blockingTasks}`,
          }, { status: 400 })
        }

        // Check required checklist items
        const requiredIncomplete = currentTask.checklist.filter(
          (c) => c.required && !c.done
        )
        if (requiredIncomplete.length > 0) {
          const items = requiredIncomplete.map((c) => c.text).join(', ')
          return NextResponse.json({
            error: `Não é possível concluir: itens obrigatórios pendentes: ${items}`,
          }, { status: 400 })
        }
      }

      updateData.status = updateStatus
      if (updateStatus === 'concluida') {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    // ── Handle date fields ──
    if (updateData.dueDate && typeof updateData.dueDate === 'string') {
      updateData.dueDate = new Date(updateData.dueDate)
    }
    if (updateData.completedAt && typeof updateData.completedAt === 'string') {
      updateData.completedAt = new Date(updateData.completedAt)
    }

    // ── Perform the update ──
    const task = await db.task.update({
      where: { id },
      data: updateData,
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
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                client: { select: { name: true } },
              },
            },
          },
        },
        dependsOn: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                client: { select: { name: true } },
              },
            },
          },
        },
        subtasks: {
          orderBy: { updatedAt: 'desc' },
          include: { checklist: { orderBy: { order: 'asc' } } },
        },
        parentTask: { select: { id: true, title: true, status: true } },
        _count: {
          select: {
            subtasks: true,
            checklist: true,
            comments: true,
            followers: true,
          },
        },
      },
    })

    // ── Audit log for status changes ──
    if (updateStatus) {
      try {
        await db.auditLog.create({
          data: {
            action: 'task_status_change',
            entity: 'Task',
            entityId: id,
            detail: `Status alterado para ${updateStatus}`,
            diff: JSON.stringify({ from: body._previousStatus || 'unknown', to: updateStatus }),
          },
        })
      } catch {
        // Audit log failure should not break the update
      }
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// ── DELETE /api/tasks/[id] ──────────────────────────────
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
