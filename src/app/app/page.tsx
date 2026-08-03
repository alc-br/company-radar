'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  CheckSquare,
  AlertTriangle,
  Clock,
  UserX,
  FileText,
  TrendingUp,
  UserPlus,
  ArrowRight,
  Calendar,
  AlertCircle,
  Activity,
  ChevronDown,
  Loader2,
  Flame,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface DashboardStats {
  activeClients: number
  openTasks: number
  dueTodayTasks: number
  overdueTasks: number
  unassignedTasks: number
  pendingDocuments: number
  completionRate: number
  newClientsPeriod: number
}

interface TaskItem {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  client: { id: string; name: string; tradeName: string | null }
}

interface RecentActivityItem {
  id: string
  action: string
  entity: string | null
  entityId: string | null
  detail: string | null
  userName: string | null
  createdAt: string
}

interface DashboardData {
  stats: DashboardStats
  tasksByStatus: Array<{ status: string; count: number }>
  tasksByPriority: Array<{ priority: string; count: number }>
  overdueByDepartment: Array<{ department: string; count: number }>
  recentActivity: RecentActivityItem[]
  criticalTasks: TaskItem[]
  upcomingTasks: TaskItem[]
  overdueTasksList: TaskItem[]
  filters: {
    departments: Array<{ id: string; name: string }>
    members: Array<{ id: string; name: string; email: string }>
  }
}

// ── Helpers ────────────────────────────────────────────────
function getOrgId(): string {
  try {
    const s = JSON.parse(localStorage.getItem('cr_session') || '{}')
    return s.orgId || ''
  } catch {
    return ''
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d atrás`
  return formatDate(dateStr)
}

function getPriorityColor(p: string) {
  if (p === 'urgent') return 'bg-red-100 text-red-700 border-red-200'
  if (p === 'high') return 'bg-orange-100 text-orange-700 border-orange-200'
  if (p === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function getPriorityLabel(p: string) {
  if (p === 'urgent') return 'Urgente'
  if (p === 'high') return 'Alta'
  if (p === 'medium') return 'Média'
  return 'Baixa'
}

function getActionLabel(action: string) {
  const map: Record<string, string> = {
    create: 'criou',
    update: 'atualizou',
    delete: 'excluiu',
    complete: 'concluiu',
    login: 'fez login',
  }
  return map[action] || action
}

function getEntityLabel(entity: string | null) {
  const map: Record<string, string> = {
    task: 'tarefa',
    client: 'empresa',
    document: 'documento',
    template: 'template',
    user: 'usuário',
  }
  return map[entity || ''] || entity || 'item'
}

// ── Stat Card Component ────────────────────────────────────
const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4']

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  loading,
  href,
  onClick,
}: {
  icon: React.ElementType
  label: string
  value: number
  sub?: string
  color: string
  loading?: boolean
  href?: string
  onClick?: () => void
}) {
  const content = (
    <Card
      className={`group cursor-pointer border border-transparent transition-all duration-200 hover:shadow-md hover:border-border ${
        value > 0 && (label === 'Atrasadas' || label === 'Vencendo Hoje') ? 'ring-1 ring-red-200 bg-red-50/40' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          {href && (
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </div>
        <div className="mt-3">
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value.toLocaleString('pt-BR')}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

// ── Main Dashboard ─────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState('month')
  const [departmentId, setDepartmentId] = useState('all')
  const [responsible, setResponsible] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const orgId = getOrgId()
      const params = new URLSearchParams()
      if (orgId) params.set('orgId', orgId)
      if (period) params.set('period', period)
      if (departmentId && departmentId !== 'all') params.set('departmentId', departmentId)
      if (responsible && responsible !== 'all') params.set('responsible', responsible)

      const res = await fetch(`/api/dashboard?${params.toString()}`)
      if (!res.ok) throw new Error('Erro')
      const json = await res.json()
      setData(json)
    } catch {
      setError(true)
      toast.error('Falha ao carregar dados do painel.')
    } finally {
      setLoading(false)
    }
  }, [period, departmentId, responsible])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Attention items count
  const attentionCount = data
    ? data.stats.dueTodayTasks + data.stats.overdueTasks + data.stats.unassignedTasks
    : 0

  const deptChartConfig = {
    count: { label: 'Atrasos', color: '#ef4444' },
  }

  return (
    <div className="space-y-6">
      {/* Page Header + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">
            Resumo da operação do seu escritório
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          {data && data.filters.departments.length > 0 && (
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                {data.filters.departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {data && data.filters.members.length > 0 && (
            <Select value={responsible} onValueChange={setResponsible}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Responsáveis</SelectItem>
                {data.filters.members.map((m) => (
                  <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && !data && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Não foi possível carregar os dados.</p>
            <Button variant="outline" className="mt-4" onClick={fetchData}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Empresas Ativas"
          value={data?.stats.activeClients ?? 0}
          color="#2563eb"
          loading={loading}
          href="/app/empresas"
        />
        <StatCard
          icon={CheckSquare}
          label="Tarefas Abertas"
          value={data?.stats.openTasks ?? 0}
          color="#8b5cf6"
          loading={loading}
          href="/app/tarefas"
        />
        <StatCard
          icon={Clock}
          label="Vencendo Hoje"
          value={data?.stats.dueTodayTasks ?? 0}
          color="#f97316"
          loading={loading}
          href="/app/tarefas?due=today"
        />
        <StatCard
          icon={AlertTriangle}
          label="Atrasadas"
          value={data?.stats.overdueTasks ?? 0}
          color="#ef4444"
          loading={loading}
          href="/app/tarefas?status=overdue"
        />
        <StatCard
          icon={UserX}
          label="Sem Responsável"
          value={data?.stats.unassignedTasks ?? 0}
          color="#6b7280"
          loading={loading}
          href="/app/tarefas?unassigned=true"
        />
        <StatCard
          icon={FileText}
          label="Documentos Aguardando"
          value={data?.stats.pendingDocuments ?? 0}
          color="#0891b2"
          loading={loading}
          href="/app/documentos"
        />
        <StatCard
          icon={TrendingUp}
          label="Taxa Conclusão no Prazo"
          value={data?.stats.completionRate ?? 0}
          sub={`${data?.stats.completionRate ?? 0}% das tarefas concluídas dentro do prazo`}
          color="#22c55e"
          loading={loading}
          href="/app/relatorios"
        />
        <StatCard
          icon={UserPlus}
          label="Novos Clientes"
          value={data?.stats.newClientsPeriod ?? 0}
          color="#ec4899"
          loading={loading}
          href="/app/empresas"
        />
      </div>

      {/* Middle Row: Attention + Critical Tasks */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* O que exige atenção hoje */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-4 w-4 text-orange-500" />
                O que exige atenção hoje
              </CardTitle>
              {attentionCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {attentionCount} {attentionCount === 1 ? 'item' : 'itens'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data || attentionCount === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Nada exige atenção no momento 🎉
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Todas as tarefas estão em dia.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-2">
                  {/* Due Today */}
                  {data.stats.dueTodayTasks > 0 && (
                    <Link
                      href="/app/tarefas?due=today"
                      className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50/50 p-3 transition-colors hover:bg-orange-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{data.stats.dueTodayTasks} tarefa(s) vencendo hoje</p>
                        <p className="text-xs text-muted-foreground">Requer ação imediata</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-orange-400" />
                    </Link>
                  )}
                  {/* Overdue */}
                  {data.stats.overdueTasks > 0 && (
                    <Link
                      href="/app/tarefas?status=overdue"
                      className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/50 p-3 transition-colors hover:bg-red-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{data.stats.overdueTasks} tarefa(s) atrasada(s)</p>
                        <p className="text-xs text-muted-foreground">Prazos já ultrapassados</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-red-400" />
                    </Link>
                  )}
                  {/* Unassigned */}
                  {data.stats.unassignedTasks > 0 && (
                    <Link
                      href="/app/tarefas?unassigned=true"
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                        <UserX className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{data.stats.unassignedTasks} sem responsável</p>
                        <p className="text-xs text-muted-foreground">Precisam ser atribuídas</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  )}
                  {/* Pending Documents */}
                  {data.stats.pendingDocuments > 0 && (
                    <Link
                      href="/app/documentos"
                      className="flex items-center gap-3 rounded-lg border border-cyan-200 bg-cyan-50/50 p-3 transition-colors hover:bg-cyan-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100">
                        <FileText className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{data.stats.pendingDocuments} documento(s) aguardando</p>
                        <p className="text-xs text-muted-foreground">Aguardando envio ou aprovação</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-cyan-400" />
                    </Link>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Tarefas Críticas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Tarefas Críticas
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/app/tarefas?priority=high">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            <CardDescription>Alta prioridade · Atrasadas ou vencendo hoje</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : !data || data.criticalTasks.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Nenhuma tarefa crítica
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sem tarefas urgentes atrasadas ou vencendo hoje.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-1">
                  {data.criticalTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/app/tarefas?id=${task.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50 group"
                    >
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          task.priority === 'urgent' ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium group-hover:text-[#2563eb]">
                          {task.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {task.client.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Upcoming + Overdue by Dept + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Próximos 7 dias */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-[#2563eb]" />
                Próximos 7 dias
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/app/calendario">Ver calendário <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data || data.upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Calendar className="h-6 w-6 text-[#2563eb]" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Nenhuma tarefa nos próximos 7 dias
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-1">
                  {data.upcomingTasks.map((task) => {
                    const daysLeft = task.dueDate
                      ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / 86400000)
                      : null
                    return (
                      <Link
                        key={task.id}
                        href={`/app/tarefas?id=${task.id}`}
                        className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50 group"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-[#2563eb]">
                          {daysLeft !== null ? daysLeft : '?'}d
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium group-hover:text-[#2563eb]">
                            {task.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {task.client.name}
                          </p>
                        </div>
                        {task.dueDate && (
                          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Atrasos por Departamento */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Atrasos por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-end justify-center gap-2 h-48">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-8 rounded-t" />
                ))}
              </div>
            ) : !data || data.overdueByDepartment.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Sem atrasos por departamento
                </p>
              </div>
            ) : (
              <ChartContainer config={deptChartConfig} className="h-56 w-full">
                <BarChart data={data.overdueByDepartment} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.overdueByDepartment.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-[#2563eb]" />
                Atividade Recente
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/app/relatorios">Ver tudo <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data || data.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Nenhuma atividade recente
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  As ações da equipe aparecerão aqui.
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-72">
                <div className="space-y-3">
                  {data.recentActivity.map((item) => {
                    const initials = item.userName
                      ? item.userName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'S'
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563eb]/10 text-[10px] font-semibold text-[#2563eb]">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">
                            <span className="font-medium">{item.userName || 'Sistema'}</span>{' '}
                            <span className="text-muted-foreground">{getActionLabel(item.action)}</span>{' '}
                            {item.detail || getEntityLabel(item.entity)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
