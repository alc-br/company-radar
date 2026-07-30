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
    return NextResponse.json(org)
  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, createdAt, updatedAt, ...updateData } = body

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
