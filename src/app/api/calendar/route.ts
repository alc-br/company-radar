import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // Get calendar events for the month
    const events = await db.calendarEvent.findMany({
      where: {
        startDate: { gte: startDate, lte: endDate },
      },
      orderBy: { startDate: 'asc' },
    })

    // Get tasks with dueDates in this month that are not already events
    const taskEvents = await db.task.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
      },
      include: { client: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    })

    // Build a set of relatedIds from existing calendar events to avoid duplicates
    const existingRelatedIds = new Set(
      events.filter(e => e.relatedId).map(e => e.relatedId)
    )

    // Generate calendar events from tasks that don't already have events
    const generatedEvents = taskEvents
      .filter(t => !existingRelatedIds.has(t.id))
      .map(task => ({
        id: `task-${task.id}`,
        organizationId: task.organizationId,
        title: task.title,
        description: task.description,
        startDate: task.dueDate!,
        endDate: task.dueDate,
        allDay: true,
        color: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f97316' : task.priority === 'medium' ? '#eab308' : '#22c55e',
        type: 'task' as const,
        relatedId: task.id,
        clientName: task.client.name,
        status: task.status,
        priority: task.priority,
        _generated: true,
      }))

    return NextResponse.json({ events: [...events, ...generatedEvents] })
  } catch (error) {
    console.error('Calendar GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, startDate, endDate, allDay, color, type, relatedId } = body

    if (!title || !startDate) {
      return NextResponse.json({ error: 'Title and startDate are required' }, { status: 400 })
    }

    const event = await db.calendarEvent.create({
      data: {
        organizationId: body.organizationId || 'org-default',
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay ?? false,
        color: color || null,
        type: type || 'task',
        relatedId: relatedId || null,
      },
    })
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Calendar POST error:', error)
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 })
  }
}