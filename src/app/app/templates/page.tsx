'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Copy,
  Eye,
  Pencil,
  Send,
  Archive,
  Layers,
  Filter,
  X,
  Loader2,
  FileText,
  Users,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface TemplateRow {
  id: string
  name: string
  code: string | null
  description: string | null
  category: string | null
  color: string
  status: string
  currentVersion: number
  responsibleName: string | null
  stagesCount: number
  tasksCount: number
  _count: { versions: number; applications: number }
  department: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

interface OrgMember {
  id: string
  name: string
  email: string
  status: string
}

// ── Constants ──────────────────────────────────────────────
const CATEGORIES = [
  'Tributário', 'Contábil', 'Trabalhista', 'Societário',
  'Fiscal', 'Departamento Pessoal', 'SPED', 'Competência', 'Outro',
]

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicado', variant: 'default' },
  archived: { label: 'Arquivado', variant: 'outline' },
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

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// ── Page ───────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter()
  const session = getSession()

  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [members, setMembers] = useState<OrgMember[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Clone dialog
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [cloneId, setCloneId] = useState<string | null>(null)
  const [cloneName, setCloneName] = useState('')
  const [cloning, setCloning] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Archive dialog
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)

  // Fetch team members
  useEffect(() => {
    fetch('/api/team')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMembers((data || []).filter((m: OrgMember) => m.status === 'active')))
      .catch(() => {})
  }, [])

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (authorFilter) params.set('author', authorFilter)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/templates${query}`)
      if (res.ok) {
        setTemplates(await res.json())
      } else {
        toast.error('Erro ao carregar templates')
      }
    } catch {
      toast.error('Erro de conexão')
    }
    setLoading(false)
  }, [search, categoryFilter, statusFilter, authorFilter])

  useEffect(() => {
    const timer = setTimeout(fetchTemplates, 250)
    return () => clearTimeout(timer)
  }, [fetchTemplates])

  // Clone handler
  async function handleClone() {
    if (!cloneId || !cloneName.trim()) return
    setCloning(true)
    try {
      const src = templates.find((t) => t.id === cloneId)
      if (!src) return
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: session?.orgId,
          name: cloneName.trim(),
          code: null,
          description: src.description,
          category: src.category,
          color: src.color,
          purpose: null,
          instructions: null,
          warning: null,
          defaultPeriodicity: null,
          variables: [],
          stages: [],
        }),
      })
      if (res.ok) {
        toast.success('Template clonado com sucesso!')
        setCloneDialogOpen(false)
        setCloneId(null)
        setCloneName('')
        fetchTemplates()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao clonar')
      }
    } catch {
      toast.error('Erro ao clonar template')
    }
    setCloning(false)
  }

  // Delete handler
  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/templates/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Template excluído')
        setDeleteDialogOpen(false)
        setDeleteId(null)
        fetchTemplates()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao excluir')
      }
    } catch {
      toast.error('Erro ao excluir template')
    }
    setDeleting(false)
  }

  // Archive handler
  async function handleArchive() {
    if (!archiveId) return
    setArchiving(true)
    try {
      const res = await fetch(`/api/templates/${archiveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      if (res.ok) {
        toast.success('Template arquivado')
        setArchiveDialogOpen(false)
        setArchiveId(null)
        fetchTemplates()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao arquivar')
      }
    } catch {
      toast.error('Erro ao arquivar template')
    }
    setArchiving(false)
  }

  function openCloneDialog(id: string) {
    const t = templates.find((t) => t.id === id)
    setCloneId(id)
    setCloneName(t ? `${t.name} (cópia)` : '')
    setCloneDialogOpen(true)
  }

  function openDeleteDialog(id: string) {
    setDeleteId(id)
    setDeleteDialogOpen(true)
  }

  function openArchiveDialog(id: string) {
    setArchiveId(id)
    setArchiveDialogOpen(true)
  }

  const activeFilterCount = [categoryFilter, statusFilter, authorFilter].filter(Boolean).length

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus templates de processos e checklists
          </p>
        </div>
        <Button asChild>
          <Link href="/app/templates/novo">
            <Plus className="mr-2 h-4 w-4" />
            Criar Template
          </Link>
        </Button>
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar templates por nome, código ou descrição..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <div className="flex rounded-md border p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
              aria-label="Visualização em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
              aria-label="Visualização em lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Categoria</label>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Responsável</label>
            <Select value={authorFilter} onValueChange={(v) => setAuthorFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter('')
                setStatusFilter('')
                setAuthorFilter('')
              }}
              className="gap-1 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Nenhum template encontrado</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            {activeFilterCount > 0 || search
              ? 'Tente ajustar os filtros ou a busca'
              : 'Comece criando seu primeiro template de processo'}
          </p>
          <Button asChild className="mt-4">
            <Link href="/app/templates/novo">
              <Plus className="mr-2 h-4 w-4" />
              Criar Template
            </Link>
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ═══ Grid View ═══ */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.draft
            return (
              <Card key={t.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
                <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: t.color }} />
                <CardContent className="p-4 pl-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.category && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            {t.category}
                          </Badge>
                        )}
                        <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold leading-tight truncate" title={t.name}>
                        {t.name}
                      </h3>
                      {t.description && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/app/templates/${t.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </Link>
                        </DropdownMenuItem>
                        {t.status === 'draft' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/app/templates/${t.id}?tab=editor`}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {t.status === 'draft' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/app/templates/${t.id}/publicar`}>
                              <Send className="mr-2 h-4 w-4" /> Publicar
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openCloneDialog(t.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Clonar
                        </DropdownMenuItem>
                        {t.status !== 'archived' && (
                          <DropdownMenuItem onClick={() => openArchiveDialog(t.id)}>
                            <Archive className="mr-2 h-4 w-4" /> Arquivar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openDeleteDialog(t.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1" title="Versão">
                      <FileText className="h-3 w-3" /> v{t.currentVersion || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Usos">
                      <Users className="h-3 w-3" /> {t._count.applications}
                    </span>
                    {t.stagesCount > 0 && (
                      <span className="flex items-center gap-1" title="Etapas">
                        <Layers className="h-3 w-3" /> {t.stagesCount} etapa{t.stagesCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {t.tasksCount > 0 && (
                      <span className="flex items-center gap-1" title="Tarefas">
                        <FileText className="h-3 w-3" /> {t.tasksCount} tarefa{t.tasksCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {t.responsibleName && (
                      <span className="flex items-center gap-1 truncate max-w-[120px]" title={t.responsibleName}>
                        {t.responsibleName}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Atualizado em {formatDate(t.updatedAt)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* ═══ List View ═══ */
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Versão</TableHead>
                <TableHead className="hidden sm:table-cell">Usos</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => {
                const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG.draft
                return (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/app/templates/${t.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[200px]">{t.name}</p>
                          {t.code && <p className="text-[11px] text-muted-foreground font-mono">{t.code}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {t.category ? (
                        <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      v{t.currentVersion || 0}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {t._count.applications}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {t.responsibleName || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="text-[10px]">
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(t.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                            <Link href={`/app/templates/${t.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> Visualizar
                            </Link>
                          </DropdownMenuItem>
                          {t.status === 'draft' && (
                            <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                              <Link href={`/app/templates/${t.id}?tab=editor`}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {t.status === 'draft' && (
                            <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                              <Link href={`/app/templates/${t.id}/publicar`}>
                                <Send className="mr-2 h-4 w-4" /> Publicar
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openCloneDialog(t.id) }}>
                            <Copy className="mr-2 h-4 w-4" /> Clonar
                          </DropdownMenuItem>
                          {t.status !== 'archived' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openArchiveDialog(t.id) }}>
                              <Archive className="mr-2 h-4 w-4" /> Arquivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(t.id) }}
                          >
                            Excluir
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
      )}

      {/* ═══ Clone Dialog ═══ */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clonar Template</DialogTitle>
            <DialogDescription>Crie uma cópia deste template com um novo nome.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do novo template</label>
            <Input
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder="Nome do template"
              onKeyDown={(e) => e.key === 'Enter' && handleClone()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleClone} disabled={cloning || !cloneName.trim()}>
              {cloning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clonar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Dialog ═══ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Template</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Archive Dialog ═══ */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar Template</DialogTitle>
            <DialogDescription>
              O template será marcado como arquivado e não aparecerá nas buscas por padrão.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Cancelar</Button>
            <Button variant="secondary" onClick={handleArchive} disabled={archiving}>
              {archiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
