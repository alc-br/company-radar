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
      include: {
        department: { select: { id: true, name: true, description: true } },
        _count: { select: { tasks: true } },
      },
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { department, _count, tasks, ...templateData } = body

    const template = await db.template.create({
      data: {
        organizationId: templateData.organizationId || 'org-default',
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        departmentId: templateData.departmentId || null,
        isPublished: templateData.isPublished || false,
        version: templateData.version || 1,
        parentTemplateId: templateData.parentTemplateId || null,
        steps: JSON.stringify(templateData.steps || []),
      },
      include: {
        department: { select: { id: true, name: true, description: true } },
        _count: { select: { tasks: true } },
      },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
