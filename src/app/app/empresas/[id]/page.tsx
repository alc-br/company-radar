'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Layers,
  Archive,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  MessageSquare,
  Settings,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Briefcase,
  Ruler,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Copy,
  Contact2,
  ToggleLeft,
  ToggleRight,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  hasPortalAccess: boolean
  notes: string | null
  createdAt: string
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assignedTo: string | null
  templateApplicationId: string | null
}

interface TemplateApplication {
  id: string
  baseDate: string
  status: string
  createdAt: string
  template: { id: string; name: string } | null
  templateVersion: { id: string; versionNumber: number; name: string | null } | null
}

interface Document {
  id: string
  name: string
  status: string
  competence: string | null
  createdAt: string
}

interface ClientData {
  id: string
  name: string
  tradeName: string | null
  cnpj: string
  ie: string | null
  im: string | null
  cnae: string | null
  taxRegime: string | null
  companySize: string | null
  segment: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  openDate: string | null
  status: string
  responsibleId: string | null
  notes: string | null
  portalAccess: boolean
  serviceStartDate: string | null
  tagsList: Array<{ id: string; name: string; color: string }>
  contacts: Contact[]
  tasks: Task[]
  documents: Document[]
  applications: TemplateApplication[]
  count: { tasks: number; documents: number; contacts: number }
  overdueTasksCount: number
  activeApplicationsCount: number
  nextDueDate: string | null
}

// ── Helpers ────────────────────────────────────────────────
function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
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

function getHealthIndicator(overdue: number) {
  if (overdue === 0) return { color: 'bg-emerald-500', label: 'Em dia', text: 'text-emerald-600' }
  if (overdue <= 3) return { color: 'bg-amber-500', label: 'Atenção', text: 'text-amber-600' }
  return { color: 'bg-red-500', label: 'Crítico', text: 'text-red-600' }
}

function getTaskStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    a_fazer: { label: 'A fazer', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-0' },
    em_andamento: { label: 'Em andamento', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-0' },
    concluida: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0' },
    pending: { label: 'Pendente', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-0' },
    overdue: { label: 'Atrasada', className: 'bg-red-100 text-red-700 hover:bg-red-100 border-0' },
  }
  const s = map[status] || { label: status, className: '' }
  return <Badge className={s.className}>{s.label}</Badge>
}

// ── Page ───────────────────────────────────────────────────
export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('resumo')

  // Contacts state
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', role: '', notes: '', hasPortalAccess: false, password: '' })
  const [contactSaving, setContactSaving] = useState(false)

  // Comment state
  const [comments, setComments] = useState<Array<{ id: string; userName: string; content: string; createdAt: string }>>([])
  const [newComment, setNewComment] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)

  // Portal state
  const [portalAccess, setPortalAccess] = useState(false)
  const [portalSaving, setPortalSaving] = useState(false)

  // Archive confirmation
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  useEffect(() => {
    fetchClient()
  }, [id])

  async function fetchClient() {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setClient(data)
      setPortalAccess(data.portalAccess)
      // Build comments from tasks
      const allComments: Array<{ id: string; userName: string; content: string; createdAt: string }> = []
      if (data.tasks) {
        data.tasks.forEach((t: Task & { comments?: Array<{ id: string; userName: string; content: string; createdAt: string }> }) => {
          if ((t as Record<string, unknown>).comments && Array.isArray((t as Record<string, unknown>).comments)) {
            ;((t as Record<string, unknown>).comments as Array<{ id: string; userName: string; content: string; createdAt: string }>).forEach(c => {
              allComments.push(c)
            })
          }
        })
      }
      setComments(allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch {
      toast.error('Cliente não encontrado')
      router.push('/app/empresas')
    } finally {
      setLoading(false)
    }
  }

  // ── Contact CRUD ─────────────────────────────────────────
  function openNewContact() {
    setEditingContact(null)
    setContactForm({ name: '', email: '', phone: '', role: '', notes: '', hasPortalAccess: false, password: '' })
    setShowContactDialog(true)
  }

  function openEditContact(c: Contact) {
    setEditingContact(c)
    setContactForm({
      name: c.name, email: c.email || '', phone: c.phone || '', role: c.role || '',
      notes: c.notes || '', hasPortalAccess: c.hasPortalAccess, password: '',
    })
    setShowContactDialog(true)
  }

  async function saveContact() {
    if (!contactForm.name.trim()) return
    if (contactForm.hasPortalAccess && !editingContact && !contactForm.password) {
      toast.error('Defina uma senha para o acesso ao portal.')
      return
    }
    if (contactForm.hasPortalAccess && contactForm.password && contactForm.password.length < 8) {
      toast.error('A senha do portal deve ter no mínimo 8 caracteres.')
      return
    }
    setContactSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        role: contactForm.role.trim(),
        notes: contactForm.notes.trim(),
        hasPortalAccess: contactForm.hasPortalAccess,
      }
      if (contactForm.password) body.password = contactForm.password

      const res = editingContact
        ? await fetch(`/api/client-contacts/${editingContact.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/clients/${id}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Erro ao salvar contato')
        return
      }

      toast.success(editingContact ? 'Contato atualizado' : 'Contato criado')
      setShowContactDialog(false)
      fetchClient()
    } catch {
      toast.error('Erro ao salvar contato')
    } finally {
      setContactSaving(false)
    }
  }

  async function deleteContact(contactId: string) {
    if (!confirm('Excluir este contato?')) return
    try {
      const res = await fetch(`/api/client-contacts/${contactId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Contato excluído')
      fetchClient()
    } catch {
      toast.error('Erro ao excluir contato')
    }
  }

  // ── Comment ──────────────────────────────────────────────
  async function addComment() {
    if (!newComment.trim()) return
    setCommentSaving(true)
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: (client?.notes ? client.notes + '\n' : '') + `[${new Date().toLocaleDateString('pt-BR')}] ${newComment}`,
        }),
      })
      setNewComment('')
      fetchClient()
      toast.success('Comentário adicionado')
    } catch {
      toast.error('Erro ao adicionar comentário')
    } finally {
      setCommentSaving(false)
    }
  }

  // ── Portal toggle ────────────────────────────────────────
  async function togglePortal() {
    setPortalSaving(true)
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalAccess: !portalAccess }),
      })
      setPortalAccess(!portalAccess)
      toast.success(portalAccess ? 'Portal desativado' : 'Portal ativado')
    } catch {
      toast.error('Erro ao alterar portal')
    } finally {
      setPortalSaving(false)
    }
  }

  // ── Archive ──────────────────────────────────────────────
  async function handleArchive() {
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      toast.success('Cliente arquivado')
      router.push('/app/empresas')
    } catch {
      toast.error('Erro ao arquivar')
    }
  }

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-2xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!client) return null

  const health = getHealthIndicator(client.overdueTasksCount || 0)
  const overdueTasks = client.tasks.filter(t => t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'concluida'))
  const activeApplications = client.applications.filter(a => a.status === 'active')

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="mt-1" onClick={() => router.push('/app/empresas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{client.tradeName || client.name}</h1>
              {getStatusBadge(client.status)}
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${health.color}`} />
                <span className={`text-sm font-medium ${health.text}`}>{health.label}</span>
              </div>
            </div>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{formatCNPJ(client.cnpj)}</p>
            {client.name !== client.tradeName && client.tradeName && (
              <p className="text-sm text-muted-foreground">Razão Social: {client.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => router.push(`/app/empresas/${id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/app/empresas/${id}/aplicar-template`)}>
            <Layers className="mr-2 h-4 w-4" />
            Aplicar Template
          </Button>
          <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700" onClick={() => setShowArchiveDialog(true)}>
            <Archive className="mr-2 h-4 w-4" />
            Arquivar
          </Button>
        </div>
      </div>

      {/* ── Quick Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{client.count.tasks}</p>
              <p className="text-xs text-muted-foreground">Tarefas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
              <p className="text-xs text-muted-foreground">Atrasadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeApplications.length}</p>
              <p className="text-xs text-muted-foreground">Templates Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{client.count.documents}</p>
              <p className="text-xs text-muted-foreground">Documentos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas ({client.count.tasks})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({activeApplications.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({client.count.documents})</TabsTrigger>
          <TabsTrigger value="contatos">Contatos ({client.count.contacts})</TabsTrigger>
          <TabsTrigger value="comentarios">Comentários</TabsTrigger>
          <TabsTrigger value="portal">Portal</TabsTrigger>
        </TabsList>

        {/* ── TAB: Resumo ──────────────────────────────────── */}
        <TabsContent value="resumo" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados Cadastrais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Razão Social" value={client.name} />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Nome Fantasia" value={client.tradeName} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="CNPJ" value={formatCNPJ(client.cnpj)} mono />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Inscrição Estadual" value={client.ie} />
                <InfoRow icon={<Hash className="h-4 w-4" />} label="Inscrição Municipal" value={client.im} />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="CNAE" value={client.cnae} mono />
                <InfoRow icon={<Ruler className="h-4 w-4" />} label="Regime Tributário" value={client.taxRegime} />
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Porte" value={client.companySize} />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Segmento" value={client.segment} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Data de Abertura" value={formatDate(client.openDate)} />
                {client.tagsList.length > 0 && (
                  <div className="flex items-start gap-3 pt-2">
                    <div className="mt-0.5 text-muted-foreground"><Briefcase className="h-4 w-4" /></div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {client.tagsList.map(t => (
                          <Badge key={t.id} variant="secondary" style={{ borderColor: t.color }} className="text-xs">{t.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contato e Endereço</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={client.email} />
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={client.phone} />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Endereço" value={client.address} />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Cidade" value={client.city ? `${client.city} - ${client.state || ''}` : null} />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="CEP" value={client.zipCode} mono />
                </CardContent>
              </Card>

              {client.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{client.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: Tarefas ─────────────────────────────────── */}
        <TabsContent value="tarefas" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tarefas do Cliente</CardTitle>
              <Button size="sm" variant="outline" onClick={() => router.push('/app/tarefas?clientId=' + id)}>
                Ver todas <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {client.tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhuma tarefa encontrada para este cliente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Responsável</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium max-w-[300px] truncate">{task.title}</TableCell>
                        <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">{task.priority}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(task.dueDate)}</TableCell>
                        <TableCell className="text-sm">{task.assignedTo || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Templates ───────────────────────────────── */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Templates Aplicados</CardTitle>
              <Button size="sm" onClick={() => router.push(`/app/empresas/${id}/aplicar-template`)}>
                <Plus className="mr-2 h-4 w-4" />
                Aplicar Template
              </Button>
            </CardHeader>
            <CardContent>
              {client.applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum template aplicado a este cliente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Versão</TableHead>
                      <TableHead>Data Base</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.applications.map(app => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.template?.name || '—'}</TableCell>
                        <TableCell className="text-sm">v{app.templateVersion?.versionNumber || '?'}</TableCell>
                        <TableCell className="text-sm">{formatDate(app.baseDate)}</TableCell>
                        <TableCell className="text-sm">{formatDate(app.createdAt)}</TableCell>
                        <TableCell>
                          <Badge className={app.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0' : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-0'}>
                            {app.status === 'active' ? 'Ativo' : app.status === 'completed' ? 'Concluído' : app.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Documentos ──────────────────────────────── */}
        <TabsContent value="documentos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Documentos</CardTitle>
              <Button size="sm" variant="outline" onClick={() => router.push('/app/documentos?clientId=' + id)}>
                Ver todos <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {client.documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum documento encontrado para este cliente</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.documents.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell className="text-sm">{doc.competence || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">{doc.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(doc.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Contatos ────────────────────────────────── */}
        <TabsContent value="contatos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Contatos</CardTitle>
              <Button size="sm" onClick={openNewContact}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Contato
              </Button>
            </CardHeader>
            <CardContent>
              {client.contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Contact2 className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum contato cadastrado</p>
                </div>
              ) : (
                <div className="divide-y">
                  {client.contacts.map(contact => (
                    <div key={contact.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {contact.role && <span>{contact.role}</span>}
                            {contact.email && <span>{contact.email}</span>}
                            {contact.phone && <span>{contact.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.hasPortalAccess && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-xs">Portal</Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditContact(contact)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteContact(contact.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Comentários ─────────────────────────────── */}
        <TabsContent value="comentarios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico e Comentários</CardTitle>
              <CardDescription>Anotações sobre o cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add comment */}
              <div className="flex gap-3">
                <Textarea
                  placeholder="Adicionar um comentário..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={addComment} disabled={!newComment.trim() || commentSaving} className="self-end">
                  {commentSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
                </Button>
              </div>

              <Separator />

              {/* Comments list */}
              {client.notes ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Observações do cliente</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">Nenhum comentário ainda</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {comments.map(c => (
                    <div key={c.id} className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{c.userName}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Portal ──────────────────────────────────── */}
        <TabsContent value="portal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações do Portal</CardTitle>
              <CardDescription>Gerencie o acesso do cliente ao portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${portalAccess ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                    <Shield className={`h-5 w-5 ${portalAccess ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium">Acesso ao Portal</p>
                    <p className="text-sm text-muted-foreground">
                      {portalAccess
                        ? 'O cliente pode acessar o portal para acompanhar tarefas e enviar documentos'
                        : 'O portal está desativado para este cliente'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {portalSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <button onClick={togglePortal} className="relative" aria-label="Toggle portal access">
                    {portalAccess ? (
                      <ToggleRight className="h-10 w-10 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-10 w-10 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 font-medium">Contatos com Acesso ao Portal</h3>
                {client.contacts.filter(c => c.hasPortalAccess).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum contato com acesso ao portal</p>
                ) : (
                  <div className="space-y-2">
                    {client.contacts.filter(c => c.hasPortalAccess).map(contact => (
                      <div key={contact.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{contact.name}</p>
                            {contact.email && <p className="text-xs text-muted-foreground">{contact.email}</p>}
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
                          Acesso ativo
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Contact Dialog ──────────────────────────────────── */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Nome completo"
                value={contactForm.name}
                onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={contactForm.email}
                onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={contactForm.phone}
                onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo/Função</Label>
              <Input
                placeholder="Ex: Diretor Financeiro"
                value={contactForm.role}
                onChange={e => setContactForm(p => ({ ...p, role: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações sobre o contato..."
                value={contactForm.notes}
                onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Acesso ao portal</Label>
                <p className="text-xs text-muted-foreground">Permite que esse contato entre no portal do cliente.</p>
              </div>
              <Switch
                checked={contactForm.hasPortalAccess}
                onCheckedChange={checked => setContactForm(p => ({ ...p, hasPortalAccess: checked }))}
              />
            </div>
            {contactForm.hasPortalAccess && (
              <div className="space-y-2">
                <Label>{editingContact ? 'Nova senha (opcional)' : 'Senha do portal'}</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={contactForm.password}
                  onChange={e => setContactForm(p => ({ ...p, password: e.target.value }))}
                />
                {editingContact && (
                  <p className="text-xs text-muted-foreground">Deixe em branco para manter a senha atual.</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancelar</Button>
            <Button onClick={saveContact} disabled={!contactForm.name.trim() || contactSaving}>
              {contactSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Archive Dialog ──────────────────────────────────── */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Arquivar Cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja arquivar <strong>{client.tradeName || client.name}</strong>?
            O cliente não aparecerá na lista principal, mas poderá ser restaurado depois.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleArchive}>Arquivar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Info Row Component ────────────────────────────────────
function InfoRow({ icon, label, value, mono }: {
  icon: React.ReactNode
  label: string
  value: string | null | undefined
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}</span>
        <p className={`font-medium ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  )
}