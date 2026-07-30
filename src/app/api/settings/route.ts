import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const org = await db.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    })
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    let settings = {}
    try {
      settings = JSON.parse(org.settings)
    } catch {
      settings = {}
    }

    return NextResponse.json({ ...org, settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const org = await db.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    })
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { settings: newSettings, ...orgFields } = body

    const updateData: Record<string, unknown> = { ...orgFields }
    if (newSettings) {
      updateData.settings = JSON.stringify(newSettings)
    }

    const updated = await db.organization.update({
      where: { id: org.id },
      data: updateData,
    })

    let settings = {}
    try {
      settings = JSON.parse(updated.settings)
    } catch {
      settings = {}
    }

    return NextResponse.json({ ...updated, settings })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}