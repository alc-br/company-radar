import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ──────────────────────────────────────────────────
function parseStages(stagesJson: string | null): Array<{ tasks?: unknown[] }> {
  if (!stagesJson) return []
  try { return JSON.parse(stagesJson) } catch { return [] }
}

function countTasks(stages: Array<{ tasks?: unknown[] }>): number {
  return stages.reduce((acc, s) => acc + (s.tasks?.length || 0), 0)
}

// ── GET ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const author = searchParams.get('author') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { code: { contains: search } },
      ]
    }
    if (category) where.category = category
    if (status) where.status = status
    if (author) where.responsibleId = author

    const templates = await db.template.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { versions: true, applications: true, tasks: true } },
      },
    })

    // Get responsible member names
    const responsibleIds = [...new Set(templates.map((t) => t.responsibleId).filter(Boolean))] as string[]
    let memberMap: Record<string, string> = {}
    if (responsibleIds.length > 0) {
      const members = await db.orgMember.findMany({
        where: { id: { in: responsibleIds } },
        select: { id: true, name: true },
      })
      members.forEach((m) => { memberMap[m.id] = m.name })
    }

    // Get version info for stage/task counts from the working version
    const templateIds = templates.map((t) => t.id)
    let versionMap: Record<string, { stages: string | null }> = {}
    if (templateIds.length > 0) {
      const draftVersions = await db.templateVersion.findMany({
        where: { templateId: { in: templateIds }, publishedAt: null },
        orderBy: { createdAt: 'desc' },
        select: { templateId: true, stages: true },
      })
      const hasDraft = new Set(draftVersions.map((v) => v.templateId))
      const currentVersions = await db.templateVersion.findMany({
        where: { templateId: { in: templateIds.filter((id) => !hasDraft.has(id)) }, isCurrent: true },
        select: { templateId: true, stages: true },
      })
      const allVersions = [...draftVersions, ...currentVersions]
      const seen = new Set<string>()
      for (const v of allVersions) {
        if (!seen.has(v.templateId)) {
          seen.add(v.templateId)
          versionMap[v.templateId] = { stages: v.stages }
        }
      }
    }

    const result = templates.map((t) => {
      const vInfo = versionMap[t.id]
      const stages = parseStages(vInfo?.stages || null)
      return {
        ...t,
        responsibleName: t.responsibleId ? (memberMap[t.responsibleId] || null) : null,
        tasksCount: countTasks(stages),
        stagesCount: stages.length,
        versionCount: t._count.versions,
        applicationCount: t._count.applications,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 })
  }
}

// ── POST ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      code,
      description,
      purpose,
      category,
      color,
      icon,
      departmentId,
      responsibleId,
      instructions,
      warning,
      defaultPeriodicity,
      variables,
      stages,
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Parse variables
    let varsStr = '[]'
    if (variables) {
      varsStr = typeof variables === 'string' ? variables : JSON.stringify(variables)
    }

    // Parse stages
    let stagesStr: string | null = null
    if (stages) {
      stagesStr = typeof stages === 'string' ? stages : JSON.stringify(stages)
    }

    const orgId = organizationId || 'org-default'

    const template = await db.template.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
        purpose: purpose?.trim() || null,
        category: category || null,
        color: color || '#2563eb',
        icon: icon || null,
        departmentId: departmentId || null,
        responsibleId: responsibleId || null,
        instructions: instructions?.trim() || null,
        warning: warning?.trim() || null,
        defaultPeriodicity: defaultPeriodicity || null,
        variables: varsStr,
        status: 'draft',
        currentVersion: 0,
      },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { versions: true, applications: true } },
      },
    })

    // If stages are provided, create a draft TemplateVersion
    if (stagesStr) {
      const parsed = parseStages(stagesStr)
      if (parsed.length > 0) {
        await db.templateVersion.create({
          data: {
            organizationId: orgId,
            templateId: template.id,
            versionNumber: template.currentVersion + 1,
            name: template.name,
            description: template.description || null,
            stages: stagesStr,
            isCurrent: false,
          },
        })
      }
    }

    return NextResponse.json(template, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to create template:', error)
    const msg = error instanceof Error && error.message.includes('Unique')
      ? 'Já existe um template com esse código'
      : 'Erro ao criar template'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
