import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ──────────────────────────────────────────────────
function parseStages(stagesJson: string | null): unknown[] {
  if (!stagesJson) return []
  try { return JSON.parse(stagesJson) } catch { return [] }
}

function countTasks(stages: Array<{ tasks?: unknown[] }>): number {
  return stages.reduce((acc, s) => acc + (s.tasks?.length || 0), 0)
}

// ── GET ──────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await db.template.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { versions: true, applications: true } },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Get responsible name
    let responsibleName: string | null = null
    if (template.responsibleId) {
      const member = await db.orgMember.findUnique({
        where: { id: template.responsibleId },
        select: { name: true },
      })
      responsibleName = member?.name || null
    }

    // Get stages: prefer draft version (publishedAt=null), then current version
    const draftVersion = await db.templateVersion.findFirst({
      where: { templateId: id, publishedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    let stages: unknown[] = []
    let workingVersionId: string | null = null

    if (draftVersion) {
      stages = parseStages(draftVersion.stages)
      workingVersionId = draftVersion.id
    } else {
      const currentVersion = await db.templateVersion.findFirst({
        where: { templateId: id, isCurrent: true },
      })
      if (currentVersion) {
        stages = parseStages(currentVersion.stages)
        workingVersionId = currentVersion.id
      }
    }

    // Get applications with client info
    const applications = await db.templateApplication.findMany({
      where: { templateId: id },
      include: {
        client: { select: { id: true, name: true, cnpj: true } },
        templateVersion: { select: { id: true, versionNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      ...template,
      responsibleName,
      stages,
      workingVersionId,
      stagesCount: stages.length,
      tasksCount: countTasks(stages as Array<{ tasks?: unknown[] }>),
      versionCount: template._count.versions,
      applicationCount: template._count.applications,
      applications: applications.map((a) => ({
        id: a.id,
        baseDate: a.baseDate,
        status: a.status,
        createdAt: a.createdAt,
        client: a.client,
        version: a.templateVersion,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch template:', error)
    return NextResponse.json({ error: 'Erro ao buscar template' }, { status: 500 })
  }
}

// ── PUT ──────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.template.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Allow status change for archiving, but block other edits on non-draft
    const body = await request.json()
    const isStatusChange = body.status !== undefined && Object.keys(body).length === 1

    if (existing.status !== 'draft' && !isStatusChange) {
      return NextResponse.json(
        { error: 'Apenas templates em rascunho podem ser editados' },
        { status: 400 }
      )
    }

    const {
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
      status,
    } = body

    // Parse variables
    let varsStr = existing.variables
    if (variables !== undefined) {
      varsStr = typeof variables === 'string' ? variables : JSON.stringify(variables)
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (code !== undefined) updateData.code = code?.trim() || null
    if (description !== undefined) updateData.description = description?.trim() || null
    if (purpose !== undefined) updateData.purpose = purpose?.trim() || null
    if (category !== undefined) updateData.category = category || null
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon || null
    if (departmentId !== undefined) updateData.departmentId = departmentId || null
    if (responsibleId !== undefined) updateData.responsibleId = responsibleId || null
    if (instructions !== undefined) updateData.instructions = instructions?.trim() || null
    if (warning !== undefined) updateData.warning = warning?.trim() || null
    if (defaultPeriodicity !== undefined) updateData.defaultPeriodicity = defaultPeriodicity || null
    if (variables !== undefined) updateData.variables = varsStr
    if (status !== undefined) updateData.status = status

    const updated = await db.template.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { versions: true, applications: true } },
      },
    })

    // Update or create draft version with stages
    if (stages !== undefined && existing.status === 'draft') {
      const stagesStr = typeof stages === 'string' ? stages : JSON.stringify(stages)

      const draftVersion = await db.templateVersion.findFirst({
        where: { templateId: id, publishedAt: null },
        orderBy: { createdAt: 'desc' },
      })

      if (draftVersion) {
        await db.templateVersion.update({
          where: { id: draftVersion.id },
          data: { stages: stagesStr },
        })
      } else {
        await db.templateVersion.create({
          data: {
            organizationId: existing.organizationId,
            templateId: id,
            versionNumber: existing.currentVersion + 1,
            name: updated.name,
            description: updated.description || null,
            stages: stagesStr,
            isCurrent: false,
          },
        })
      }
    }

    return NextResponse.json(updated)
  } catch (error: unknown) {
    console.error('Failed to update template:', error)
    const msg = error instanceof Error && error.message.includes('Unique')
      ? 'Já existe um template com esse código'
      : 'Erro ao atualizar template'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ── DELETE ───────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.template.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Check if template has active applications
    const appCount = await db.templateApplication.count({
      where: { templateId: id, status: 'active' },
    })

    if (appCount > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: ${appCount} aplicação(ões) ativa(s) usando este template` },
        { status: 400 }
      )
    }

    await db.template.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete template:', error)
    return NextResponse.json({ error: 'Erro ao excluir template' }, { status: 500 })
  }
}
