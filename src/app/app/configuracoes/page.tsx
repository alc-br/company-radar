'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Settings, Save, Building2, Plus, Pencil, Trash2, X,
  Shield, History, Loader2, Search, Download, Globe, Palette, Lock, ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

type OrgSettings = { name: string; tradeName: string; cnpj: string; email: string; phone: string; logo: string | null; timezone: string; primaryColor: string; settings: Record<string, unknown> }
type AuditLog = { id: string; userName: string | null; action: string; entity: string | null; entityId: string | null; detail: string | null; ip: string | null; createdAt: string }

// Chaves sem underscore antes do numero: "alert_30" sofreria camelCase no
// round-trip do backend (djangorestframework-camel-case) e viraria "alert30"
// na resposta, perdendo o valor salvo no proximo carregamento.
const DEFAULT_ALERTS = [
  { key: 'alert30', label: '30 dias antes', value: 30 }, { key: 'alert15', label: '15 dias antes', value: 15 },
  { key: 'alert7', label: '7 dias antes', value: 7 }, { key: 'alert3', label: '3 dias antes', value: 3 },
  { key: 'alert1', label: '1 dia antes', value: 1 }, { key: 'alert0', label: 'No dia', value: 0 },
]

const TIMEZONES = ['America/Sao_Paulo', 'America/Manaus', 'America/Belem', 'America/Fortaleza', 'America/Recife', 'America/Cuiaba', 'America/Porto_Velho', 'America/Rio_Branco', 'America/Campo_Grande']

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState('organizacao')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [org, setOrg] = useState<OrgSettings>({ name: '', tradeName: '', cnpj: '', email: '', phone: '', logo: null, timezone: 'America/Sao_Paulo', primaryColor: '#2563eb', settings: {} })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditPage, setAuditPage] = useState(1)
  const [auditSearch, setAuditSearch] = useState('')
  const [crudOpen, setCrudOpen] = useState(false)
  const [crudForm, setCrudForm] = useState({ name: '', color: '#6b7280', category: '', allowedFormats: 'pdf,doc,docx,xls,xlsx,jpg,png' })
  const [crudType, setCrudType] = useState<'tag' | 'doctype'>('tag')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [crudSaving, setCrudSaving] = useState(false)
  const [alerts, setAlerts] = useState<Record<string, boolean>>({ alert30: true, alert15: true, alert7: true, alert3: false, alert1: false, alert0: false })
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [docTypes, setDocTypes] = useState<Array<{ id: string; name: string; category: string | null; allowedFormats: string }>>([])
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [passwordMinLength, setPasswordMinLength] = useState(8)
  const [auditRetentionDays, setAuditRetentionDays] = useState('365')
  const [sessions, setSessions] = useState<Array<{ id: string; expiresAt: string }>>([])
  const [privacySubmitting, setPrivacySubmitting] = useState<string | null>(null)

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const d = await res.json()
        setOrg({ name: d.name || '', tradeName: d.tradeName || '', cnpj: d.cnpj || '', email: d.email || '', phone: d.phone || '', logo: d.logo, timezone: d.timezone || 'America/Sao_Paulo', primaryColor: d.primaryColor || '#2563eb', settings: d.settings || {} })
        setAlerts(d.settings?.alerts || { alert30: true, alert15: true, alert7: true })
        setPasswordMinLength(d.passwordMinLength || 8)
        setAuditRetentionDays(String(d.auditRetentionDays || 365))
        setSessions(Array.isArray(d.sessions) ? d.sessions : [])
      }
      // Fetch tags and doc types
      const [tagRes, dtRes] = await Promise.all([fetch('/api/tags'), fetch('/api/document-types')])
      if (tagRes.ok) { const d = await tagRes.json(); setTags(Array.isArray(d) ? d : []) }
      if (dtRes.ok) { const d = await dtRes.json(); setDocTypes(Array.isArray(d) ? d : []) }
    } catch {} finally { setLoading(false) }
  }, [])

  const fetchAudit = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(auditPage), limit: '20' })
      if (auditSearch) params.set('action', auditSearch)
      const res = await fetch(`/api/audit?${params}`)
      if (res.ok) { const d = await res.json(); setAuditLogs(d.logs || []); setAuditTotal(d.total || 0) }
    } catch {}
  }, [auditPage, auditSearch])

  useEffect(() => { fetchOrg() }, [fetchOrg])
  useEffect(() => { if (tab === 'auditoria') fetchAudit() }, [tab, fetchAudit])

  async function saveOrg() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...org, passwordMinLength, auditRetentionDays: Number(auditRetentionDays), settings: { ...org.settings, alerts } }),
      })
      const msg = res.ok ? 'Configurações salvas!' : 'Erro ao salvar'
      if (res.ok) toast.success(msg); else toast.error(msg)
    } catch (_e) { toast.error('Erro ao salvar') } finally { setSaving(false) }
  }

  async function uploadLogo(file: File) {
    if (!['image/png', 'image/jpeg'].includes(file.type)) { toast.error('Envie um arquivo PNG ou JPG.'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Arquivo maior que 2MB.'); return }
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/settings/logo', { method: 'POST', body: fd })
      if (res.ok) {
        const data = await res.json()
        setOrg((prev) => ({ ...prev, logo: data.logo }))
        toast.success('Logotipo atualizado!')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Erro ao enviar logotipo')
      }
    } catch {
      toast.error('Erro ao enviar logotipo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handlePrivacyRequest(action: 'data_export_requested' | 'lgpd_request') {
    setPrivacySubmitting(action)
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      if (res.ok) {
        toast.success(action === 'lgpd_request' ? 'Solicitação LGPD registrada. Entraremos em contato em até 15 dias.' : 'Exportação solicitada e registrada. Você será notificado quando estiver pronta.')
      } else {
        toast.error('Erro ao registrar solicitação')
      }
    } catch { toast.error('Erro ao registrar solicitação') } finally { setPrivacySubmitting(null) }
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'audit', format: 'csv' }) })
      const data = await res.json()
      if (!res.ok || !data.downloadUrl) { toast.error(data.error || 'Erro ao gerar exportação'); return }
      const a = document.createElement('a')
      a.href = data.downloadUrl
      a.download = 'auditoria.csv'
      a.click()
      toast.success('Exportação gerada com sucesso.')
    } catch { toast.error('Erro ao exportar') }
  }

  function openCrud(type: typeof crudType, edit?: { id: string; name: string; color: string; category?: string }) {
    setCrudType(type)
    setEditingId(edit?.id ?? null)
    setCrudForm(edit ? { name: edit.name, color: edit.color, category: edit.category || '', allowedFormats: 'pdf,doc,docx,xls,xlsx,jpg,png' } : { name: '', color: '#6b7280', category: '', allowedFormats: 'pdf,doc,docx,xls,xlsx,jpg,png' })
    setCrudOpen(true)
  }

  async function saveCrud() {
    if (!crudForm.name.trim()) { toast.error('Informe um nome.'); return }
    setCrudSaving(true)
    try {
      const isTag = crudType === 'tag'
      const url = editingId
        ? `/api/${isTag ? 'tags' : 'document-types'}/${editingId}`
        : `/api/${isTag ? 'tags' : 'document-types'}`
      const body = isTag
        ? { name: crudForm.name.trim(), color: crudForm.color }
        : { name: crudForm.name.trim(), category: crudForm.category.trim(), allowedFormats: crudForm.allowedFormats }
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Erro ao salvar'); return }
      toast.success('Salvo com sucesso!')
      setCrudOpen(false)
      fetchOrg()
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setCrudSaving(false)
    }
  }

  async function deleteCrud() {
    if (!editingId) return
    if (!confirm(`Excluir esta ${crudType === 'tag' ? 'tag' : 'tipo de documento'}?`)) return
    setCrudSaving(true)
    try {
      const url = `/api/${crudType === 'tag' ? 'tags' : 'document-types'}/${editingId}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Excluído com sucesso')
      setCrudOpen(false)
      fetchOrg()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setCrudSaving(false)
    }
  }

  function formatDate(d: string) { const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` }

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-60" />{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Configurações</h1><p className="text-sm text-muted-foreground">Gerencie as configurações da organização</p></div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1"><TabsTrigger value="organizacao">Organização</TabsTrigger><TabsTrigger value="campos">Campos e Classificações</TabsTrigger><TabsTrigger value="alertas">Alertas</TabsTrigger><TabsTrigger value="seguranca">Segurança</TabsTrigger><TabsTrigger value="auditoria">Auditoria</TabsTrigger><TabsTrigger value="privacidade">Dados e Privacidade</TabsTrigger></TabsList>

        {/* Organização */}
        <TabsContent value="organizacao" className="mt-4 space-y-4 max-w-2xl">
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Dados da Organização</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Razão Social</Label><Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Nome Fantasia</Label><Input value={org.tradeName} onChange={(e) => setOrg({ ...org, tradeName: e.target.value })} /></div>
              <div className="grid gap-2"><Label>CNPJ</Label><Input value={org.cnpj} onChange={(e) => setOrg({ ...org, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></div>
              <div className="grid gap-2"><Label>E-mail</Label><Input type="email" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Telefone</Label><Input value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
              <div className="grid gap-2"><Label>Fuso Horário</Label><Select value={org.timezone} onValueChange={(v) => setOrg({ ...org, timezone: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIMEZONES.map((tz) => (<SelectItem key={tz} value={tz}>{tz.replace('America/', '').replace(/_/g, ' ')}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> Cor Primária</Label><div className="flex items-center gap-3"><Input type="color" value={org.primaryColor} onChange={(e) => setOrg({ ...org, primaryColor: e.target.value })} className="h-10 w-16 cursor-pointer" /><span className="text-sm text-muted-foreground">{org.primaryColor}</span></div></div>
            <div className="grid gap-2">
              <Label>Logotipo</Label>
              <div className="flex items-center gap-4">
                {org.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logo} alt="Logotipo" className="h-14 w-14 rounded-lg object-cover border" />
                ) : (
                  <div className="h-14 w-14 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground/50" /></div>
                )}
                <label className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer hover:bg-muted/50">
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
                  {uploadingLogo && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {org.logo ? 'Trocar logotipo' : 'Enviar logotipo'}
                </label>
                {org.logo && <button type="button" onClick={() => setOrg({ ...org, logo: null })} className="text-xs text-muted-foreground hover:text-destructive">Remover</button>}
              </div>
              <p className="text-xs text-muted-foreground">PNG ou JPG até 2MB</p>
            </div>
            <Button onClick={saveOrg} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" /> Salvar</Button>
          </CardContent></Card>
        </TabsContent>

        {/* Campos e Classificações */}
        <TabsContent value="campos" className="mt-4 space-y-6">
          <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Tags</CardTitle><CardDescription>Classifique clientes com tags personalizadas.</CardDescription></div><Button size="sm" onClick={() => openCrud('tag')}><Plus className="mr-2 h-4 w-4" /> Nova Tag</Button></CardHeader><CardContent>
            {tags.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tag criada.</p> : (
              <div className="flex flex-wrap gap-2">{tags.map((t) => (<Badge key={t.id} className="gap-1.5 cursor-pointer hover:opacity-80" style={{ backgroundColor: `${t.color}20`, color: t.color, borderColor: t.color }} onClick={() => openCrud('tag', { id: t.id, name: t.name, color: t.color })}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />{t.name}</Badge>))}</div>
            )}
          </CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Tipos de Documento</CardTitle><CardDescription>Defina os tipos de documentos aceitos.</CardDescription></div><Button size="sm" onClick={() => openCrud('doctype')}><Plus className="mr-2 h-4 w-4" /> Novo Tipo</Button></CardHeader><CardContent>
            {docTypes.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum tipo cadastrado.</p> : (
              <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Formatos</TableHead><TableHead className="w-[80px]">Ações</TableHead></TableRow></TableHeader><TableBody>{docTypes.map((dt) => (<TableRow key={dt.id}><TableCell className="font-medium">{dt.name}</TableCell><TableCell className="text-muted-foreground">{dt.category || '—'}</TableCell><TableCell className="text-xs text-muted-foreground">{dt.allowedFormats}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCrud('doctype', { id: dt.id, name: dt.name, color: '#3b82f6', category: dt.category || '' })}><Pencil className="h-3 w-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (!confirm(`Excluir "${dt.name}"?`)) return; const r = await fetch(`/api/document-types/${dt.id}`, { method: 'DELETE' }); if (r.ok) { toast.success('Excluído'); fetchOrg() } else toast.error('Erro ao excluir') }}><Trash2 className="h-3 w-3" /></Button></div></TableCell></TableRow>))}</TableBody></Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alertas" className="mt-4 max-w-2xl">
          <Card><CardHeader><CardTitle className="text-base">Avisos Antecipados de Prazo</CardTitle><CardDescription>Configure quantos dias antes do prazo os alertas devem ser enviados.</CardDescription></CardHeader><CardContent className="space-y-4">
            {DEFAULT_ALERTS.map((a, i) => (<div key={a.key}><div className="flex items-center justify-between"><div><p className="text-sm font-medium">{a.label}</p><p className="text-xs text-muted-foreground">{a.value} dias antes do vencimento</p></div><Switch checked={alerts[a.key] ?? false} onCheckedChange={(v) => setAlerts({ ...alerts, [a.key]: v })} /></div>{i < DEFAULT_ALERTS.length - 1 && <Separator className="my-3" />}</div>))}
            <Button onClick={saveOrg} disabled={saving} className="mt-4">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" /> Salvar</Button>
          </CardContent></Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca" className="mt-4 space-y-4 max-w-2xl">
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Política de Senha</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Mínimo de caracteres</p></div>
              <Input type="number" min={6} max={64} value={passwordMinLength} onChange={(e) => setPasswordMinLength(Number(e.target.value) || 8)} className="w-24 h-9" />
            </div>
            <Button size="sm" onClick={saveOrg} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
            <Separator />
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Autenticação de Dois Fatores (2FA)</p><p className="text-xs text-muted-foreground">Proteja sua conta com verificação em duas etapas</p></div><Switch disabled /><Badge variant="outline">Em breve</Badge></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Sessões Ativas</CardTitle><CardDescription>{sessions.length} sessão(ões) autenticada(s) neste navegador com sua conta.</CardDescription></CardHeader><CardContent className="space-y-2">
            {sessions.length === 0 ? <p className="text-sm text-muted-foreground py-2">Nenhuma sessão ativa encontrada.</p> : sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"><div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Globe className="h-5 w-5 text-primary" /></div><div className="flex-1"><p className="text-sm font-medium">Sessão {s.id}</p><p className="text-xs text-muted-foreground">Expira em {formatDate(s.expiresAt)}</p></div><Badge variant="secondary" className="text-[10px]">Ativa</Badge></div>
            ))}
          </CardContent></Card>
        </TabsContent>

        {/* Auditoria */}
        <TabsContent value="auditoria" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por ação..." className="pl-9" value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} /></div>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          </div>
          <Card><CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <Table><TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>Usuário</TableHead><TableHead>Ação</TableHead><TableHead>Entidade</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhum log encontrado.</TableCell></TableRow>) : auditLogs.map((l) => (
                  <TableRow key={l.id}><TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(l.createdAt)}</TableCell><TableCell className="text-sm">{l.userName || 'Sistema'}</TableCell><TableCell><Badge variant="outline" className="text-xs">{l.action}</Badge></TableCell><TableCell className="text-sm text-muted-foreground">{l.entity || '—'}</TableCell><TableCell className="text-xs text-muted-foreground">{l.ip || '—'}</TableCell></TableRow>
                ))}
              </TableBody></Table>
            </ScrollArea>
          </CardContent></Card>
          {auditTotal > 20 && <div className="flex justify-center gap-2"><Button variant="outline" size="sm" disabled={auditPage <= 1} onClick={() => setAuditPage((p) => p - 1)}>Anterior</Button><span className="text-sm text-muted-foreground self-center">Página {auditPage}</span><Button variant="outline" size="sm" disabled={auditPage * 20 >= auditTotal} onClick={() => setAuditPage((p) => p + 1)}>Próxima</Button></div>}
        </TabsContent>

        {/* Dados e Privacidade */}
        <TabsContent value="privacidade" className="mt-4 space-y-4 max-w-2xl">
          <Card><CardHeader><CardTitle className="text-base">Exportar Dados</CardTitle><CardDescription>Exporte todos os dados da sua organização.</CardDescription></CardHeader><CardContent className="space-y-3">
            <Button variant="outline" disabled={privacySubmitting === 'data_export_requested'} onClick={() => handlePrivacyRequest('data_export_requested')}>
              {privacySubmitting === 'data_export_requested' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Download className="mr-2 h-4 w-4" /> Solicitar Exportação Completa
            </Button>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Política de Retenção</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div><p className="text-sm">Retenção de dados auditados</p><p className="text-xs text-muted-foreground">Período para manter registros de auditoria</p></div><Select value={auditRetentionDays} onValueChange={(v) => { setAuditRetentionDays(v); }}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="90">90 dias</SelectItem><SelectItem value="180">180 dias</SelectItem><SelectItem value="365">1 ano</SelectItem><SelectItem value="730">2 anos</SelectItem></SelectContent></Select></div>
            <Button size="sm" className="mt-3" onClick={saveOrg} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar</Button>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Solicitação LGPD</CardTitle><CardDescription>Exercite seus direitos conforme a Lei Geral de Proteção de Dados.</CardDescription></CardHeader><CardContent className="space-y-3">
            <Button variant="outline" disabled={privacySubmitting === 'lgpd_request'} onClick={() => handlePrivacyRequest('lgpd_request')}>
              {privacySubmitting === 'lgpd_request' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar Solicitação LGPD
            </Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* CRUD Dialog */}
      <Dialog open={crudOpen} onOpenChange={setCrudOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{crudType === 'tag' ? 'Tag' : 'Tipo de Documento'}</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Nome *</Label><Input value={crudForm.name} onChange={(e) => setCrudForm({ ...crudForm, name: e.target.value })} placeholder="Nome" /></div>
          {crudType === 'tag' && <div className="grid gap-2"><Label>Cor</Label><div className="flex items-center gap-3"><Input type="color" value={crudForm.color} onChange={(e) => setCrudForm({ ...crudForm, color: e.target.value })} className="h-10 w-16 cursor-pointer" /><span className="text-sm">{crudForm.color}</span></div></div>}
          {crudType === 'doctype' && <div className="grid gap-2"><Label>Categoria</Label><Input value={crudForm.category} onChange={(e) => setCrudForm({ ...crudForm, category: e.target.value })} placeholder="Ex: Fiscal, Trabalhista" /></div>}
        </div>
        <DialogFooter>
          {editingId && (
            <Button variant="outline" className="mr-auto text-destructive hover:text-destructive" onClick={deleteCrud} disabled={crudSaving}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => setCrudOpen(false)}>Cancelar</Button>
          <Button onClick={saveCrud} disabled={crudSaving}>
            {crudSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent></Dialog>
    </div>
  )
}
