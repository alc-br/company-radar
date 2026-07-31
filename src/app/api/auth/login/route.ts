import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          where: { status: 'active' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Compare password with bcrypt
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Determine org and role
    let orgId = user.activeOrgId
    let role = 'collaborator'

    if (user.memberships.length > 0) {
      // Use the first active membership if no activeOrg set
      if (!orgId) {
        orgId = user.memberships[0].organizationId
      }
      // If user has an activeOrg, find the matching membership
      const membership = user.memberships.find((m) => m.organizationId === orgId)
      if (membership) {
        role = membership.role
      } else if (user.memberships.length > 0) {
        role = user.memberships[0].role
      }
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'Nenhuma organização encontrada para este usuário' },
        { status: 403 }
      )
    }

    // Build session object
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name + (user.lastName ? ' ' + user.lastName : ''),
      orgId,
      role,
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login. Tente novamente.' },
      { status: 500 }
    )
  }
}
