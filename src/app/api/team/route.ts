import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include') || ''
    const status = searchParams.get('status') || ''
    const departmentId = searchParams.get('departmentId') || ''

    if (include === 'departments') {
      const departments = await db.department.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { members: true, templates: true } } },
      })
      return NextResponse.json(departments)
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (departmentId) where.departmentId = departmentId

    const members = await db.orgMember.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, email: true, avatar: true } },
        department: { select: { id: true, name: true, color: true } },
        businessUnit: { select: { id: true, name: true } },
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
    const { name, email, role, organizationId, departmentId } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const inviteToken = Buffer.from(`${Date.now()}-${Math.random().toString(36).slice(2)}`).toString('base64url')
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const member = await db.orgMember.create({
      data: {
        organizationId: organizationId || 'org-default',
        name, email,
        role: role || 'collaborator',
        departmentId: departmentId || null,
        inviteToken, inviteExpires,
        status: 'invited',
      },
      include: {
        department: { select: { id: true, name: true, color: true } },
        businessUnit: { select: { id: true, name: true } },
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
    const { id, role, status, departmentId, ...rest } = body

    if (!id) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status
    if (departmentId !== undefined) updateData.departmentId = departmentId
    if (rest.name) updateData.name = rest.name

    const member = await db.orgMember.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true, color: true } },
        businessUnit: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(member)
  } catch (error) {
    console.error('Update team member error:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}
