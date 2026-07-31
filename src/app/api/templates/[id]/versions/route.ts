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
      select: { id: true, name: true, currentVersion: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    const versions = await db.templateVersion.findMany({
      where: { templateId: id },
      orderBy: { versionNumber: 'desc' },
      include: {
        _count: { select: { applications: true } },
      },
    })

    // Get publisher names
    const publisherIds = [...new Set(versions.map((v) => v.publishedBy).filter(Boolean))] as string[]
    let publisherMap: Record<string, string> = {}
    if (publisherIds.length > 0) {
      const members = await db.orgMember.findMany({
        where: { id: { in: publisherIds } },
        select: { id: true, name: true },
      })
      const users = await db.user.findMany({
        where: { id: { in: publisherIds } },
        select: { id: true, name: true },
      })
      members.forEach((m) => { publisherMap[m.id] = m.name })
      users.forEach((u) => { publisherMap[u.id] = u.name })
    }

    const result = versions.map((v) => {
      const stages = parseStages(v.stages)
      return {
        id: v.id,
        versionNumber: v.versionNumber,
        name: v.name,
        description: v.description,
        publishedAt: v.publishedAt,
        publishedBy: v.publishedBy,
        publishedByName: v.publishedBy ? (publisherMap[v.publishedBy] || null) : null,
        isCurrent: v.isCurrent,
        isDraft: !v.publishedAt,
        stagesCount: stages.length,
        tasksCount: countTasks(stages as Array<{ tasks?: unknown[] }>),
        applicationsCount: v._count.applications,
        createdAt: v.createdAt,
      }
    })

    return NextResponse.json({
      template: { id: template.id, name: template.name, currentVersion: template.currentVersion },
      versions: result,
    })
  } catch (error) {
    console.error('Failed to fetch versions:', error)
    return NextResponse.json({ error: 'Erro ao buscar versões' }, { status: 500 })
  }
}
