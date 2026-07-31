'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  Table2,
  Columns3,
  Group,
  Download,
  MoreHorizontal,
  CheckSquare,
  Square,
  Loader2,
  X,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  GripVertical,
  Ban,
  ArrowUpDown,
  ChevronDown,
  Inbox,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
type Session = {
  userId: string
  email: string
  name: string
  orgId: string
  role: string
}

interface TaskRow {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  category: string | null
  dueDate: string | null
  assignedTo: string | null
  departmentId: string | null
  clientId: string
  checklist: Array<{ id: string; text: string; done: boolean; required: boolean; order: number }>
  dependencies: Array<{ dependsOnId: string; blockingType: string; dependsOnTask: { id: string; title: string; status: string } }>
  client: { id: string; name: string; tradeName: string | null }
  _count: { subtasks: number; checklist: number; comments: number; followers: number }
  createdAt: string
  updatedAt: string
}

interface ClientItem {
  id: string
  name: string
}

interface MemberItem {
  id: string
  name: string
}

interface DepartmentItem {
  id: string
  name: string
}

// ── Helpers ────────────────────────────────────────────────
function getSession(): Session | null {
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

const KANBAN_STATUSES = ['a_fazer', 'em_andamento', 'aguardando_cliente', 'aguardando_terceiro', 'bloqueada', 'concluida']

function getChecklistProgress(checklist: Array<{ done: boolean }>): number {
  if (!checklist.length) return 0
  return Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
}

// ── Component ──────────────────────────────────────────────
export default function TarefasPage() {
  const router = useRouter()
  const session = getSession()

  // Data
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [clients, setClients] = useState<ClientItem[]>([])
  const [members, setMembers] = useState<MemberItem[]>([])
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [loading, setLoading] = useState(true)

  // View
  const [viewMode, setViewMode] = useState<'tabela' | 'quadro' | 'agrupamento'>('tabela')
  const [groupBy, setGroupBy] = useState<'cliente' | 'responsavel'>('cliente')
  const [search, setSearch] = useState('')

  // Filters
  const [filterStatuses, setFilterStatuses] = useState<string[]>([])
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterDepartment, setFilterDepartment] = useState<string>('')
  const [filterClient, setFilterClient] = useState<string>('')
  const [filterResponsible, setFilterResponsible] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined)
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  // Selection / Bulk
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDialog, setBulkDialog] = useState<'responsavel' | 'prioridade' | 'status' | 'prazo' | null>(null)
  const [bulkValue, setBulkValue] = useState('')
  const [bulkDate, setBulkDate] = useState<string>('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatuses.length) params.set('statuses', filterStatuses.join(','))
      if (filterPriority) params.set('priority', filterPriority)
      if (filterDepartment) params.set('departmentId', filterDepartment)
      if (filterClient) params.set('clientId', filterClient)
      if (filterResponsible) params.set('assignedTo', filterResponsible)
      if (filterDateFrom) params.set('dateFrom', filterDateFrom.toISOString())
      if (filterDateTo) params.set('dateTo', filterDateTo.toISOString())
      if (search) params.set('search', search)
      params.set('viewMode', viewMode)
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
  }, [filterStatuses, filterPriority, filterDepartment, filterClient, filterResponsible, filterDateFrom, filterDateTo, search, viewMode])

  const fetchMeta = useCallback(async () => {
    try {
      const [cRes, mRes, dRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/team'),
        fetch('/api/organizations'),
      ])
      if (cRes.ok) {
        const cData = await cRes.json()
        setClients(Array.isArray(cData) ? cData.map((c: ClientItem) => ({ id: c.id, name: c.name })) : [])
      }
      if (mRes.ok) {
        const mData = await mRes.json()
        setMembers(Array.isArray(mData) ? mData.map((m: MemberItem) => ({ id: m.id, name: m.name })) : [])
      }
      if (dRes.ok) {
        const dData = await dRes.json()
        setDepartments(dData.departments || [])
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { fetchMeta() }, [fetchMeta])
  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Filtered tasks (client-side search refinement)
  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks
    const q = search.toLowerCase()
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.client?.name.toLowerCase().includes(q) ||
        (t.assignedTo || '').toLowerCase().includes(q)
    )
  }, [tasks, search])

  // Selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selected.size === filteredTasks.length) setSelected(new Set())
    else setSelected(new Set(filteredTasks.map((t) => t.id)))
  }

  // Bulk actions
  const applyBulk = async () => {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const updates: Record<string, string> = {}
      if (bulkDialog === 'responsavel') updates.assignedTo = bulkValue
      if (bulkDialog === 'prioridade') updates.priority = bulkValue
      if (bulkDialog === 'status') updates.updateStatus = bulkValue
      if (bulkDialog === 'prazo' && bulkDate) updates.dueDate = new Date(bulkDate).toISOString()

      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
        )
      )
      toast.success(`${selected.size} tarefa(s) atualizada(s) com sucesso!`)
      setSelected(new Set())
      setBulkDialog(null)
      fetchTasks()
    } catch {
      toast.error('Erro ao atualizar tarefas')
    } finally {
      setBulkLoading(false)
    }
  }

  // Export
  const handleExport = () => {
    const headers = ['Título', 'Cliente', 'Etapa', 'Responsável', 'Prioridade', 'Prazo', 'Status', 'Checklist']
    const rows = filteredTasks.map((t) => [
      t.title,
      t.client?.name || '',
      t.category || '',
      t.assignedTo || '',
      PRIORITY_MAP[t.priority]?.label || t.priority,
      t.dueDate ? formatDate(t.dueDate) : '',
      STATUS_MAP[t.status]?.label || t.status,
      `${getChecklistProgress(t.checklist)}%`,
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tarefas_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exportação concluída!')
  }

  const clearFilters = () => {
    setFilterStatuses([])
    setFilterPriority('')
    setFilterDepartment('')
    setFilterClient('')
    setFilterResponsible('')
    setFilterDateFrom(undefined)
    setFilterDateTo(undefined)
    setSearch('')
  }

  const hasActiveFilters = filterStatuses.length > 0 || filterPriority || filterDepartment || filterClient || filterResponsible || filterDateFrom || filterDateTo

  // ── Kanban grouped data ──
  const kanbanData = useMemo(() => {
    const groups: Record<string, TaskRow[]> = {}
    KANBAN_STATUSES.forEach((s) => (groups[s] = []))
    filteredTasks.forEach((t) => {
      const bucket = KANBAN_STATUSES.includes(t.status) ? t.status : 'a_fazer'
      groups[bucket].push(t)
    })
    return groups
  }, [filteredTasks])

  // ── Grouped data ──
  const groupedData = useMemo(() => {
    const groups: Record<string, TaskRow[]> = {}
    filteredTasks.forEach((t) => {
      const key = groupBy === 'cliente' ? t.client?.name || 'Sem Cliente' : t.assignedTo || 'Sem Responsável'
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })
    return groups
  }, [filteredTasks, groupBy])

  // ── Render: Table View ──
  const renderTable = () => (
    <div className="rounded-xl border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-10">
              <Checkbox checked={selected.size > 0 && selected.size === filteredTasks.length} onCheckedChange={toggleSelectAll} />
            </TableHead>
            <TableHead className="min-w-[200px]">Título</TableHead>
            <TableHead className="min-w-[140px]">Cliente</TableHead>
            <TableHead className="min-w-[100px]">Etapa</TableHead>
            <TableHead className="min-w-[130px]">Responsável</TableHead>
            <TableHead className="min-w-[90px]">Prioridade</TableHead>
            <TableHead className="min-w-[100px]">Prazo</TableHead>
            <TableHead className="min-w-[120px]">Status</TableHead>
            <TableHead className="min-w-[110px]">Progresso</TableHead>
            <TableHead className="min-w-[80px]">Bloqueio</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="h-40 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Inbox className="h-10 w-10" />
                  <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
                  <p className="text-xs">Tente ajustar os filtros ou crie uma nova tarefa</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {filteredTasks.map((task) => {
            const progress = getChecklistProgress(task.checklist)
            const overdue = isOverdue(task.dueDate, task.status)
            const isBlocked = task.dependencies.some((d) => d.dependsOnTask.status !== 'concluida' && d.dependsOnTask.status !== 'cancelada')
            return (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => router.push(`/app/tarefas/${task.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.has(task.id)} onCheckedChange={() => toggleSelect(task.id)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate max-w-[240px]" title={task.title}>{task.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground truncate max-w-[140px]">{task.client?.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{task.category || '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate max-w-[120px]">{task.assignedTo || '—'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${PRIORITY_MAP[task.priority]?.color || ''} text-xs font-medium`}>
                    {PRIORITY_MAP[task.priority]?.label || task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center gap-1.5 text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                    {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                    {task.dueDate ? formatDate(task.dueDate) : '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${STATUS_MAP[task.status]?.color || ''} text-xs font-medium`}>
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${STATUS_MAP[task.status]?.dot || ''}`} />
                    {STATUS_MAP[task.status]?.label || task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1.5 w-16" />
                    <span className="text-xs text-muted-foreground w-8">{progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {isBlocked && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <Ban className="h-3 w-3" />
                      Bloq.
                    </Badge>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/app/tarefas/${task.id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        fetch(`/api/tasks/${task.id}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ updateStatus: 'em_andamento' }),
                        }).then(() => { toast.success('Tarefa iniciada'); fetchTasks() })
                      }} disabled={task.status !== 'a_fazer'}>
                        <Clock className="mr-2 h-4 w-4" /> Iniciar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        fetch(`/api/tasks/${task.id}`, {
                          method: 'PUT', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ updateStatus: 'concluida' }),
                        }).then((r) => r.json().then((d) => {
                          if (d.error) toast.error(d.error)
                          else { toast.success('Tarefa concluída'); fetchTasks() }
                        }))
                      }} disabled={task.status === 'concluida' || task.status === 'cancelada'}>
                        <CheckSquare className="mr-2 h-4 w-4" /> Concluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )

  // ── Render: Kanban View ──
  const renderKanban = () => (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map((status) => {
        const statusInfo = STATUS_MAP[status]
        const columnTasks = kanbanData[status] || []
        return (
          <div key={status} className="flex-shrink-0 w-[280px]">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dot}`} />
              <span className="text-sm font-semibold">{statusInfo.label}</span>
              <Badge variant="secondary" className="ml-auto text-xs h-5 min-w-[20px] justify-center rounded-full px-1.5">
                {columnTasks.length}
              </Badge>
            </div>
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {columnTasks.map((task) => {
                const progress = getChecklistProgress(task.checklist)
                const overdue = isOverdue(task.dueDate, task.status)
                const isBlocked = task.dependencies.some((d) => d.dependsOnTask.status !== 'concluida' && d.dependsOnTask.status !== 'cancelada')
                return (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/app/tarefas/${task.id}`)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-medium leading-tight line-clamp-2">{task.title}</p>
                        {isBlocked && <Ban className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{task.client?.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className={`${PRIORITY_MAP[task.priority]?.color || ''} text-[10px] px-1.5 py-0`}>
                          {PRIORITY_MAP[task.priority]?.label || task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                            {overdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                      {task.assignedTo && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{task.assignedTo}</span>
                        </div>
                      )}
                      {task.checklist.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1 flex-1" />
                          <span className="text-[10px] text-muted-foreground">{progress}%</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
              {columnTasks.length === 0 && (
                <div className="flex items-center justify-center h-24 rounded-lg border border-dashed text-muted-foreground text-xs">
                  Nenhuma tarefa
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── Render: Grouped View ──
  const renderGrouped = () => {
    const groupKeys = Object.keys(groupedData).sort()
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Agrupar por:</span>
          <Select value={groupBy} onValueChange={(v: 'cliente' | 'responsavel') => setGroupBy(v)}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente">Cliente</SelectItem>
              <SelectItem value="responsavel">Responsável</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {groupKeys.map((key) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                {groupBy === 'cliente' ? <Building2 className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                <h3 className="text-sm font-semibold">{key}</h3>
              </div>
              <Badge variant="secondary" className="text-xs">{groupedData[key].length}</Badge>
            </div>
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={groupedData[key].every((t) => selected.has(t.id)) && groupedData[key].length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) groupedData[key].forEach((t) => setSelected((p) => new Set([...p, t.id])))
                          else groupedData[key].forEach((t) => setSelected((p) => { const n = new Set(p); n.delete(t.id); return n }))
                        }}
                      />
                    </TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData[key].map((task) => {
                    const progress = getChecklistProgress(task.checklist)
                    const overdue = isOverdue(task.dueDate, task.status)
                    return (
                      <TableRow
                        key={task.id}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => router.push(`/app/tarefas/${task.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selected.has(task.id)} onCheckedChange={() => toggleSelect(task.id)} />
                        </TableCell>
                        <TableCell className="font-medium text-sm">{task.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${PRIORITY_MAP[task.priority]?.color || ''} text-xs`}>
                            {PRIORITY_MAP[task.priority]?.label || task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                            {task.dueDate ? formatDate(task.dueDate) : '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${STATUS_MAP[task.status]?.color || ''} text-xs`}>
                            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${STATUS_MAP[task.status]?.dot || ''}`} />
                            {STATUS_MAP[task.status]?.label || task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-1.5 w-16" />
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/app/tarefas/${task.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
        {groupKeys.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Inbox className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
          </div>
        )}
      </div>
    )
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-[300px]" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie e acompanhe todas as tarefas da sua organização</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/tarefas/minha-fila">
            <Button variant="outline" size="sm" className="text-sm">
              Minha Fila
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" /> Exportar
          </Button>
          <Link href="/app/tarefas/nova">
            <Button size="sm" className="text-sm">
              <Plus className="h-4 w-4 mr-1.5" /> Nova Tarefa
            </Button>
          </Link>
        </div>
      </div>

      {/* Search + View Mode + Bulk */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas por título, cliente ou responsável..."
            className="h-9 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'tabela' | 'quadro' | 'agrupamento')}>
          <TabsList className="h-9">
            <TabsTrigger value="tabela" className="text-xs px-3">
              <Table2 className="h-3.5 w-3.5 mr-1.5" /> Tabela
            </TabsTrigger>
            <TabsTrigger value="quadro" className="text-xs px-3">
              <Columns3 className="h-3.5 w-3.5 mr-1.5" /> Quadro
            </TabsTrigger>
            <TabsTrigger value="agrupamento" className="text-xs px-3">
              <Group className="h-3.5 w-3.5 mr-1.5" /> Agrupamento
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          className="h-9 text-sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1.5" /> Filtrar
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] justify-center rounded-full px-1.5 text-[10px]">
              {filterStatuses.length + (filterPriority ? 1 : 0) + (filterDepartment ? 1 : 0) + (filterClient ? 1 : 0) + (filterResponsible ? 1 : 0) + (filterDateFrom ? 1 : 0) + (filterDateTo ? 1 : 0)}
            </Badge>
          )}
        </Button>
        {selected.size > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-9 text-sm">
                <GripVertical className="h-4 w-4 mr-1.5" /> Ações ({selected.size})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações em lote</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setBulkDialog('responsavel')}>
                <User className="mr-2 h-4 w-4" /> Alterar Responsável
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkDialog('prioridade')}>
                <ArrowUpDown className="mr-2 h-4 w-4" /> Alterar Prioridade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkDialog('status')}>
                <CheckSquare className="mr-2 h-4 w-4" /> Alterar Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkDialog('prazo')}>
                <Calendar className="mr-2 h-4 w-4" /> Alterar Prazo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status multi-select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between text-sm h-9">
                    {filterStatuses.length > 0 ? `${filterStatuses.length} selecionado(s)` : 'Todos'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
                  {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={filterStatuses.includes(key)}
                      onCheckedChange={(checked) => {
                        setFilterStatuses((prev) => checked ? [...prev, key] : prev.filter((s) => s !== key))
                      }}
                    >
                      <span className={`mr-2 h-2 w-2 rounded-full ${val.dot}`} />
                      {val.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Prioridade</Label>
              <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {Object.entries(PRIORITY_MAP).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Department */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Departamento</Label>
              <Select value={filterDepartment} onValueChange={(v) => setFilterDepartment(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Client */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Cliente</Label>
              <Select value={filterClient} onValueChange={(v) => setFilterClient(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Responsible */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Responsável</Label>
              <Select value={filterResponsible} onValueChange={(v) => setFilterResponsible(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Date From */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Prazo a partir de</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full h-9 text-sm justify-start ${!filterDateFrom && 'text-muted-foreground'}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {filterDateFrom ? formatDate(filterDateFrom.toISOString()) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} />
                </PopoverContent>
              </Popover>
            </div>
            {/* Date To */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Prazo até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full h-9 text-sm justify-start ${!filterDateTo && 'text-muted-foreground'}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {filterDateTo ? formatDate(filterDateTo.toISOString()) : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker mode="single" selected={filterDateTo} onSelect={setFilterDateTo} />
                </PopoverContent>
              </Popover>
            </div>
            {/* Clear */}
            <div className="flex items-end">
              <Button variant="ghost" size="sm" className="w-full text-sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1.5" /> Limpar filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* View Content */}
      {viewMode === 'tabela' && renderTable()}
      {viewMode === 'quadro' && renderKanban()}
      {viewMode === 'agrupamento' && renderGrouped()}

      {/* Bulk Dialogs */}
      <Dialog open={bulkDialog === 'responsavel'} onOpenChange={() => setBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Responsável</DialogTitle>
            <DialogDescription>Alterar responsável de {selected.size} tarefa(s)</DialogDescription>
          </DialogHeader>
          <Select value={bulkValue} onValueChange={setBulkValue}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(null)}>Cancelar</Button>
            <Button onClick={applyBulk} disabled={!bulkValue || bulkLoading}>{bulkLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialog === 'prioridade'} onOpenChange={() => setBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Prioridade</DialogTitle>
            <DialogDescription>Alterar prioridade de {selected.size} tarefa(s)</DialogDescription>
          </DialogHeader>
          <Select value={bulkValue} onValueChange={setBulkValue}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(null)}>Cancelar</Button>
            <Button onClick={applyBulk} disabled={!bulkValue || bulkLoading}>{bulkLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialog === 'status'} onOpenChange={() => setBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status</DialogTitle>
            <DialogDescription>Alterar status de {selected.size} tarefa(s)</DialogDescription>
          </DialogHeader>
          <Select value={bulkValue} onValueChange={setBulkValue}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(null)}>Cancelar</Button>
            <Button onClick={applyBulk} disabled={!bulkValue || bulkLoading}>{bulkLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialog === 'prazo'} onOpenChange={() => setBulkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Prazo</DialogTitle>
            <DialogDescription>Alterar prazo de {selected.size} tarefa(s)</DialogDescription>
          </DialogHeader>
          <Input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(null)}>Cancelar</Button>
            <Button onClick={applyBulk} disabled={!bulkDate || bulkLoading}>{bulkLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}