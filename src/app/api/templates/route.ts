import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (category) where.category = category

    const templates = await db.template.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(templates)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const template = await db.template.create({
      data: {
        organizationId: body.organizationId || 'org-default',
        name: body.name,
        description: body.description,
        category: body.category,
        department: body.department,
        steps: JSON.stringify(body.steps || []),
        isPublished: body.isPublished || false,
      },
    })
    return NextResponse.json(template, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 })
  }
}
