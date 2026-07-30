import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Check email uniqueness
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = Buffer.from(password).toString('base64')

    // Create default organization
    const org = await db.organization.create({
      data: {
        id: 'org-default',
        name: `${name}'s Organization`,
        plan: 'free',
        settings: '{}',
      },
    })

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        activeOrgId: org.id,
      },
    })

    // Create owner membership
    await db.orgMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        name,
        email,
        role: 'owner',
        status: 'active',
      },
    })

    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword, organization: org }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}