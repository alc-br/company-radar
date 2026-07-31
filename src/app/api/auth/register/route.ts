import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const DEFAULT_DEPARTMENTS = [
  { name: 'Fiscal', color: '#ef4444', description: 'Departamento fiscal — SPED, guias, tributos' },
  { name: 'Contábil', color: '#3b82f6', description: 'Departamento contábil — escrituração, balanços' },
  { name: 'Pessoal', color: '#10b981', description: 'Departamento pessoal — folha, e-social, FGTS' },
  { name: 'Societário', color: '#f59e0b', description: 'Departamento societário — contratos, atas' },
  { name: 'Atendimento', color: '#8b5cf6', description: 'Departamento de atendimento ao cliente' },
]

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, lastName, email, password, termsAccepted } = body

    // ── Validations ──────────────────────────────────────
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome é obrigatório (mínimo 2 caracteres)' },
        { status: 400 }
      )
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'Você deve aceitar os termos de uso' },
        { status: 400 }
      )
    }

    // ── Check email uniqueness ───────────────────────────
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado' },
        { status: 409 }
      )
    }

    // ── Hash password ────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 10)

    const normalizedName = name.trim()
    const normalizedLastName = (lastName || '').trim()
    const normalizedEmail = email.toLowerCase().trim()
    const orgName = normalizedName + ' Contabilidade'

    // ── Create Organization ──────────────────────────────
    const org = await db.organization.create({
      data: {
        name: orgName,
        plan: 'free',
        timezone: 'America/Sao_Paulo',
        primaryColor: '#2563eb',
        settings: JSON.stringify({
          workingHours: { start: '08:00', end: '18:00' },
          workingDays: [1, 2, 3, 4, 5],
        }),
      },
    })

    // ── Create User ──────────────────────────────────────
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: normalizedName,
        lastName: normalizedLastName,
        activeOrgId: org.id,
        termsAccepted: true,
        termsVersion: '1.0.0',
      },
    })

    // ── Create OrgMember as owner ────────────────────────
    await db.orgMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        name: normalizedName + (normalizedLastName ? ' ' + normalizedLastName : ''),
        email: normalizedEmail,
        role: 'owner',
        status: 'active',
        permissions: JSON.stringify({
          all: true,
        }),
      },
    })

    // ── Create default departments ───────────────────────
    await db.department.createMany({
      data: DEFAULT_DEPARTMENTS.map((dept) => ({
        organizationId: org.id,
        ...dept,
      })),
    })

    // ── Create default plan subscription (free) ──────────
    const freePlan = await db.plan.findFirst({ where: { slug: 'essencial' } })
    if (freePlan) {
      await db.subscription.create({
        data: {
          organizationId: org.id,
          planId: freePlan.id,
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // ── Return user (without passwordHash) + org ─────────
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { user: userWithoutPassword, organization: org },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta. Tente novamente.' },
      { status: 500 }
    )
  }
}
