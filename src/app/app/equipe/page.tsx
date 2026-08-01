'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, MoreHorizontal, ShieldCheck, ShieldAlert,
  Mail, Loader2, X, Pencil, Ban, Send, Trash2, Search, UserCog, Building2, Plus, Loader,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

function formatDate(d?: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário', admin: 'Administrador',
  collaborator: 'Colaborador', viewer: 'Visualizador',
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  owner: ShieldAlert, admin: ShieldCheck, collaborator: Users, viewer: Users,
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-green-50 text-green-700 border-green-200' },
  invited: { label: 'Convidado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  suspended: { label: 'Suspenso', color: 'bg-red-50 text-red-700 border-red-200' },
}

type Member = {
  id: string; name: string; email: string; role: string; status: string;
  departmentId: string | null; businessUnitId: string | null; lastAccess: string | null; createdAt: string;
  department?: { id: string; name: string; color: string } | null;
  businessUnit?: { id: string; name: string } | null;
  user?: { id: string; email: string; avatar: string | null } | null;
}

type Department = { id: string; name: string; description: string | null; color: string; managerId: string | null; _count?: { members: number; templates: number } }

export default function EquipePage() {
  const [members, setMembers] = useState<Member[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('membros')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deptOpen, setDeptOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'collaborator', departmentId: '' })
  const [deptForm, setDeptForm] = useState({ name: '', description: '', color: '#3b82f6', editId: '' })
  const [submitting, setSubmitting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; memberId: string; memberName: string }>({ open: false, action: '', memberId: '', memberName: '' })

  const fetchData = useCallback(async () => {
    try {
      const [memberRes, deptRes] = await Promise.all([fetch('/api/team'), fetch('/api/team?include=departments')])
      if (memberRes.ok) { const d = await memberRes.json(); setMembers(Array.isArray(d) ? d : []) }
      if (deptRes.ok) { const d = await deptRes.json(); setDepartments(Array.isArray(d) ? d : []) }
    } catch { toast.error('Erro ao carregar equipe') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const activeMembers = members.filter((m) => m.status === 'active')
  const invitedMembers = members.filter((m) => m.status === 'invited')

  const filteredActive = activeMembers.filter((m) => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

  async function handleInvite() {
    if (!inviteForm.name || !inviteForm.email) { toast.error('Nome e e-mail são obrigatórios'); return }
    setSubmitting(true)
    try {
      const session = JSON.parse(localStorage.getItem('cr_session') || '{}')
      const res = await fetch('/api/team', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inviteForm, organizationId: session.orgId }),
      })
      if (res.ok) { toast.success('Convite enviado com sucesso!'); setInviteOpen(false); setInviteForm({ name: '', email: '', role: 'collaborator', departmentId: '' }); fetchData() }
      else { const err = await res.json(); toast.error(err.error || 'Erro ao convidar') }
    } catch { toast.error('Erro ao convidar membro') } finally { setSubmitting(false) }
  }

  async function handleMemberAction(memberId: string, status: string) {
    try {
      const res = await fetch('/api/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: memberId, status }) })
      if (res.ok) { toast.success('Ação realizada com sucesso'); fetchData() }
    } catch { toast.error('Erro ao realizar ação') }
  }

  async function handleConfirmAction() {
    const { memberId, action } = confirmDialog
    try {
      let body: Record<string, string> = { id: memberId }
      if (action === 'suspend') body.status = 'suspended'
      if (action === 'remove') body.status = 'removed'
      const res = await fetch('/api/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast.success('Ação realizada com sucesso'); setConfirmDialog({ open: false, action: '', memberId: '', memberName: '' }); fetchData() }
    } catch { toast.error('Erro ao realizar ação') }
  }

  async function handleResendInvite(memberId: string) {
    try {
      const res = await fetch('/api/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: memberId, status: 'invited' }) })
      if (res.ok) toast.success('Convite reenviado com sucesso!')
    } catch { toast.error('Erro ao reenviar convite') }
  }

  function openEditDept(dept?: Department) {
    if (dept) setDeptForm({ name: dept.name, description: dept.description || '', color: dept.color, editId: dept.id })
    else setDeptForm({ name: '', description: '', color: '#3b82f6', editId: '' })
    setDeptOpen(true)
  }

  async function handleSaveDept() {
    if (!deptForm.name) { toast.error('Nome é obrigatório'); return }
    setSubmitting(true)
    try {
      const session = JSON.parse(localStorage.getItem('cr_session') || '{}')
      if (deptForm.editId) {
        const res = await fetch(`/api/departments/${deptForm.editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptForm) })
        if (res.ok) { toast.success('Departamento atualizado'); setDeptOpen(false); fetchData() }
      } else {
        const res = await fetch('/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...deptForm, organizationId: session.orgId }) })
        if (res.ok) { toast.success('Departamento criado'); setDeptOpen(false); fetchData() }
      }
    } catch { toast.error('Erro ao salvar departamento') } finally { setSubmitting(false) }
  }

  function MemberRow({ m }: { m: Member }) {
    const st = STATUS_MAP[m.status] || STATUS_MAP.active
    const RoleIcon = ROLE_ICONS[m.role] || Users
    return (
      <TableRow className="group">
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(m.name)}</AvatarFallback></Avatar>
            <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
          </div>
        </TableCell>
        <TableCell><div className="flex items-center gap-1.5"><RoleIcon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-sm">{ROLE_LABELS[m.role] || m.role}</span></div></TableCell>
        <TableCell className="text-sm text-muted-foreground">{m.department?.name || '—'}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{m.businessUnit?.name || '—'}</TableCell>
        <TableCell><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span></TableCell>
        <TableCell className="text-sm text-muted-foreground">{formatDate(m.lastAccess)}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Editar Papel</DropdownMenuItem>
              {m.status === 'active' && <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'suspend', memberId: m.id, memberName: m.name })}><Ban className="mr-2 h-4 w-4" /> Suspender</DropdownMenuItem>}
              {m.status === 'invited' && <DropdownMenuItem onClick={() => handleResendInvite(m.id)}><Send className="mr-2 h-4 w-4" /> Reenviar Convite</DropdownMenuItem>}
              {m.status === 'suspended' && <DropdownMenuItem onClick={() => handleMemberAction(m.id, 'active')}><ShieldCheck className="mr-2 h-4 w-4" /> Reativar</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDialog({ open: true, action: 'remove', memberId: m.id, memberName: m.name })}><Trash2 className="mr-2 h-4 w-4" /> Remover</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }

  function renderMembers() {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar membros..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Button size="sm" onClick={() => setInviteOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Convidar</Button>
        </div>
        <div className="rounded-lg border bg-white">
          {loading ? (<div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>) : filteredActive.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><Users className="h-12 w-12 text-muted-foreground/40 mb-4" /><h3 className="text-sm font-medium">Nenhum membro encontrado</h3><p className="text-sm text-muted-foreground mt-1">Convide membros para sua equipe.</p></div>
          ) : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="min-w-[220px]">Membro</TableHead><TableHead>Papel</TableHead><TableHead>Departamento</TableHead><TableHead>Unidade</TableHead><TableHead>Status</TableHead><TableHead>Último Acesso</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader><TableBody>{filteredActive.map((m) => <MemberRow key={m.id} m={m} />)}</TableBody></Table></div>
          )}
        </div>
      </div>
    )
  }

  function renderDepartments() {
    return (
      <div className="space-y-4">
        <div className="flex justify-end"><Button size="sm" onClick={() => openEditDept()}><Plus className="mr-2 h-4 w-4" /> Novo Departamento</Button></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.length === 0 ? (<Card><CardContent className="flex flex-col items-center justify-center py-12"><Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" /><p className="text-sm text-muted-foreground">Nenhum departamento criado</p></CardContent></Card>) : departments.map((dept) => (
            <Card key={dept.id} className="group">
              <CardHeader className="pb-3"><div className="flex items-center gap-3"><div className="h-3 w-10 rounded-full" style={{ backgroundColor: dept.color }} /><CardTitle className="text-base">{dept.name}</CardTitle></div>{dept.description && <CardDescription className="text-xs">{dept.description}</CardDescription>}</CardHeader>
              <CardContent><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{dept._count?.members || 0} membros</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDept(dept)}><Pencil className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setConfirmDialog({ open: true, action: 'remove', memberId: dept.id, memberName: dept.name })}><Trash2 className="h-3 w-3" /></Button></div></div></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  function renderInvites() {
    return (
      <div className="rounded-lg border bg-white">
        {invitedMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center"><Mail className="h-12 w-12 text-muted-foreground/40 mb-4" /><h3 className="text-sm font-medium">Nenhum convite pendente</h3><p className="text-sm text-muted-foreground mt-1">Todos os convites foram aceitos.</p></div>
        ) : (
          <div className="divide-y">
            {invitedMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">{getInitials(m.name)}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.email}</p><p className="text-[10px] text-muted-foreground mt-0.5">Convidado em {formatDate(m.createdAt)}</p></div></div>
                <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => handleResendInvite(m.id)}><Send className="mr-1.5 h-3 w-3" /> Reenviar</Button><Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDialog({ open: true, action: 'remove', memberId: m.id, memberName: m.name })}><X className="mr-1.5 h-3 w-3" /> Revogar</Button></div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Equipe</h1><p className="text-sm text-muted-foreground">Gerencie membros, departamentos e convites</p></div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="membros">Membros{activeMembers.length > 0 && <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-[10px]">{activeMembers.length}</Badge>}</TabsTrigger><TabsTrigger value="departamentos">Departamentos{departments.length > 0 && <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-[10px]">{departments.length}</Badge>}</TabsTrigger><TabsTrigger value="convites">Convites{invitedMembers.length > 0 && <Badge variant="secondary" className="ml-2 h-5 min-w-5 text-[10px]">{invitedMembers.length}</Badge>}</TabsTrigger></TabsList>
        <TabsContent value="membros" className="mt-4">{renderMembers()}</TabsContent>
        <TabsContent value="departamentos" className="mt-4">{renderDepartments()}</TabsContent>
        <TabsContent value="convites" className="mt-4">{renderInvites()}</TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Convidar Membro</DialogTitle><DialogDescription>Envie um convite para que a pessoa se junte à equipe.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Nome *</Label><Input value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="Nome completo" /></div>
          <div className="grid gap-2"><Label>E-mail *</Label><Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="email@exemplo.com" /></div>
          <div className="grid gap-2"><Label>Papel</Label><Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ROLE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button><Button onClick={handleInvite} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar Convite</Button></DialogFooter>
      </DialogContent></Dialog>

      {/* Department Dialog */}
      <Dialog open={deptOpen} onOpenChange={setDeptOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{deptForm.editId ? 'Editar' : 'Novo'} Departamento</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Nome *</Label><Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Nome do departamento" /></div>
          <div className="grid gap-2"><Label>Descrição</Label><Input value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} placeholder="Descrição opcional" /></div>
          <div className="grid gap-2"><Label>Cor</Label><div className="flex items-center gap-3"><Input type="color" value={deptForm.color} onChange={(e) => setDeptForm({ ...deptForm, color: e.target.value })} className="h-10 w-16 cursor-pointer" /><span className="text-sm text-muted-foreground">{deptForm.color}</span></div></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setDeptOpen(false)}>Cancelar</Button><Button onClick={handleSaveDept} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{deptForm.editId ? 'Salvar' : 'Criar'}</Button></DialogFooter>
      </DialogContent></Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog({ ...confirmDialog, open: o })}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Confirmar ação</DialogTitle><DialogDescription>Tem certeza que deseja {confirmDialog.action === 'suspend' ? 'suspender' : 'remover'} <strong>{confirmDialog.memberName}</strong>?</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancelar</Button><Button variant="destructive" onClick={handleConfirmAction}>Confirmar</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  )
}
