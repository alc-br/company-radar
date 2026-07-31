import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Parâmetro userId é obrigatório' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        avatar: true,
        emailVerified: true,
        activeOrgId: true,
        termsAccepted: true,
        createdAt: true,
        updatedAt: true,
        activeOrg: {
          select: {
            id: true,
            name: true,
            tradeName: true,
            cnpj: true,
            email: true,
            phone: true,
            logo: true,
            primaryColor: true,
            plan: true,
            timezone: true,
            onboardingCompleted: true,
            onboardingStep: true,
          },
        },
        memberships: {
          where: {
            organizationId: userId ? undefined : undefined,
          },
          select: {
            id: true,
            organizationId: true,
            role: true,
            status: true,
            departmentId: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Determine role from active org membership
    let role = 'collaborator'
    if (user.activeOrgId && user.memberships.length > 0) {
      const activeMembership = user.memberships.find(
        (m) => m.organizationId === user.activeOrgId
      )
      if (activeMembership) {
        role = activeMembership.role
      }
    } else if (user.memberships.length > 0) {
      role = user.memberships[0].role
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        termsAccepted: user.termsAccepted,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      activeOrg: user.activeOrg || null,
      role,
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    )
  }
}
