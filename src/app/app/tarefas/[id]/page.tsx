'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  RotateCcw,
  XCircle,
  CalendarClock,
  UserPlus,
  Copy,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  MessageSquare,
  Paperclip,
  GitBranch,
  Repeat,
  History,
  CheckSquare,
  Square,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  Clock,
  Ban,
  Send,
  AtSign,
  FileText,
  ChevronDown,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface ChecklistItem {
  id: string
  text: string
  done: boolean
  required: boolean
  order: number
}

interface CommentItem {
  id: string
  content: string
  userName: string
  createdAt: string
}

interface TaskDep {
  id: string
  taskId: string
  dependsOnId: string
  blockingType: string
  dependsOnTask: {
    id: string
    title: string
    status: string
    priority: string
    client?: { name: string }
  }
}

interface FollowerItem {
  taskId: string
  memberId: string
}

interface AuditItem {
  id: string
  action: string
  userName: string | null
  detail: string | null
  createdAt: string
}

interface DocumentItem {
  id: string
  name: string
  status: string
  createdAt: string
}

interface TaskDetail {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string | null
  dueDate: string | null
  completedAt: string | null
  assignedTo: string | null
  assignedToId: string | null
  reviewerId: string | null
  departmentId: string | null
  clientId: string
  recurrenceRule: string | null
  recurrenceParentId: string | null
  parentTaskId: string | null
  portalVisible: boolean
  portalInstructions: string | null
  createdAt: string
  updatedAt: string
  client: { id: string; name: string; tradeName: string | null }
  template: { id: string; name: string } | null
  application: { id: string; templateVersionId: string } | null
  checklist: ChecklistItem[]
  comments: CommentItem[]
  followers: FollowerItem[]
  dependencies: TaskDep[]
  dependsOn: TaskDep[]
  subtasks: Array<{ id: string; title: string; status: string }>
  parentTask: { id: string; title: string } | null
  count: { subtasks: number; checklist: number; comments: number; followers: number }
}

// ── Helpers ────────────────────────────────────────────────
function getSession() {
  try {
    const raw = localStorage.getItem('cr_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isOverdue(dateStr: string | null, status: string): boolean {
  if (!dateStr || status === 'concluida' || status === 'cancelada') return false
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
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

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Média', color: 'bg-amber-50 text-amber-700' },
  high: { label: 'Alta', color: 'bg-orange-50 text-orange-700' },
  urgent: { label: 'Urgente', color: 'bg-red-50 text-red-700' },
}

function getChecklistProgress(checklist: ChecklistItem[]): number {
  if (!checklist.length) return 0
  return Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
}

// ── Component ──────────────────────────────────────────────
export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const session = getSession()

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('checklist')
  const [actionLoading, setActionLoading] = useState(false)

  // Checklist
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [newChecklistRequired, setNewChecklistRequired] = useState(false)

  // Comment
  const [newComment, setNewComment] = useState('')
  const [commentSending, setCommentSending] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')

  // Dependency
  const [depSearch, setDepSearch] = useState('')
  const [depResults, setDepResults] = useState<Array<{ id: string; title: string; client?: { name: string } }>>([])

  // Dialogs
  const [showDueDateDialog, setShowDueDateDialog] = useState(false)
  const [showDelegateDialog, setShowDelegateDialog] = useState(false)
  const [showDepDialog, setShowDepDialog] = useState(false)
  const [newDueDate, setNewDueDate] = useState('')
  const [delegateTo, setDelegateTo] = useState('')
  const [delegateToId, setDelegateToId] = useState('')

  // Members for delegation
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([])

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`)
      if (res.ok) {
        const data = await res.json()
        setTask(data)
      } else {
        toast.error('Tarefa não encontrada')
        router.replace('/app/tarefas')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team')
      if (res.ok) {
        const data = await res.json()
        setMembers(Array.isArray(data) ? data.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })) : [])
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { fetchTask() }, [fetchTask])

  // Status actions
  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateStatus: newStatus }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success('Status atualizado com sucesso!')
        fetchTask()
      }
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setActionLoading(false)
    }
  }

  // Due date
  const handleDueDateChange = async () => {
    if (!newDueDate) return
    setActionLoading(true)
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: new Date(newDueDate + 'T12:00:00').toISOString() }),
      })
      toast.success('Prazo alterado!')
      setShowDueDateDialog(false)
      fetchTask()
    } catch {
      toast.error('Erro ao alterar prazo')
    } finally {
      setActionLoading(false)
    }
  }

  // Delegate
  const handleDelegate = async () => {
    if (!delegateTo) return
    setActionLoading(true)
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: delegateTo, assignedToId: delegateToId || null }),
      })
      toast.success('Tarefa delegada!')
      setShowDelegateDialog(false)
      fetchTask()
    } catch {
      toast.error('Erro ao delegar')
    } finally {
      setActionLoading(false)
    }
  }

  // Duplicate
  const handleDuplicate = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: task?.organizationId || session?.orgId,
          clientId: task?.clientId,
          title: `${task?.title} (cópia)`,
          description: task?.description,
          priority: task?.priority,
          category: task?.category,
          departmentId: task?.departmentId,
          assignedTo: task?.assignedTo,
          assignedToId: task?.assignedToId,
          dueDate: task?.dueDate,
        }),
      })
      if (res.ok) {
        const newTask = await res.json()
        toast.success('Tarefa duplicada!')
        router.push(`/app/tarefas/${newTask.id}`)
      }
    } catch {
      toast.error('Erro ao duplicar')
    } finally {
      setActionLoading(false)
    }
  }

  // Checklist add
  const addChecklistItem = async () => {
    if (!newChecklistItem.trim()) return
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addChecklist: [{ text: newChecklistItem.trim(), required: newChecklistRequired }],
        }),
      })
      setNewChecklistItem('')
      setNewChecklistRequired(false)
      fetchTask()
    } catch {
      toast.error('Erro ao adicionar item')
    }
  }

  // Checklist toggle
  const toggleChecklist = async (itemId: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleChecklist: itemId }),
      })
      fetchTask()
    } catch {
      toast.error('Erro ao atualizar item')
    }
  }

  // Checklist remove
  const removeChecklistItem = async (itemId: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeChecklistItem: itemId }),
      })
      fetchTask()
    } catch {
      toast.error('Erro ao remover item')
    }
  }

  // Checklist reorder (move up/down)
  const reorderChecklist = async (itemIndex: number, direction: 'up' | 'down') => {
    if (!task) return
    const items = [...task.checklist]
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    const temp = items[itemIndex]
    items[itemIndex] = items[targetIndex]
    items[targetIndex] = temp
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorderChecklist: items.map((item, idx) => ({ id: item.id, order: idx })) }),
      })
      fetchTask()
    } catch {
      toast.error('Erro ao reordenar')
    }
  }

  // Comment
  const sendComment = async () => {
    if (!newComment.trim()) return
    setCommentSending(true)
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addComment: {
            userName: session?.name || 'Usuário',
            content: newComment.trim(),
            userId: session?.userId || null,
          },
        }),
      })
      setNewComment('')
      fetchTask()
    } catch {
      toast.error('Erro ao enviar comentário')
    } finally {
      setCommentSending(false)
    }
  }

  // Add dependency
  const addDependency = async (dependsOnId: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addDependency: dependsOnId }),
      })
      toast.success('Dependência adicionada!')
      fetchTask()
    } catch {
      toast.error('Erro ao adicionar dependência')
    }
  }

  // Remove dependency
  const removeDependency = async (dependsOnId: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeDependency: dependsOnId }),
      })
      fetchTask()
    } catch {
      toast.error('Erro ao remover dependência')
    }
  }

  // Search tasks for dependency
  const searchDepTasks = async (q: string) => {
    setDepSearch(q)
    if (q.length < 2) { setDepResults([]); return }
    try {
      const res = await fetch(`/api/tasks?search=${encodeURIComponent(q)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setDepResults(data.filter((t: { id: string }) => t.id !== id).slice(0, 8))
      }
    } catch {
      // silent
    }
  }

  const overdue = task ? isOverdue(task.dueDate, task.status) : false
  const progress = task ? getChecklistProgress(task.checklist) : 0
  const isBlocked = task?.dependencies.some((d) => d.dependsOnTask.status !== 'concluida' && d.dependsOnTask.status !== 'cancelada')

  // ── Loading State ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!task) return null

  const statusInfo = STATUS_MAP[task.status] || STATUS_MAP.a_fazer
  const priorityInfo = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/app/tarefas">
            <Button variant="ghost" size="icon" className="h-9 w-9 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
              <Badge variant="outline" className={`${statusInfo.color} text-xs font-medium`}>
                <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </Badge>
              <Badge variant="secondary" className={`${priorityInfo.color} text-xs font-medium`}>
                {priorityInfo.label}
              </Badge>
              {isBlocked && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <Ban className="h-3 w-3" /> Bloqueada
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> {task.client.name}
              </span>
              {task.dueDate && (
                <span className={`flex items-center gap-1.5 ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                  {overdue ? <AlertTriangle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                  {formatDate(task.dueDate)}
                </span>
              )}
              {task.assignedTo && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {task.assignedTo}
                </span>
              )}
              {task.category && (
                <Badge variant="outline" className="text-xs">{task.category}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {task.status === 'a_fazer' && (
            <Button size="sm" onClick={() => handleStatusChange('em_andamento')} disabled={actionLoading}>
              <Play className="h-4 w-4 mr-1.5" /> Iniciar
            </Button>
          )}
          {(task.status === 'a_fazer' || task.status === 'em_andamento' || task.status === 'aguardando_cliente' || task.status === 'aguardando_terceiro') && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('concluida')} disabled={actionLoading}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Concluir
            </Button>
          )}
          {task.status === 'concluida' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('a_fazer')} disabled={actionLoading}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reabrir
            </Button>
          )}
          {task.status !== 'cancelada' && task.status !== 'concluida' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange('cancelada')} disabled={actionLoading}>
              <XCircle className="h-4 w-4 mr-1.5" /> Cancelar
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={actionLoading}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setShowDueDateDialog(true); setNewDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '') }}>
                <CalendarClock className="mr-2 h-4 w-4" /> Alterar Prazo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDelegateDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" /> Delegar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusChange('aguardando_cliente')} disabled={task.status === 'concluida' || task.status === 'cancelada'}>
                <Clock className="mr-2 h-4 w-4" /> Aguardando Cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('aguardando_terceiro')} disabled={task.status === 'concluida' || task.status === 'cancelada'}>
                <Clock className="mr-2 h-4 w-4" /> Aguardando Terceiro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('bloqueada')} disabled={task.status === 'concluida' || task.status === 'cancelada'}>
                <Ban className="mr-2 h-4 w-4" /> Bloquear
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2">
          {/* Description */}
          {task.description && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="checklist" className="text-xs gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" /> Checklist
                {task.checklist.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1 rounded-full">
                    {task.checklist.filter((c) => c.done).length}/{task.checklist.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs gap-1.5">
                <Paperclip className="h-3.5 w-3.5" /> Documentos
              </TabsTrigger>
              <TabsTrigger value="comentarios" className="text-xs gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Comentários
                {task.count.comments > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1 rounded-full">
                    {task.count.comments}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="dependencias" className="text-xs gap-1.5">
                <GitBranch className="h-3.5 w-3.5" /> Dependências
                {task.dependencies.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1 rounded-full">
                    {task.dependencies.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="recorrencias" className="text-xs gap-1.5">
                <Repeat className="h-3.5 w-3.5" /> Recorrências
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs gap-1.5">
                <History className="h-3.5 w-3.5" /> Histórico
              </TabsTrigger>
            </TabsList>

            {/* ── Checklist Tab ── */}
            <TabsContent value="checklist" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Itens do Checklist</CardTitle>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2 w-24" />
                      <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {task.checklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 group rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={() => toggleChecklist(item.id)}
                      />
                      <span className={`flex-1 text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                        {item.text}
                      </span>
                      {item.required && (
                        <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded">Obrigatório</span>
                      )}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => reorderChecklist(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <ChevronDown className="h-3 w-3 rotate-180" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => reorderChecklist(idx, 'down')}
                          disabled={idx === task.checklist.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeChecklistItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {task.checklist.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum item no checklist</p>
                  )}
                  <Separator className="my-2" />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Adicionar item ao checklist..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                      className="text-sm"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer select-none">
                      <Checkbox
                        checked={newChecklistRequired}
                        onCheckedChange={(v) => setNewChecklistRequired(!!v)}
                        className="h-4 w-4"
                      />
                      Obrigatório
                    </label>
                    <Button size="icon" onClick={addChecklistItem} disabled={!newChecklistItem.trim()} className="shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Documentos Tab ── */}
            <TabsContent value="documentos" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Documentos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum documento vinculado a esta tarefa.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-1.5" /> Vincular Documento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Comentários Tab ── */}
            <TabsContent value="comentarios" className="mt-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* New comment */}
                  <div className="flex gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {session?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Textarea
                          placeholder="Escreva um comentário... (mencione alguém com @)"
                          value={newComment}
                          onChange={(e) => {
                            setNewComment(e.target.value)
                            if (e.target.value.includes('@')) {
                              const after = e.target.value.split('@').pop() || ''
                              if (after.length > 0) {
                                setMentionSearch(after.split(' ')[0])
                              }
                            } else {
                              setMentionSearch('')
                            }
                          }}
                          rows={3}
                          className="text-sm resize-none"
                        />
                        {mentionSearch.length > 0 && (
                          <div className="absolute left-0 bottom-full mb-1 w-56 rounded-lg border bg-white shadow-lg z-10 max-h-40 overflow-y-auto">
                            {members
                              .filter((m) => m.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                              .slice(0, 5)
                              .map((m) => (
                                <button
                                  key={m.id}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                                  onClick={() => {
                                    setNewComment((prev) => prev.replace(`@${mentionSearch}`, `@${m.name} `))
                                    setMentionSearch('')
                                  }}
                                >
                                  <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                                  {m.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={sendComment}
                          disabled={!newComment.trim() || commentSending}
                        >
                          {commentSending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Comments list */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {task.comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">Nenhum comentário ainda</p>
                    )}
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {comment.userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Dependências Tab ── */}
            <TabsContent value="dependencias" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Dependências</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setShowDepDialog(true)}>
                      <Plus className="h-4 w-4 mr-1.5" /> Adicionar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {task.dependencies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhuma dependência configurada.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {task.dependencies.map((dep) => (
                        <div key={dep.dependsOnId} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                          <Link
                            href={`/app/tarefas/${dep.dependsOnId}`}
                            className="flex-1 min-w-0 hover:underline"
                          >
                            <p className="text-sm font-medium truncate">{dep.dependsOnTask.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className={`${STATUS_MAP[dep.dependsOnTask.status]?.color || ''} text-[10px]`}>
                                <span className={`mr-1 h-1.5 w-1.5 rounded-full ${STATUS_MAP[dep.dependsOnTask.status]?.dot || ''}`} />
                                {STATUS_MAP[dep.dependsOnTask.status]?.label || dep.dependsOnTask.status}
                              </Badge>
                              {dep.dependsOnTask.client && (
                                <span className="text-[11px] text-muted-foreground">{dep.dependsOnTask.client.name}</span>
                              )}
                            </div>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeDependency(dep.dependsOnId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Recorrências Tab ── */}
            <TabsContent value="recorrencias" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ocorrências Recorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {!task.recurrenceRule && !task.recurrenceParentId && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Esta tarefa não é recorrente.
                    </p>
                  )}
                  {task.recurrenceRule && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="text-sm font-medium">Regra de Recorrência</p>
                      <pre className="text-xs text-muted-foreground bg-muted/50 rounded p-3 overflow-x-auto">
                        {JSON.stringify(JSON.parse(task.recurrenceRule), null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Histórico Tab ── */}
            <TabsContent value="historico" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Histórico de Alterações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-0">
                    <div className="flex items-center gap-3 pb-6">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div className="w-px flex-1 bg-border mt-1" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tarefa criada</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(task.createdAt)}</p>
                      </div>
                    </div>
                    {task.status !== 'a_fazer' && (
                      <div className="flex items-center gap-3 pb-6">
                        <div className="flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                          <div className="w-px flex-1 bg-border mt-1" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Status alterado para {statusInfo.label}</p>
                          <p className="text-xs text-muted-foreground">{task.updatedAt ? formatDateTime(task.updatedAt) : ''}</p>
                        </div>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-sm font-medium">Tarefa concluída</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(task.completedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status & Priority Info */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                <Badge variant="outline" className={`${statusInfo.color} text-xs font-medium`}>
                  <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                  {statusInfo.label}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridade</p>
                <Badge variant="secondary" className={`${priorityInfo.color} text-xs font-medium`}>
                  {priorityInfo.label}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progresso</p>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-xs font-medium">{progress}%</span>
                </div>
                {task.checklist.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {task.checklist.filter((c) => c.done).length} de {task.checklist.length} itens
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</p>
                <Link href={`/app/empresas/${task.client.id}`} className="text-sm font-medium hover:underline flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {task.client.name}
                </Link>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Responsável</p>
                <p className="text-sm">{task.assignedTo || <span className="text-muted-foreground">Não atribuída</span>}</p>
              </div>
              {task.category && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</p>
                    <p className="text-sm">{task.category}</p>
                  </div>
                </>
              )}
              {task.dueDate && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prazo</p>
                    <p className={`text-sm flex items-center gap-1.5 ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                      {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                </>
              )}
              {task.portalVisible && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Portal</p>
                    <Badge variant="outline" className="text-xs">Visível no portal</Badge>
                    {task.portalInstructions && (
                      <p className="text-xs text-muted-foreground mt-1">{task.portalInstructions}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold">{task.count.checklist}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Checklist</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{task.count.comments}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Comentários</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{task.count.followers}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{task.dependencies.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dependências</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Due Date Dialog ── */}
      <Dialog open={showDueDateDialog} onOpenChange={setShowDueDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Prazo</DialogTitle>
            <DialogDescription>Defina um novo prazo para esta tarefa</DialogDescription>
          </DialogHeader>
          <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDueDateDialog(false)}>Cancelar</Button>
            <Button onClick={handleDueDateChange} disabled={!newDueDate || actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delegate Dialog ── */}
      <Dialog open={showDelegateDialog} onOpenChange={setShowDelegateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegar Tarefa</DialogTitle>
            <DialogDescription>Selecione o novo responsável pela tarefa</DialogDescription>
          </DialogHeader>
          <Select value={delegateToId} onValueChange={(v) => {
            const m = members.find((mem) => mem.id === v)
            setDelegateToId(v)
            setDelegateTo(m?.name || '')
          }}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelegateDialog(false)}>Cancelar</Button>
            <Button onClick={handleDelegate} disabled={!delegateTo || actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Delegar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Dependency Dialog ── */}
      <Dialog open={showDepDialog} onOpenChange={setShowDepDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Dependência</DialogTitle>
            <DialogDescription>Busque e selecione uma tarefa que bloqueia esta</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Buscar tarefa por título..."
            value={depSearch}
            onChange={(e) => searchDepTasks(e.target.value)}
          />
          <ScrollArea className="max-h-60">
            {depResults.length === 0 && depSearch.length >= 2 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa encontrada</p>
            )}
            {depResults.map((t) => (
              <button
                key={t.id}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                onClick={() => {
                  addDependency(t.id)
                  setShowDepDialog(false)
                  setDepSearch('')
                  setDepResults([])
                }}
              >
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  {t.client && <p className="text-xs text-muted-foreground">{t.client.name}</p>}
                </div>
              </button>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}