import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, format, filters } = body

    if (!type || !format) {
      return NextResponse.json({ error: 'Type and format are required' }, { status: 400 })
    }

    const session = JSON.parse(
      request.headers.get('x-session') || '{}'
    )

    const job = await db.exportJob.create({
      data: {
        organizationId: body.organizationId || 'org-default',
        userId: body.userId || null,
        type,
        format,
        filters: filters ? JSON.stringify(filters) : '{}',
        status: 'pending',
      },
    })

    return NextResponse.json({ id: job.id, status: job.status }, { status: 201 })
  } catch (error) {
    console.error('Export POST error:', error)
    return NextResponse.json({ error: 'Failed to create export job' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const jobs = await db.exportJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Export GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch export jobs' }, { status: 500 })
  }
}
