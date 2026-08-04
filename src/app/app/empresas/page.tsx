'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  MoreHorizontal,
  CheckSquare,
  Square,
  Building2,
  FileDown,
  UserPlus,
  Tag,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { PageTour, TourRestartButton, usePageTour, type TourStep } from '@/components/page-tour'

const EMPRESAS_TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="emp-header"]', title: 'Empresas', description: 'Aqui ficam todos os clientes da sua organização — cada um com seus templates, tarefas e documentos.' },
  { selector: '[data-tour="emp-actions"]', title: 'Ações rápidas', description: 'Exporte a lista, importe clientes em massa por CSV ou cadastre um novo cliente.' },
  { selector: '[data-tour="emp-search"]', title: 'Buscar e filtrar', description: 'Busque por nome, nome fantasia ou CNPJ, ou use os filtros para refinar por status, segmento, responsável ou tag.' },
  { selector: '[data-tour="emp-table"]', title: 'Lista de clientes', description: 'Clique em qualquer linha para abrir a ficha completa do cliente — tarefas, templates aplicados, documentos e contatos.' },
]

// ── Types ──────────────────────────────────────────────────
type Session = {
  userId: string
  email: string
  name: string
  orgId: string
  role: string
}

interface ClientRow {
  id: string
  name: string
  tradeName: string | null
  cnpj: string
  taxRegime: string | null
  status: string
  responsible: number | null
  segment: string | null
  tagsList: Array<{ id: string; name: string; color: string }>
  pendingTasks: number
  count: { tasks: number; documents: number }
  applications: Array<{ id: string; status: string }>
  nextDueDate: string | null
  createdAt: string
  updatedAt: string
}

interface OrgMember {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface TagItem {
  id: string
  name: string
  color: string
}

// ── Helpers ────────────────────────────────────────────────
function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem('cr_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 font-medium">Ativo</Badge>
    case 'inactive':
      return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 font-medium">Inativo</Badge>
    case 'archived':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 font-medium">Arquivado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getNextDate(client: ClientRow): string | null {
  if (!client.nextDueDate) return null
  const d = new Date(client.nextDueDate)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// ── Page ───────────────────────────────────────────────────
export default function EmpresasPage() {
  const router = useRouter()
  const session = getSession()
  const { active: tourActive, start: startTour, finish: finishTour } = usePageTour('empresas')

  // Data
  const [clients, setClients] = useState<ClientRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [tags, setTags] = useState<TagItem[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [responsibleFilter, setResponsibleFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Bulk action dialogs
  const [showResponsibleDialog, setShowResponsibleDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [bulkResponsibleId, setBulkResponsibleId] = useState('')
  const [bulkTagId, setBulkTagId] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const totalPages = Math.ceil(total / pageSize)

  // ── Fetch clients ───────────────────────────────────────
  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pageSize))
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (segmentFilter) params.set('segment', segmentFilter)
      if (responsibleFilter) params.set('responsibleId', responsibleFilter)
      if (tagFilter) params.set('tagId', tagFilter)

      const res = await fetch(`/api/clients?${params.toString()}`)
      if (!res.ok) throw new Error('Erro ao buscar clientes')
      const data = await res.json()
      setClients(data.clients || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, segmentFilter, responsibleFilter, tagFilter])

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team')
      if (res.ok) {
        const data = await res.json()
        setMembers(data.filter((m: OrgMember) => m.status === 'active'))
      }
    } catch { /* ignore */ }
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/clients?limit=1')
      // Tags come from a separate source ideally, but for now we'll derive from clients
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])
  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { fetchTags() }, [fetchTags])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, statusFilter, segmentFilter, responsibleFilter, tagFilter])

  // ── Selection ───────────────────────────────────────────
  const allSelected = clients.length > 0 && clients.every(c => selectedIds.has(c.id))
  const someSelected = clients.some(c => selectedIds.has(c.id)) && !allSelected

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(clients.map(c => c.id)))
    }
  }

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Bulk actions ────────────────────────────────────────
  async function handleBulkResponsible() {
    if (!bulkResponsibleId || selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const member = members.find(m => String(m.id) === bulkResponsibleId)
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responsible: bulkResponsibleId }),
          })
        )
      )
      toast.success(`Responsável alterado para ${member?.name || 'membro'} em ${selectedIds.size} cliente(s)`)
      setSelectedIds(new Set())
      setShowResponsibleDialog(false)
      fetchClients()
    } catch {
      toast.error('Erro ao alterar responsável')
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleBulkTag() {
    if (!bulkTagId || selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const tag = tags.find(t => String(t.id) === bulkTagId)
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addTags: [bulkTagId] }),
          })
        )
      )
      toast.success(`Tag "${tag?.name || ''}" adicionada a ${selectedIds.size} cliente(s)`)
      setSelectedIds(new Set())
      setShowTagDialog(false)
      fetchClients()
    } catch {
      toast.error('Erro ao adicionar tag')
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleBulkArchive() {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/clients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'archived' }),
          })
        )
      )
      toast.success(`${selectedIds.size} cliente(s) arquivado(s)`)
      setSelectedIds(new Set())
      setShowArchiveDialog(false)
      fetchClients()
    } catch {
      toast.error('Erro ao arquivar clientes')
    } finally {
      setBulkLoading(false)
    }
  }

  // ── Export CSV ───────────────────────────────────────────
  async function handleExport() {
    try {
      const params = new URLSearchParams()
      params.set('export', 'csv')
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (segmentFilter) params.set('segment', segmentFilter)
      if (responsibleFilter) params.set('responsibleId', responsibleFilter)

      const res = await fetch(`/api/clients?${params.toString()}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exportação realizada com sucesso')
    } catch {
      toast.error('Erro ao exportar clientes')
    }
  }

  // ── Collect unique segments from clients ────────────────
  const segments = Array.from(new Set(clients.map(c => c.segment).filter(Boolean) as string[])).sort()
  const allTags = Array.from(new Set(clients.flatMap(c => c.tagsList))).sort((a, b) => a.name.localeCompare(b.name))

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <PageTour steps={EMPRESAS_TOUR_STEPS} active={tourActive} onFinish={finishTour} />
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" data-tour="emp-header">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os clientes da sua organização
              {!loading && <span className="ml-1">· {total} total</span>}
            </p>
          </div>
          <TourRestartButton onClick={startTour} />
        </div>
        <div className="flex items-center gap-2" data-tour="emp-actions">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Importar CSV em breve disponível')}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button size="sm" onClick={() => router.push('/app/empresas/nova')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center" data-tour="emp-search">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, nome fantasia ou CNPJ..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {(statusFilter || segmentFilter || responsibleFilter || tagFilter) && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {[statusFilter, segmentFilter, responsibleFilter, tagFilter].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Segmento</Label>
            <Select value={segmentFilter} onValueChange={v => setSegmentFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {segments.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Responsável</Label>
            <Select value={responsibleFilter} onValueChange={v => setResponsibleFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tag</Label>
            <Select value={tagFilter} onValueChange={v => setTagFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {allTags.map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto self-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('')
                setSegmentFilter('')
                setResponsibleFilter('')
                setTagFilter('')
              }}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Limpar
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="h-4 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={() => setShowResponsibleDialog(true)}>
            <UserPlus className="mr-2 h-3.5 w-3.5" />
            Alterar Responsável
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTagDialog(true)}>
            <Tag className="mr-2 h-3.5 w-3.5" />
            Adicionar Tag
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowArchiveDialog(true)} className="text-amber-600 hover:text-amber-700">
            <Archive className="mr-2 h-3.5 w-3.5" />
            Arquivar
          </Button>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm" data-tour="emp-table">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    ref={el => {
                      if (el) el.dataset.state = someSelected ? 'indeterminate' : ''
                    }}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Nome Fantasia</TableHead>
                <TableHead className="min-w-[160px]">CNPJ</TableHead>
                <TableHead className="min-w-[140px]">Regime</TableHead>
                <TableHead className="min-w-[150px]">Responsável</TableHead>
                <TableHead className="text-center">Templates Ativos</TableHead>
                <TableHead className="text-center">Tarefas Atrasadas</TableHead>
                <TableHead className="min-w-[120px]">Próxima Data</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="mx-auto h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="mx-auto h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-64">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Nenhum cliente cadastrado</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Comece adicionando seu primeiro cliente para gerenciar suas obrigações.
                        </p>
                      </div>
                      <Button onClick={() => router.push('/app/empresas/nova')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Cliente
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map(client => {
                  const responsible = members.find(m => String(m.id) === String(client.responsible))
                  return (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer transition-colors"
                      onClick={() => router.push(`/app/empresas/${client.id}`)}
                    >
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={() => toggleOne(client.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{client.tradeName || client.name}</p>
                            {client.tradeName && client.tradeName !== client.name && (
                              <p className="truncate text-xs text-muted-foreground">{client.name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{formatCNPJ(client.cnpj)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {client.taxRegime || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{responsible?.name || '—'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{client.applications?.length || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {client.pendingTasks > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {client.pendingTasks}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getNextDate(client) || '—'}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && clients.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bulk: Change Responsible Dialog ────────────────── */}
      <Dialog open={showResponsibleDialog} onOpenChange={setShowResponsibleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Responsável</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Selecione o novo responsável para {selectedIds.size} cliente(s) selecionado(s).
            </p>
            <Select value={bulkResponsibleId} onValueChange={setBulkResponsibleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                {members.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponsibleDialog(false)}>Cancelar</Button>
            <Button onClick={handleBulkResponsible} disabled={!bulkResponsibleId || bulkLoading}>
              {bulkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk: Add Tag Dialog ───────────────────────────── */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Selecione a tag para adicionar a {selectedIds.size} cliente(s) selecionado(s).
            </p>
            <Select value={bulkTagId} onValueChange={setBulkTagId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tag" />
              </SelectTrigger>
              <SelectContent>
                {allTags.map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>Cancelar</Button>
            <Button onClick={handleBulkTag} disabled={!bulkTagId || bulkLoading}>
              {bulkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk: Archive Dialog ───────────────────────────── */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Arquivar Clientes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja arquivar {selectedIds.size} cliente(s)?
              Eles não aparecerão na lista principal, mas poderão ser restaurados depois.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBulkArchive} disabled={bulkLoading}>
              {bulkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}