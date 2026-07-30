import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const task = await db.task.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        template: { select: { id: true, name: true } },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: {
          orderBy: { updatedAt: 'desc' },
          include: { checklist: { orderBy: { order: 'asc' } } },
        },
        parentTask: { select: { id: true, title: true } },
        _count: { select: { subtasks: true, checklist: true, comments: true } },
      },
    })
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to fetch task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      addChecklist,
      toggleChecklist,
      addComment,
      updateStatus,
      client,
      template,
      checklist,
      comments,
      subtasks,
      parentTask,
      _count,
      ...updateData
    } = body

    // Handle adding checklist items
    if (addChecklist && Array.isArray(addChecklist)) {
      const existingItems = await db.taskChecklist.findMany({
        where: { taskId: id },
        orderBy: { order: 'desc' },
        take: 1,
      })
      const nextOrder = (existingItems[0]?.order ?? -1) + 1

      await db.taskChecklist.createMany({
        data: addChecklist.map((item: { text: string; done?: boolean }, idx: number) => ({
          taskId: id,
          text: item.text,
          done: item.done || false,
          order: nextOrder + idx,
        })),
      })
    }

    // Handle toggling a checklist item
    if (toggleChecklist && typeof toggleChecklist === 'string') {
      const item = await db.taskChecklist.findUnique({ where: { id: toggleChecklist } })
      if (item) {
        await db.taskChecklist.update({
          where: { id: toggleChecklist },
          data: { done: !item.done },
        })
      }
    }

    // Handle adding a comment
    if (addComment) {
      await db.taskComment.create({
        data: {
          taskId: id,
          userName: addComment.userName,
          content: addComment.content,
          userId: addComment.userId || null,
        },
      })
    }

    // Handle status update with completedAt
    if (updateStatus) {
      updateData.status = updateStatus
      if (updateStatus === 'completed') {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    // Handle date fields
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate)
    }
    if (updateData.completedAt && typeof updateData.completedAt === 'string') {
      updateData.completedAt = new Date(updateData.completedAt)
    }

    // Perform the update
    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        template: { select: { id: true, name: true } },
        checklist: { orderBy: { order: 'asc' } },
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: {
          orderBy: { updatedAt: 'desc' },
          include: { checklist: { orderBy: { order: 'asc' } } },
        },
        parentTask: { select: { id: true, title: true } },
        _count: { select: { subtasks: true, checklist: true, comments: true } },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Failed to update task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

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
