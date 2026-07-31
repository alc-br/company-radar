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

// ── POST ─────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const publishedBy = body.publishedBy || null

    const template = await db.template.findUnique({
      where: { id },
      include: { _count: { select: { versions: true } } },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    if (template.status === 'archived') {
      return NextResponse.json(
        { error: 'Templates arquivados não podem ser publicados' },
        { status: 400 }
      )
    }

    // Find the draft version (publishedAt = null)
    const draftVersion = await db.templateVersion.findFirst({
      where: { templateId: id, publishedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    if (!draftVersion) {
      return NextResponse.json(
        { error: 'Nenhuma versão em rascunho encontrada. Edite o template antes de publicar.' },
        { status: 400 }
      )
    }

    // Validate stages
    const stages = parseStages(draftVersion.stages)
    if (stages.length === 0) {
      return NextResponse.json(
        { error: 'O template deve ter pelo menos uma etapa' },
        { status: 400 }
      )
    }

    const tasksCount = countTasks(stages as Array<{ tasks?: unknown[] }>)
    if (tasksCount === 0) {
      return NextResponse.json(
        { error: 'O template deve ter pelo menos uma tarefa' },
        { status: 400 }
      )
    }

    // Validation checks
    const warnings: string[] = []
    const errors: string[] = []

    for (const stage of stages as Array<{
      name?: string;
      tasks?: Array<{
        title?: string;
        department?: string;
        role?: string;
        dueDateRule?: { type: string; value?: number };
      }>;
    }>) {
      if (!stage.name?.trim()) {
        errors.push('Uma etapa não possui nome')
      }
      if (stage.tasks) {
        for (const task of stage.tasks) {
          if (!task.title?.trim()) {
            errors.push(`Tarefa sem título na etapa "${stage.name || 'Sem nome'}"`)
          }
          if (!task.department && !task.role) {
            warnings.push(`Tarefa "${task.title || 'Sem título'}" sem departamento ou responsável atribuído`)
          }
          if (task.dueDateRule?.type === 'fixed_month_day') {
            const day = task.dueDateRule.value
            if (!day || day < 1 || day > 31) {
              errors.push(`Dia fixo inválido (${day}) na tarefa "${task.title || 'Sem título'}"`)
            }
          }
        }
      }
    }

    // If there are hard errors, return them
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
    }

    // Use a transaction to publish
    const result = await db.$transaction(async (tx) => {
      const newVersionNumber = template.currentVersion + 1

      // Update the draft version to published
      const published = await tx.templateVersion.update({
        where: { id: draftVersion.id },
        data: {
          versionNumber: newVersionNumber,
          publishedAt: new Date(),
          publishedBy,
          isCurrent: true,
          name: template.name,
          description: template.description || null,
        },
      })

      // Set all other versions' isCurrent to false
      await tx.templateVersion.updateMany({
        where: { templateId: id, id: { not: draftVersion.id } },
        data: { isCurrent: false },
      })

      // Update template
      const updated = await tx.template.update({
        where: { id },
        data: {
          status: 'published',
          currentVersion: newVersionNumber,
        },
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { versions: true, applications: true } },
        },
      })

      return { published, updated }
    })

    return NextResponse.json({
      template: result.updated,
      version: {
        id: result.published.id,
        versionNumber: result.published.versionNumber,
        publishedAt: result.published.publishedAt,
        stagesCount: stages.length,
        tasksCount,
        warnings,
      },
    })
  } catch (error) {
    console.error('Failed to publish template:', error)
    return NextResponse.json({ error: 'Erro ao publicar template' }, { status: 500 })
  }
}
