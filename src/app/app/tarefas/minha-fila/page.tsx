'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Loader2,
  Inbox,
  Building2,
  MessageSquare,
  Send,
  Flame,
  ArrowLeft,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface TaskItem {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignedTo: string | null
  client: { id: string; name: string; tradeName: string | null }
  checklist: Array<{ id: string; text: string; done: boolean; required: boolean; order: number }>
  _count: { subtasks: number; checklist: number; comments: number; followers: number }
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

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
  return d >= today && d <= endOfWeek
}

function getDaysUntilDue(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  a_fazer: { label: 'A Fazer', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  em_andamento: { label: 'Em Andamento', color: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  concluida: { label: 'Concluída', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  aguardando_cliente: { label: 'Aguardando Cliente', color: 'bg-sky-50 text-sky-700 border border-sky-200', dot: 'bg-sky-500' },
  aguardando_terceiro: { label: 'Aguardando Terceiro', color: 'bg-violet-50 text-violet-700 border border-violet-200', dot: 'bg-violet-500' },
  bloqueada: { label: 'Bloqueada', color: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
}

const PRIORITY_MAP: Record<string, { label: string; color: string; weight: number }> = {
  low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600', weight: 0 },
  medium: { label: 'Média', color: 'bg-amber-50 text-amber-700', weight: 1 },
  high: { label: 'Alta', color: 'bg-orange-50 text-orange-700', weight: 2 },
  urgent: { label: 'Urgente', color: 'bg-red-50 text-red-700', weight: 3 },
}

function getChecklistProgress(checklist: Array<{ done: boolean }>): number {
  if (!checklist.length) return 0
  return Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
}

// ── Component ──────────────────────────────────────────────
export default function MinhaFilaPage() {
  const session = getSession()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')

  // Quick comment
  const [quickCommentTask, setQuickCommentTask] = useState<string | null>(null)
  const [quickComment, setQuickComment] = useState('')
  const [commentSending, setCommentSending] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('assignedTo', session?.name || '')
      params.set('statuses', 'a_fazer,em_andamento,aguardando_cliente,aguardando_terceiro')
      params.set('myQueue', 'true')
      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      } else {
        toast.error('Erro ao carregar tarefas')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [session?.name])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Sort: overdue first, then due date, then priority
  const sortedTasks = useMemo(() => {
    let filtered = [...tasks]

    if (filter === 'today') {
      filtered = filtered.filter((t) => isToday(t.dueDate) || isOverdue(t.dueDate))
    } else if (filter === 'week') {
      filtered = filtered.filter((t) => isThisWeek(t.dueDate) || isOverdue(t.dueDate))
    }

    return filtered.sort((a, b) => {
      const aOverdue = isOverdue(a.dueDate) ? 0 : 1
      const bOverdue = isOverdue(b.dueDate) ? 0 : 1
      if (aOverdue !== bOverdue) return aOverdue - bOverdue

      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      if (aDate !== bDate) return aDate - bDate

      const aPriority = PRIORITY_MAP[a.priority]?.weight ?? 0
      const bPriority = PRIORITY_MAP[b.priority]?.weight ?? 0
      return bPriority - aPriority
    })
  }, [tasks, filter])

  // Quick complete
  const handleQuickComplete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateStatus: 'concluida' }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success('Tarefa concluída!')
        fetchTasks()
      }
    } catch {
      toast.error('Erro ao concluir tarefa')
    }
  }

  // Quick start
  const handleQuickStart = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateStatus: 'em_andamento' }),
      })
      toast.success('Tarefa iniciada!')
      fetchTasks()
    } catch {
      toast.error('Erro ao iniciar tarefa')
    }
  }

  // Quick comment
  const sendQuickComment = async () => {
    if (!quickCommentTask || !quickComment.trim()) return
    setCommentSending(true)
    try {
      await fetch(`/api/tasks/${quickCommentTask}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addComment: {
            userName: session?.name || 'Usuário',
            content: quickComment.trim(),
            userId: session?.userId || null,
          },
        }),
      })
      toast.success('Comentário adicionado!')
      setQuickCommentTask(null)
      setQuickComment('')
      fetchTasks()
    } catch {
      toast.error('Erro ao enviar comentário')
    } finally {
      setCommentSending(false)
    }
  }

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate)).length
  const todayCount = tasks.filter((t) => isToday(t.dueDate)).length

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/tarefas">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h1 className="text-2xl font-bold tracking-tight">Minha Fila</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suas tarefas priorizadas por urgência
          </p>
        </div>
        {overdueCount > 0 && (
          <Badge variant="destructive" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs h-8"
        >
          Todas ({tasks.length})
        </Button>
        <Button
          variant={filter === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('today')}
          className="text-xs h-8"
        >
          <Calendar className="h-3 w-3 mr-1" /> Hoje ({todayCount})
        </Button>
        <Button
          variant={filter === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('week')}
          className="text-xs h-8"
        >
          <Clock className="h-3 w-3 mr-1" /> Esta Semana
        </Button>
      </div>

      {/* Task Cards */}
      <div className="space-y-2">
        {sortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">Nenhuma tarefa na sua fila</p>
            <p className="text-xs mt-1">Tudo em dia! Bom trabalho.</p>
          </div>
        )}

        {sortedTasks.map((task) => {
          const overdue = isOverdue(task.dueDate)
          const daysLeft = getDaysUntilDue(task.dueDate)
          const progress = getChecklistProgress(task.checklist)
          const statusInfo = STATUS_MAP[task.status] || STATUS_MAP.a_fazer
          const priorityInfo = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium

          return (
            <div
              key={task.id}
              className={`rounded-xl border bg-white p-4 transition-all hover:shadow-md ${
                overdue ? 'border-red-200 bg-red-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Quick complete button */}
                <button
                  className={`mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                    task.status === 'em_andamento'
                      ? 'border-amber-400 hover:border-emerald-500 hover:bg-emerald-50'
                      : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'
                  }`}
                  onClick={() => task.status === 'a_fazer' ? handleQuickStart(task.id) : handleQuickComplete(task.id)}
                  title={task.status === 'a_fazer' ? 'Iniciar' : 'Concluir'}
                >
                  {task.status === 'a_fazer' && <Play className="h-2.5 w-2.5 text-gray-400" />}
                  {task.status === 'em_andamento' && <CheckCircle2 className="h-2.5 w-2.5 text-amber-400" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/app/tarefas/${task.id}`}
                      className="font-medium text-sm hover:underline leading-tight"
                    >
                      {task.title}
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="secondary" className={`${priorityInfo.color} text-[10px] px-1.5 py-0`}>
                        {priorityInfo.label}
                      </Badge>
                      <Badge variant="outline" className={`${statusInfo.color} text-[10px]`}>
                        <span className={`mr-1 h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {task.client.name}
                    </span>
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                        {overdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                        {overdue
                          ? `Atrasada ${Math.abs(daysLeft!)} dia${Math.abs(daysLeft!) > 1 ? 's' : ''}`
                          : daysLeft === 0
                            ? 'Hoje'
                            : daysLeft === 1
                              ? 'Amanhã'
                              : formatDate(task.dueDate)}
                      </span>
                    )}
                    {task._count.comments > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {task._count.comments}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {task.checklist.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground">{progress}%</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setQuickCommentTask(task.id)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" /> Comentário
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Comment Dialog */}
      <Dialog open={!!quickCommentTask} onOpenChange={() => setQuickCommentTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comentário Rápido</DialogTitle>
            <DialogDescription>Adicione um comentário a esta tarefa</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Escreva seu comentário..."
            value={quickComment}
            onChange={(e) => setQuickComment(e.target.value)}
            rows={3}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickCommentTask(null)}>Cancelar</Button>
            <Button
              onClick={sendQuickComment}
              disabled={!quickComment.trim() || commentSending}
            >
              {commentSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
