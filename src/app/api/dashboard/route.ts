import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId') || ''
    const period = searchParams.get('period') || 'month'
    const departmentId = searchParams.get('departmentId') || ''
    const responsible = searchParams.get('responsible') || ''

    const orgWhere: Record<string, unknown> = {}
    if (orgId) orgWhere.organizationId = orgId

    const taskWhere: Record<string, unknown> = { ...orgWhere }
    if (departmentId) taskWhere.departmentId = departmentId
    if (responsible) taskWhere.assignedTo = responsible

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Date range based on period
    let dateFilter: { gte?: Date; lte?: Date } = {}
    if (period === 'week') {
      const startOfWeek = new Date(todayStart)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Monday
      dateFilter.gte = startOfWeek
    } else if (period === 'month') {
      dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === 'quarter') {
      const q = Math.floor(now.getMonth() / 3)
      dateFilter.gte = new Date(now.getFullYear(), q * 3, 1)
    } else if (period === 'year') {
      dateFilter.gte = new Date(now.getFullYear(), 0, 1)
    }

    const [
      activeClients,
      openTasks,
      dueTodayTasks,
      overdueTasks,
      unassignedTasks,
      pendingDocuments,
      totalCompletedOnTime,
      totalCompletedTasks,
      newClientsPeriod,
      tasksByStatus,
      tasksByPriority,
      overdueByDepartment,
      recentActivity,
    ] = await Promise.all([
      // 1. Empresas Ativas
      db.client.count({ where: { ...orgWhere, status: 'active' } }),

      // 2. Tarefas Abertas
      db.task.count({
        where: {
          ...taskWhere,
          status: { in: ['a_fazer', 'em_andamento', 'aguardando_terceiro'] },
        },
      }),

      // 3. Vencendo Hoje
      db.task.count({
        where: {
          ...taskWhere,
          status: { in: ['a_fazer', 'em_andamento', 'aguardando_terceiro'] },
          dueDate: { gte: todayStart, lte: todayEnd },
        },
      }),

      // 4. Atrasadas
      db.task.count({
        where: {
          ...taskWhere,
          status: { in: ['a_fazer', 'em_andamento', 'aguardando_terceiro'] },
          dueDate: { lt: todayStart },
        },
      }),

      // 5. Sem Responsável
      db.task.count({
        where: {
          ...taskWhere,
          status: { in: ['a_fazer', 'em_andamento', 'aguardando_terceiro'] },
          OR: [{ assignedTo: null }, { assignedTo: '' }],
        },
      }),

      // 6. Documentos Aguardando
      db.document.count({
        where: { ...orgWhere, status: 'pending' },
      }),

      // 7. Completed on time (completedAt <= dueDate)
      db.task.count({
        where: {
          ...taskWhere,
          status: 'concluida',
          completedAt: { not: null },
          dueDate: { not: null },
        },
      }),

      // 8. Total completed tasks
      db.task.count({
        where: {
          ...taskWhere,
          status: 'concluida',
        },
      }),

      // 9. New clients in period
      db.client.count({
        where: { ...orgWhere, createdAt: dateFilter },
      }),

      // Tasks grouped by status
      db.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: { status: true },
      }),

      // Tasks grouped by priority
      db.task.groupBy({
        by: ['priority'],
        where: {
          ...taskWhere,
          status: { in: ['a_fazer', 'em_andamento', 'aguardando_terceiro'] },
        },
        _count: { priority: true },
      }),

      // Overdue by department
      db.task.findMany({
        where: {
          ...taskWhere,
          status: { in: ['a_fazer', 'em_andamento', 'aguardando_terceiro'] },
          dueDate: { lt: todayStart },
          departmentId: { not: null },
        },
        select: {
          departmentId: true,
        },
      }),

      // Recent activity (audit logs)
      db.auditLog.findMany({
        where: orgWhere.organizationId ? { organizationId: orgId } : {},
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          detail: true,
          userName: true,
          createdAt: true,
        },
      }),
    ])

    // Calculate on-time rate
    // Fetch completed tasks with both completedAt and dueDate to compute on-time
    const completedWithDates = await db.task.findMany({
      where: {
        ...taskWhere,
        status: 'concluida',
        completedAt: { not: null },
        dueDate: { not: null },
      },
      select: {
        completedAt: true,
        dueDate: true,
      },
    })
    const onTimeCount = completedWithDates.filter(
      (t) => t.completedAt && t.dueDate && t.completedAt <= t.dueDate
    ).length
    const completionRate = completedWithDates.length > 0
      ? Math.round((onTimeCount / completedWithDates.length) * 100)
      : 0

    // Critical tasks: high priority + overdue or due today
    const criticalTasks = await db.task.findMany({
      where: {
        ...taskWhere,
        status: { in: ['a_fazer', 'em_andamento'] },
        priority: { in: ['high', 'urgent'] },
        OR: [
          { dueDate: { lt: todayStart } },
          { dueDate: { gte: todayStart, lte: todayEnd } },
        ],
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 8,
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
      },
    })

    // Upcoming 7 days
    const next7 = new Date(todayStart)
    next7.setDate(next7.getDate() + 7)
    const upcomingTasks = await db.task.findMany({
      where: {
        ...taskWhere,
        status: { in: ['a_fazer', 'em_andamento', 'aguardando_terceiro'] },
        dueDate: { gt: todayEnd, lte: next7 },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
      },
    })

    // Overdue task list
    const overdueTasksList = await db.task.findMany({
      where: {
        ...taskWhere,
        status: { in: ['a_fazer', 'em_andamento', 'aguardando_terceiro'] },
        dueDate: { lt: todayStart },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
      },
    })

    // Process overdue by department - get department names
    const deptIds = [...new Set(overdueByDepartment.map((t) => t.departmentId).filter(Boolean))]
    let departments: Array<{ id: string; name: string }> = []
    if (deptIds.length > 0) {
      departments = await db.department.findMany({
        where: { id: { in: deptIds } },
        select: { id: true, name: true },
      })
    }

    const deptMap = new Map(departments.map((d) => [d.id, d.name]))
    const overdueByDeptCount = overdueByDepartment.reduce((acc, t) => {
      const deptName = deptMap.get(t.departmentId) || 'Sem Departamento'
      acc[deptName] = (acc[deptName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const overdueByDept = Object.entries(overdueByDeptCount)
      .map(([name, count]) => ({ department: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Departments for filter
    const allDepartments = await db.department.findMany({
      where: orgWhere,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    // Team members for filter (from OrgMember)
    const members = await db.orgMember.findMany({
      where: orgWhere,
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      stats: {
        activeClients,
        openTasks,
        dueTodayTasks,
        overdueTasks,
        unassignedTasks,
        pendingDocuments,
        completionRate,
        newClientsPeriod,
      },
      tasksByStatus: tasksByStatus.map((t) => ({ status: t.status, count: t._count.status })),
      tasksByPriority: tasksByPriority.map((t) => ({ priority: t.priority, count: t._count.priority })),
      overdueByDepartment: overdueByDept,
      recentActivity,
      criticalTasks,
      upcomingTasks,
      overdueTasksList,
      filters: {
        departments: allDepartments,
        members,
      },
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Falha ao carregar dados do painel' }, { status: 500 })
  }
}
