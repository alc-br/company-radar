import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include') || ''

    const org = await db.organization.findFirst({
      orderBy: { createdAt: 'asc' },
      ...(include === 'subscription'
        ? {
            include: {
              subscription: {
                include: {
                  plan: true,
                },
              },
              _count: {
                select: { clients: true, members: true, documents: true, tasks: true },
              },
            },
          }
        : {}),
    })

    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    if (include === 'subscription') {
      let settings = {}
      try { settings = JSON.parse(org.settings) } catch { settings = {} }
      return NextResponse.json({ ...org, settings })
    }

    return NextResponse.json(org)
  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, createdAt, updatedAt, settings: newSettings, ...updateData } = body

    if (newSettings) {
      updateData.settings = JSON.stringify(newSettings)
    }

    const org = await db.organization.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(org)
  } catch (error) {
    console.error('Update organization error:', error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}
