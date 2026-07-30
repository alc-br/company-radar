import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [totalClients, activeClients, pendingTasks, overdueTasks, totalTemplates, publishedTemplates, totalDocuments, pendingDocuments] =
      await Promise.all([
        db.client.count(),
        db.client.count({ where: { status: 'active' } }),
        db.task.count({ where: { status: 'pending' } }),
        db.task.count({ where: { status: 'pending', dueDate: { lte: new Date() } } }),
        db.template.count(),
        db.template.count({ where: { isPublished: true } }),
        db.document.count(),
        db.document.count({ where: { status: 'pending' } }),
      ])

    const tasksByStatus = await db.task.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    const tasksByPriority = await db.task.groupBy({
      by: ['priority'],
      _count: { priority: true },
    })

    const clientsBySegment = await db.client.groupBy({
      by: ['segment'],
      _count: { segment: true },
    })

    const clientsByState = await db.client.groupBy({
      by: ['state'],
      _count: { state: true },
    })

    const recentTasks = await db.task.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 8,
      include: { client: { select: { name: true, tradeName: true } } },
    })

    const upcomingDeadlines = await db.task.findMany({
      where: {
        status: 'pending',
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { client: { select: { name: true } } },
    })

    const overdueTasksList = await db.task.findMany({
      where: {
        status: 'pending',
        dueDate: { lte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { client: { select: { name: true } } },
    })

    const monthlyData = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const completed = await db.task.count({
        where: { status: 'completed', updatedAt: { gte: d, lte: end } },
      })
      const created = await db.task.count({
        where: { createdAt: { gte: d, lte: end } },
      })
      monthlyData.push({
        month: d.toLocaleDateString('pt-BR', { month: 'short' }),
        completed,
        created,
      })
    }

    return NextResponse.json({
      stats: {
        totalClients,
        activeClients,
        pendingTasks,
        overdueTasks,
        totalTemplates,
        publishedTemplates,
        totalDocuments,
        pendingDocuments,
      },
      tasksByStatus: tasksByStatus.map(t => ({ status: t.status, count: t._count.status })),
      tasksByPriority: tasksByPriority.map(t => ({ priority: t.priority, count: t._count.priority })),
      clientsBySegment: clientsBySegment.map(c => ({ segment: c.segment || 'N/A', count: c._count.segment })),
      clientsByState: clientsByState.map(c => ({ state: c.state || 'N/A', count: c._count.state })),
      recentTasks,
      upcomingDeadlines,
      overdueTasksList,
      monthlyData,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
