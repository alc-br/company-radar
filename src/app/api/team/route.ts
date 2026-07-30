import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const members = await db.orgMember.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, email: true, avatar: true } },
      },
    })
    return NextResponse.json(members)
  } catch (error) {
    console.error('Get team error:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, organizationId } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const inviteToken = Buffer.from(`${Date.now()}-${Math.random().toString(36).slice(2)}`).toString('base64url')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const member = await db.orgMember.create({
      data: {
        organizationId: organizationId || 'org-default',
        name,
        email,
        role: role || 'collaborator',
        inviteToken,
        inviteExpires,
        status: 'invited',
      },
    })
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Create team member error:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, role, status, ...rest } = body

    if (!id) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status
    if (rest.name) updateData.name = rest.name

    const member = await db.orgMember.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(member)
  } catch (error) {
    console.error('Update team member error:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}
