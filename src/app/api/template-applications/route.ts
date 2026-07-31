import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Stage {
  name: string
  tasks: StageTask[]
}

interface StageTask {
  title: string
  description?: string
  daysOffset?: number
  priority?: string
  department?: string
  role?: string
  checklist?: Array<{ text: string; required?: boolean }>
  documents?: Array<{ name: string; required?: boolean }>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, clientId, baseDate, variables, roleMappings } = body

    if (!templateId || !clientId || !baseDate) {
      return NextResponse.json(
        { error: 'templateId, clientId e baseDate são obrigatórios' },
        { status: 400 }
      )
    }

    // Fetch the template version with stages
    const templateVersionId = body.templateVersionId

    // Get the template
    const template = await db.template.findUnique({
      where: { id: templateId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Determine which version to use
    let version = templateVersionId
      ? template.versions.find(v => v.id === templateVersionId)
      : template.versions.find(v => v.isCurrent) || template.versions[0]

    if (!version) {
      return NextResponse.json({ error: 'Versão do template não encontrada' }, { status: 404 })
    }

    // Parse stages from version
    let stages: Stage[] = []
    try {
      stages = JSON.parse(version.stages || '[]')
    } catch {
      stages = []
    }

    // Parse role mappings
    let mappings: Record<string, string> = {}
    try {
      mappings = roleMappings ? JSON.parse(roleMappings) : {}
    } catch {
      mappings = {}
    }

    // Resolve member names from IDs
    const memberIds = new Set<string>(Object.values(mappings))
    const memberMap = new Map<string, string>()
    if (memberIds.size > 0) {
      const members = await db.orgMember.findMany({
        where: { id: { in: Array.from(memberIds) } },
        select: { id: true, name: true },
      })
      members.forEach(m => memberMap.set(m.id, m.name))
    }

    // Parse variables for string interpolation
    let vars: Record<string, string> = {}
    try {
      vars = variables ? JSON.parse(variables) : {}
    } catch {
      vars = {}
    }

    // Interpolate variables in strings
    function interpolate(text: string): string {
      let result = text
      for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      }
      return result
    }

    // Calculate due date from base date and offset
    function calcDueDate(daysOffset?: number): Date | null {
      if (!daysOffset && daysOffset !== 0) return null
      const d = new Date(baseDate)
      d.setDate(d.getDate() + daysOffset)
      return d
    }

    // Resolve assigned user
    function resolveAssignee(role?: string, department?: string): { assignedTo: string | null; assignedToId: string | null } {
      if (role && mappings[role]) {
        return {
          assignedTo: memberMap.get(mappings[role]) || null,
          assignedToId: mappings[role],
        }
      }
      if (department && mappings[`dept_${department}`]) {
        return {
          assignedTo: memberMap.get(mappings[`dept_${department}`]) || null,
          assignedToId: mappings[`dept_${department}`],
        }
      }
      return { assignedTo: null, assignedToId: null }
    }

    // ── Execute in a transaction ──────────────────────────────
    const result = await db.$transaction(async (tx) => {
      // 1. Create TemplateApplication
      const application = await tx.templateApplication.create({
        data: {
          organizationId: template.organizationId,
          templateId,
          templateVersionId: version.id,
          clientId,
          baseDate,
          variables: variables || '{}',
          status: 'active',
        },
      })

      // 2. Create tasks from stages
      const createdTasks: Array<{
        id: string
        title: string
        stageIndex: number
        taskIndex: number
        dueDate: Date | null
      }> = []

      for (let si = 0; si < stages.length; si++) {
        const stage = stages[si]
        if (!stage.tasks) continue

        for (let ti = 0; ti < stage.tasks.length; ti++) {
          const task = stage.tasks[ti]
          const dueDate = calcDueDate(task.daysOffset)
          const { assignedTo, assignedToId } = resolveAssignee(task.role, task.department)

          const created = await tx.task.create({
            data: {
              organizationId: template.organizationId,
              clientId,
              title: interpolate(task.title),
              description: task.description ? interpolate(task.description) : null,
              status: 'a_fazer',
              priority: task.priority || 'medium',
              dueDate,
              assignedTo,
              assignedToId,
              templateId,
              templateVersionId: version.id,
              templateApplicationId: application.id,
              templateStageIndex: si,
              templateTaskIndex: ti,
              category: stage.name || null,
            },
          })

          createdTasks.push({
            id: created.id,
            title: created.title,
            stageIndex: si,
            taskIndex: ti,
            dueDate,
          })

          // 3. Create checklist items for this task
          if (task.checklist && Array.isArray(task.checklist) && task.checklist.length > 0) {
            await tx.taskChecklist.createMany({
              data: task.checklist.map((item, idx) => ({
                taskId: created.id,
                text: interpolate(item.text),
                required: item.required || false,
                order: idx,
              })),
            })
          }
        }
      }

      return {
        application,
        tasksCount: createdTasks.length,
        tasks: createdTasks,
      }
    })

    return NextResponse.json({
      id: result.application.id,
      templateId,
      clientId,
      baseDate,
      status: 'active',
      tasksCreated: result.tasksCount,
      tasks: result.tasks.map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate?.toISOString() || null,
        stage: t.stageIndex,
      })),
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to apply template:', error)
    const message = error instanceof Error ? error.message : 'Erro ao aplicar template'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
