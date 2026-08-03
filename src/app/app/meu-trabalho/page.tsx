'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Hourglass,
  CheckCircle2,
  Filter,
  ArrowRight,
  AlertCircle,
  Loader2,
  Inbox,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { PageTour, TourRestartButton, usePageTour, type TourStep } from '@/components/page-tour'

const MEUTRABALHO_TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="mt-header"]', title: 'Meu Trabalho', description: 'Suas próprias tarefas atribuídas, organizadas por urgência — sua visão pessoal do que fazer.' },
  { selector: '[data-tour="mt-tabs"]', title: 'Categorias', description: 'Hoje, Atrasadas, Próximas, Aguardando Terceiro e Concluídas — cada aba filtra suas tarefas por essa situação.' },
]

// ── Types ──────────────────────────────────────────────────
interface TaskItem {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  completedAt: string | null
  assignedTo: string | null
  clientId: string
  client: { id: string; name: string; tradeName: string | null }
  subtaskCount?: number
  checklistCount?: number
  commentCount?: number
}

// ── Helpers ────────────────────────────────────────────────
function getSession() {
  try {
    return JSON.parse(localStorage.getItem('cr_session') || '{}')
  } catch {
    return {}
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

function getDaysUntilDue(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
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
  if (p === 'medium') return 'Media'
  return 'Baixa'
}

function getDueDateInfo(dateStr: string | null) {
  if (!dateStr) return { text: 'Sem prazo', className: 'text-muted-foreground' }
  const days = getDaysUntilDue(dateStr)
  if (days === null) return { text: 'Sem prazo', className: 'text-muted-foreground' }
  if (days < 0) return { text: 'Atrasada ' + Math.abs(days) + 'd', className: 'text-red-600 font-medium' }
  if (days === 0) return { text: 'Hoje', className: 'text-orange-600 font-medium' }
  if (days === 1) return { text: 'Amanha', className: 'text-amber-600' }
  if (days <= 3) return { text: 'Em ' + days + ' dias', className: 'text-amber-600' }
  return { text: formatDate(dateStr), className: 'text-muted-foreground' }
}

// ── Empty State ────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-xs">{description}</p>
      {actionLabel && actionHref && (
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  )
}

// ── Task Card Skeleton ──────────────────────────────────────
function TaskCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

// ── Task Card ──────────────────────────────────────────────
function TaskCard({
  task,
  onComplete,
  completing,
}: {
  task: TaskItem
  onComplete: (id: string) => void
  completing: string | null
}) {
  const dueDateInfo = getDueDateInfo(task.dueDate)
  const overdue = isOverdue(task.dueDate)
  const today = isToday(task.dueDate)
  const isCompleting = completing === task.id

  const borderColor = overdue
    ? 'border-red-200 bg-red-50/30'
    : today
      ? 'border-orange-200 bg-orange-50/30'
      : 'border-border bg-white'

  return (
    <div className={"group flex items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-sm " + borderColor}>
      <div className="pt-0.5">
        <button
          onClick={() => onComplete(task.id)}
          disabled={isCompleting}
          className="flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 transition-colors hover:border-[#2563eb] hover:bg-[#2563eb]/10 disabled:opacity-50"
          aria-label={"Marcar como concluida"}
        >
          {isCompleting && <Loader2 className="h-3 w-3 animate-spin text-[#2563eb]" />}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={"/app/tarefas?id=" + task.id}
            className="text-sm font-medium leading-snug hover:text-[#2563eb] transition-colors line-clamp-2"
          >
            {task.title}
          </Link>
          <Badge variant="outline" className={"shrink-0 text-[10px] " + getPriorityColor(task.priority)}>
            {getPriorityLabel(task.priority)}
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={"/app/empresas?id=" + task.client.id}
            className="text-xs text-muted-foreground hover:text-[#2563eb] transition-colors truncate max-w-[200px]"
          >
            {task.client.name}
          </Link>
          {task.client.name && task.dueDate && (
            <span className="text-muted-foreground/30">·</span>
          )}
          {task.dueDate && (
            <span className={"text-xs flex items-center gap-1 " + dueDateInfo.className}>
              <Clock className="h-3 w-3" />
              {dueDateInfo.text}
            </span>
          )}
        </div>

        {(task.subtaskCount || task.checklistCount || task.commentCount) && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            {task.subtaskCount ? <span>{task.subtaskCount} subtarefas</span> : null}
            {task.checklistCount ? <span>{task.checklistCount} itens no checklist</span> : null}
            {task.commentCount ? <span>{task.commentCount} comentarios</span> : null}
          </div>
        )}
      </div>

      <Link
        href={"/app/tarefas?id=" + task.id}
        className="mt-1 shrink-0 rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-muted group-hover:opacity-100"
        aria-label="Abrir tarefa"
      >
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function MeuTrabalhoPage() {
  const { active: tourActive, start: startTour, finish: finishTour } = usePageTour('meu-trabalho')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('hoje')
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('myQueue', 'true')
      params.set('limit', '200')
      params.set('parentId', '')

      const res = await fetch('/api/tasks?' + params.toString())
      if (!res.ok) throw new Error('Erro')
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Falha ao carregar suas tarefas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  async function handleComplete(taskId: string) {
    setCompleting(taskId)
    try {
      const res = await fetch('/api/tasks/' + taskId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'concluida', completedAt: new Date().toISOString() }),
      })
      if (res.ok) {
        toast.success('Tarefa concluida!')
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
      } else {
        toast.error('Nao foi possivel concluir a tarefa.')
      }
    } catch {
      toast.error('Erro de conexao.')
    } finally {
      setCompleting(null)
    }
  }

  const filteredTasks = tasks.filter((t) => {
    switch (activeTab) {
      case 'hoje':
        return t.status !== 'concluida' && t.status !== 'cancelada' && isToday(t.dueDate)
      case 'atrasadas':
        return t.status !== 'concluida' && t.status !== 'cancelada' && isOverdue(t.dueDate)
      case 'proximas':
        return t.status !== 'concluida' && t.status !== 'cancelada' && !isOverdue(t.dueDate) && !isToday(t.dueDate) && t.dueDate
      case 'aguardando':
        return t.status === 'aguardando_terceiro'
      case 'concluidas':
        return t.status === 'concluida' && t.completedAt
      default:
        return t.status !== 'concluida' && t.status !== 'cancelada'
    }
  })

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aOverdue = isOverdue(a.dueDate) ? 0 : 1
    const bOverdue = isOverdue(b.dueDate) ? 0 : 1
    if (aOverdue !== bOverdue) return aOverdue - bOverdue
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
  })

  const tabCounts = {
    hoje: tasks.filter((t) => t.status !== 'concluida' && t.status !== 'cancelada' && isToday(t.dueDate)).length,
    atrasadas: tasks.filter((t) => t.status !== 'concluida' && t.status !== 'cancelada' && isOverdue(t.dueDate)).length,
    proximas: tasks.filter((t) => t.status !== 'concluida' && t.status !== 'cancelada' && !isOverdue(t.dueDate) && !isToday(t.dueDate) && t.dueDate).length,
    aguardando: tasks.filter((t) => t.status === 'aguardando_terceiro').length,
    concluidas: tasks.filter((t) => t.status === 'concluida' && t.completedAt).length,
  }

  return (
    <div className="space-y-6">
      <PageTour steps={MEUTRABALHO_TOUR_STEPS} active={tourActive} onFinish={finishTour} />
      <div className="flex items-center gap-2" data-tour="mt-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Trabalho</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas tarefas e acompanhe seus prazos</p>
        </div>
        <TourRestartButton onClick={startTour} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0" data-tour="mt-tabs">
          <TabsTrigger
            value="hoje"
            className="relative rounded-lg border border-border px-3 py-2 text-sm data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:border-[#2563eb] data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Hoje</span>
              {tabCounts.hoje > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                  {tabCounts.hoje}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="atrasadas"
            className="relative rounded-lg border border-border px-3 py-2 text-sm data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:border-red-500 data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Atrasadas</span>
              {tabCounts.atrasadas > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                  {tabCounts.atrasadas}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="proximas"
            className="relative rounded-lg border border-border px-3 py-2 text-sm data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:border-[#2563eb] data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Proximas</span>
              {tabCounts.proximas > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                  {tabCounts.proximas}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="aguardando"
            className="relative rounded-lg border border-border px-3 py-2 text-sm data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:border-[#2563eb] data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Hourglass className="h-4 w-4" />
              <span>Aguardando Terceiro</span>
              {tabCounts.aguardando > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                  {tabCounts.aguardando}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="concluidas"
            className="relative rounded-lg border border-border px-3 py-2 text-sm data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:border-[#2563eb] data-[state=active]:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Concluidas</span>
              {tabCounts.concluidas > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
                  {tabCounts.concluidas}
                </span>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        {['hoje', 'atrasadas', 'proximas', 'aguardando', 'concluidas'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TaskCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedTasks.length === 0 ? (
              <Card>
                <CardContent className="p-0">
                  {tab === 'hoje' && (
                    <EmptyState
                      icon={Clock}
                      title="Nenhuma tarefa para hoje"
                      description="Voce nao tem tarefas previstas para hoje. Aproveite para planejar ou adiantar trabalho futuro."
                      actionLabel="Ver todas as tarefas"
                      actionHref="/app/tarefas"
                    />
                  )}
                  {tab === 'atrasadas' && (
                    <EmptyState
                      icon={CheckCircle2}
                      title="Nenhuma tarefa atrasada"
                      description="Excelente! Todas as suas tarefas estao em dia ou sem prazo definido."
                    />
                  )}
                  {tab === 'proximas' && (
                    <EmptyState
                      icon={Calendar}
                      title="Nenhuma tarefa futura"
                      description="Nao ha tarefas com prazo futuro atribuidas a voce."
                      actionLabel="Ver tarefas da equipe"
                      actionHref="/app/tarefas"
                    />
                  )}
                  {tab === 'aguardando' && (
                    <EmptyState
                      icon={Hourglass}
                      title="Nenhuma tarefa aguardando terceiro"
                      description="Nao ha tarefas aguardando resposta de terceiros no momento."
                    />
                  )}
                  {tab === 'concluidas' && (
                    <EmptyState
                      icon={Inbox}
                      title="Nenhuma tarefa concluida recentemente"
                      description="Suas tarefas concluidas aparecerao aqui."
                      actionLabel="Ver tarefas abertas"
                      actionHref="/app/tarefas"
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {sortedTasks.length} {sortedTasks.length === 1 ? 'tarefa' : 'tarefas'}
                  </p>
                  {tab !== 'concluidas' && (
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                      <Link href="/app/tarefas">
                        <Filter className="h-3 w-3" />
                        Ver todas
                      </Link>
                    </Button>
                  )}
                </div>

                <ScrollArea className="max-h-[calc(100vh-320px)]">
                  <div className="space-y-3 pr-4">
                    {sortedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleComplete}
                        completing={completing}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
