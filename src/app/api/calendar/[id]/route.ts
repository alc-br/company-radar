import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { createdAt, updatedAt, organizationId, ...updateData } = body

    const event = await db.calendarEvent.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      },
    })
    return NextResponse.json(event)
  } catch (error) {
    console.error('Calendar PUT error:', error)
    return NextResponse.json({ error: 'Failed to update calendar event' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.calendarEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 })
  }
}
