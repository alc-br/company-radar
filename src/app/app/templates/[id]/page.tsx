'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, Plus, X, ChevronUp, ChevronDown, Trash2,
  GripVertical, Send, GitCompare, Eye, Pencil, Users, Layers, Info, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

/* ─── Types ─── */
interface OrgMember { id: string; name: string }
interface ChecklistItem { id: string; text: string; required: boolean }
interface DocRequirement { id: string; name: string; type: string; required: boolean }
interface TemplateTask {
  id: string; title: string; description: string; priority: string;
  department: string; role: string; reviewer: string;
  dueDateRule: { type: string; value?: number };
  estimatedDuration: number; recurrence: { frequency: string | null };
  checklist: ChecklistItem[]; documents: DocRequirement[];
  portalVisible: boolean; portalInstructions: string; optional: boolean;
}
interface Stage {
  id: string; name: string; description: string; order: number; tasks: TemplateTask[]
}
interface Application {
  id: string; baseDate: string; status: string; createdAt: string
  client: { id: string; name: string; cnpj: string }
  version: { versionNumber: number }
}
interface Version {
  id: string; versionNumber: number; publishedAt: string | null
  publishedByName: string | null; isCurrent: boolean; isDraft: boolean
  stagesCount: number; tasksCount: number; applicationsCount: number
  createdAt: string
}
interface TemplateData {
  id: string; name: string; code: string | null; description: string | null
  purpose: string | null; category: string | null; color: string
  status: string; currentVersion: number; responsibleId: string | null
  responsibleName: string | null; instructions: string | null; warning: string | null
  defaultPeriodicity: string | null; variables: string
  stages: Stage[]; applications: Application[];
  count: { versions: number; applications: number }
  createdAt: string; updatedAt: string
}

/* ─── Constants ─── */
const CATEGORIES = ['Tributário', 'Contábil', 'Trabalhista', 'Societário', 'Fiscal', 'Departamento Pessoal', 'SPED', 'Competência', 'Outro']
const PERIODICITIES = [{ v: 'mensal', l: 'Mensal' }, { v: 'trimestral', l: 'Trimestral' }, { v: 'semestral', l: 'Semestral' }, { v: 'anual', l: 'Anual' }]
const PRIORITIES = [{ v: 'low', l: 'Baixa' }, { v: 'medium', l: 'Média' }, { v: 'high', l: 'Alta' }, { v: 'urgent', l: 'Urgente' }]
const DUE_DATE_RULES = [
  { v: 'base_date', l: 'Na data-base' },
  { v: 'days_before', l: 'N dias antes' },
  { v: 'days_after', l: 'N dias depois' },
  { v: 'fixed_month_day', l: 'Dia fixo do mês' },
  { v: 'no_deadline', l: 'Sem prazo' },
]
const RECURRENCE_FREQS = [
  { v: 'diária', l: 'Diária' }, { v: 'semanal', l: 'Semanal' }, { v: 'mensal', l: 'Mensal' },
  { v: 'trimestral', l: 'Trimestral' }, { v: 'semestral', l: 'Semestral' }, { v: 'anual', l: 'Anual' },
]
const DOC_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'PNG', 'XML', 'CSV', 'Outro']
const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0891b2', '#475569']
const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  published: { label: 'Publicado', variant: 'default' },
  archived: { label: 'Arquivado', variant: 'outline' },
}

/* ─── Helpers ─── */
function getSession() {
  try { return JSON.parse(localStorage.getItem('cr_session') || '') } catch { return null }
}
function genId() { return Math.random().toString(36).slice(2, 10) }
function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function parseVariables(s: string) { try { return JSON.parse(s) } catch { return [] } }
function makeTask(): TemplateTask {
  return {
    id: genId(), title: '', description: '', priority: 'medium',
    department: '', role: '', reviewer: '',
    dueDateRule: { type: 'base_date' }, estimatedDuration: 0,
    recurrence: { frequency: null }, checklist: [], documents: [],
    portalVisible: false, portalInstructions: '', optional: false,
  }
}

/* ─── Component ─── */
export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'metadados')

  // Data
  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [versions, setVersions] = useState<Version[]>([])

  // Editor state
  const [stages, setStages] = useState<Stage[]>([])
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [stagesDirty, setStagesDirty] = useState(false)

  // Metadata edit state
  const [editingMeta, setEditingMeta] = useState(false)
  const [saving, setSaving] = useState(false)
  const [metaName, setMetaName] = useState('')
  const [metaCode, setMetaCode] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [metaPurpose, setMetaPurpose] = useState('')
  const [metaCategory, setMetaCategory] = useState('')
  const [metaColor, setMetaColor] = useState('#2563eb')
  const [metaResponsible, setMetaResponsible] = useState('')
  const [metaInstructions, setMetaInstructions] = useState('')
  const [metaWarning, setMetaWarning] = useState('')
  const [metaPeriodicity, setMetaPeriodicity] = useState('')
  const [metaDirty, setMetaDirty] = useState(false)

  // Fetch team
  useEffect(() => {
    fetch('/api/team')
      .then(r => r.ok ? r.json() : [])
      .then(d => setMembers((d || []).filter((m: OrgMember & { status?: string }) => !m.status || m.status === 'active')))
      .catch(() => {})
  }, [])

  // Fetch template
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const r = await fetch(`/api/templates/${id}`)
        if (r.ok) {
          const d: TemplateData = await r.json()
          if (cancelled) return
          setTemplate(d)
          const s = (d.stages || []) as Stage[]
          setStages(s)
          if (s.length > 0) setExpandedStages(new Set([s[0].id]))
          setMetaName(d.name); setMetaCode(d.code || ''); setMetaDesc(d.description || '')
          setMetaPurpose(d.purpose || ''); setMetaCategory(d.category || ''); setMetaColor(d.color)
          setMetaResponsible(d.responsibleId || ''); setMetaInstructions(d.instructions || '')
          setMetaWarning(d.warning || ''); setMetaPeriodicity(d.defaultPeriodicity || '')
        } else {
          toast.error('Template não encontrado')
          router.push('/app/templates')
        }
      } catch {
        toast.error('Erro ao carregar template')
      }
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [id, router])

  // Fetch versions when tab changes
  useEffect(() => {
    if (tab === 'versoes') {
      fetch(`/api/templates/${id}/versions`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setVersions(d.versions || []) })
        .catch(() => {})
    }
  }, [tab, id])

  // Reload template data (used after save)
  function reloadTemplate() {
    fetch(`/api/templates/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setTemplate(d)
        const s = (d.stages || []) as Stage[]
        setStages(s)
        setMetaName(d.name); setMetaCode(d.code || ''); setMetaDesc(d.description || '')
        setMetaPurpose(d.purpose || ''); setMetaCategory(d.category || ''); setMetaColor(d.color)
        setMetaResponsible(d.responsibleId || ''); setMetaInstructions(d.instructions || '')
        setMetaWarning(d.warning || ''); setMetaPeriodicity(d.defaultPeriodicity || '')
      })
      .catch(() => {})
  }

  // ── Stage Operations ──
  function addStage() {
    const newStage: Stage = { id: genId(), name: `Etapa ${stages.length + 1}`, description: '', order: stages.length, tasks: [] }
    setStages(p => [...p, newStage])
    setExpandedStages(p => new Set([...p, newStage.id]))
    setStagesDirty(true)
  }

  function removeStage(stageId: string) {
    setStages(p => p.filter(s => s.id !== stageId))
    setExpandedStages(p => { const n = new Set(p); n.delete(stageId); return n })
    setStagesDirty(true)
  }

  function moveStage(index: number, delta: number) {
    const j = index + delta
    if (j < 0 || j >= stages.length) return
    setStages(p => {
      const a = [...p]; [a[index], a[j]] = [a[j], a[index]]
      return a.map((s, k) => ({ ...s, order: k }))
    })
    setStagesDirty(true)
  }

  function updateStageField(stageId: string, field: string, value: string) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, [field]: value } : s))
    setStagesDirty(true)
  }

  function toggleStageExpand(stageId: string) {
    setExpandedStages(p => {
      const n = new Set(p)
      if (n.has(stageId)) { n.delete(stageId) } else { n.add(stageId) }
      return n
    })
  }

  // ── Task Operations ──
  function addTask(stageId: string) {
    const task = makeTask()
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: [...s.tasks, task] } : s))
    setExpandedTasks(p => new Set([...p, task.id]))
    setStagesDirty(true)
  }

  function removeTask(stageId: string, taskId: string) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: s.tasks.filter(t => t.id !== taskId) } : s))
    setExpandedTasks(p => { const n = new Set(p); n.delete(taskId); return n })
    setStagesDirty(true)
  }

  function moveTask(stageId: string, index: number, delta: number) {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return
    const j = index + delta
    if (j < 0 || j >= stage.tasks.length) return
    setStages(p => p.map(s => {
      if (s.id !== stageId) return s
      const t = [...s.tasks]; [t[index], t[j]] = [t[j], t[index]]
      return { ...s, tasks: t }
    }))
    setStagesDirty(true)
  }

  function updateTaskField(stageId: string, taskId: string, field: string, value: unknown) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t) } : s))
    setStagesDirty(true)
  }

  function toggleTaskExpand(taskId: string) {
    setExpandedTasks(p => {
      const n = new Set(p)
      if (n.has(taskId)) { n.delete(taskId) } else { n.add(taskId) }
      return n
    })
  }

  // ── Checklist Operations ──
  function addChecklistItem(stageId: string, taskId: string) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, checklist: [...t.checklist, { id: genId(), text: '', required: false }] } : t) } : s))
    setStagesDirty(true)
  }

  function removeChecklistItem(stageId: string, taskId: string, itemId: string) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, checklist: t.checklist.filter(c => c.id !== itemId) } : t) } : s))
    setStagesDirty(true)
  }

  function updateChecklistItem(stageId: string, taskId: string, itemId: string, field: string, value: string | boolean) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, checklist: t.checklist.map(c => c.id === itemId ? { ...c, [field]: value } : c) } : t) } : s))
    setStagesDirty(true)
  }

  // ── Document Operations ──
  function addDocument(stageId: string, taskId: string) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, documents: [...t.documents, { id: genId(), name: '', type: 'PDF', required: true }] } : t) } : s))
    setStagesDirty(true)
  }

  function removeDocument(stageId: string, taskId: string, docId: string) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, documents: t.documents.filter(d => d.id !== docId) } : t) } : s))
    setStagesDirty(true)
  }

  function updateDocument(stageId: string, taskId: string, docId: string, field: string, value: string | boolean) {
    setStages(p => p.map(s => s.id === stageId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, documents: t.documents.map(d => d.id === docId ? { ...d, [field]: value } : d) } : t) } : s))
    setStagesDirty(true)
  }

  // ── Save ──
  async function handleSave() {
    if (!template) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {}
      if (metaDirty) {
        body.name = metaName.trim()
        body.code = metaCode.trim() || null
        body.description = metaDesc.trim() || null
        body.purpose = metaPurpose.trim() || null
        body.category = metaCategory || null
        body.color = metaColor
        body.responsibleId = metaResponsible || null
        body.instructions = metaInstructions.trim() || null
        body.warning = metaWarning.trim() || null
        body.defaultPeriodicity = metaPeriodicity || null
        body.variables = template.variables
      }
      if (stagesDirty) body.stages = stages
      if (!metaDirty && !stagesDirty) { setSaving(false); return }

      const r = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (r.ok) {
        toast.success('Salvo com sucesso!')
        setMetaDirty(false)
        setStagesDirty(false)
        setEditingMeta(false)
        reloadTemplate()
      } else {
        const d = await r.json()
        toast.error(d.error || 'Erro ao salvar')
      }
    } catch {
      toast.error('Erro de conexão')
    }
    setSaving(false)
  }

  // ── Computed ──
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (!template) return null

  const statusInfo = STATUS_MAP[template.status] || STATUS_MAP.draft
  const totalTasks = stages.reduce((a, s) => a + s.tasks.length, 0)
  const hasChanges = metaDirty || stagesDirty

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app/templates')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: template.color }} />
              <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {template.currentVersion > 0 && <Badge variant="outline">v{template.currentVersion}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {template.category && `${template.category} · `}
              {stages.length} etapa{stages.length !== 1 ? 's' : ''} · {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}
              {template.responsibleName && ` · ${template.responsibleName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {template.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
              <Button size="sm" asChild>
                <Link href={`/app/templates/${id}/publicar`}>
                  <Send className="mr-2 h-4 w-4" />Publicar
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="metadados" className="gap-1.5"><Info className="h-4 w-4" />Metadados</TabsTrigger>
          <TabsTrigger value="editor" className="gap-1.5">
            <Layers className="h-4 w-4" />Editor
            {stagesDirty && <span className="flex h-2 w-2 rounded-full bg-amber-500" />}
          </TabsTrigger>
          <TabsTrigger value="versoes" className="gap-1.5"><GitCompare className="h-4 w-4" />Versões</TabsTrigger>
          <TabsTrigger value="usos" className="gap-1.5"><Users className="h-4 w-4" />Usos</TabsTrigger>
        </TabsList>

        {/* ═══ METADADOS TAB ═══ */}
        <TabsContent value="metadados" className="mt-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {editingMeta ? (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Dados Básicos</CardTitle></CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Nome</Label>
                      <Input value={metaName} onChange={e => { setMetaName(e.target.value); setMetaDirty(true) }} />
                    </div>
                    <div className="space-y-2">
                      <Label>Código</Label>
                      <Input value={metaCode} onChange={e => { setMetaCode(e.target.value.toUpperCase()); setMetaDirty(true) }} className="font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={metaCategory} onValueChange={v => { setMetaCategory(v); setMetaDirty(true) }}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Descrição</Label>
                      <Textarea value={metaDesc} onChange={e => { setMetaDesc(e.target.value); setMetaDirty(true) }} rows={3} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Finalidade</Label>
                      <Textarea value={metaPurpose} onChange={e => { setMetaPurpose(e.target.value); setMetaDirty(true) }} rows={2} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Configurações</CardTitle></CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Cor</Label>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => (
                          <button key={c} type="button"
                            className={`h-7 w-7 rounded-full border-2 transition-all ${metaColor === c ? 'scale-110 border-foreground' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => { setMetaColor(c); setMetaDirty(true) }} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsável Técnico</Label>
                      <Select value={metaResponsible} onValueChange={v => { setMetaResponsible(v); setMetaDirty(true) }}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Periodicidade</Label>
                      <Select value={metaPeriodicity} onValueChange={v => { setMetaPeriodicity(v); setMetaDirty(true) }}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{PERIODICITIES.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Instruções</Label>
                      <Textarea value={metaInstructions} onChange={e => { setMetaInstructions(e.target.value); setMetaDirty(true) }} rows={3} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Aviso</Label>
                      <Textarea value={metaWarning} onChange={e => { setMetaWarning(e.target.value); setMetaDirty(true) }} rows={2}
                        className="border-amber-200 focus-visible:ring-amber-300" />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setEditingMeta(false); setMetaDirty(false); fetchTemplate() }}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
                </div>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Dados Básicos</CardTitle>
                    {template.status === 'draft' && (
                      <Button variant="outline" size="sm" onClick={() => setEditingMeta(true)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />Editar
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div><p className="text-[11px] font-medium text-muted-foreground uppercase">Nome</p><p className="text-sm font-medium mt-0.5">{template.name}</p></div>
                    <div><p className="text-[11px] font-medium text-muted-foreground uppercase">Código</p><p className="text-sm font-mono mt-0.5">{template.code || '—'}</p></div>
                    <div><p className="text-[11px] font-medium text-muted-foreground uppercase">Categoria</p><p className="mt-0.5">{template.category ? <Badge variant="outline">{template.category}</Badge> : <span className="text-sm text-muted-foreground">—</span>}</p></div>
                    <div><p className="text-[11px] font-medium text-muted-foreground uppercase">Status</p><p className="mt-0.5"><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></p></div>
                    <div><p className="text-[11px] font-medium text-muted-foreground uppercase">Versão</p><p className="text-sm mt-0.5">v{template.currentVersion || 0}</p></div>
                    <div><p className="text-[11px] font-medium text-muted-foreground uppercase">Responsável</p><p className="text-sm mt-0.5">{template.responsibleName || '—'}</p></div>
                    <div><p className="text-[11px] font-medium text-muted-foreground uppercase">Periodicidade</p><p className="text-sm mt-0.5">{template.defaultPeriodicity || '—'}</p></div>
                    <div><p className="text-[11px] font-medium text-muted-foreground uppercase">Criado</p><p className="text-sm mt-0.5">{formatDate(template.createdAt)}</p></div>
                    {template.description && <div className="sm:col-span-2"><p className="text-[11px] font-medium text-muted-foreground uppercase">Descrição</p><p className="text-sm mt-0.5 whitespace-pre-wrap">{template.description}</p></div>}
                    {template.purpose && <div className="sm:col-span-2"><p className="text-[11px] font-medium text-muted-foreground uppercase">Finalidade</p><p className="text-sm mt-0.5 whitespace-pre-wrap">{template.purpose}</p></div>}
                    {template.instructions && <div className="sm:col-span-2"><p className="text-[11px] font-medium text-muted-foreground uppercase">Instruções</p><p className="text-sm mt-0.5 whitespace-pre-wrap">{template.instructions}</p></div>}
                    {template.warning && <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-[11px] font-medium text-amber-700 uppercase">Aviso</p><p className="text-sm text-amber-800 mt-0.5 whitespace-pre-wrap">{template.warning}</p></div>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Variáveis ({parseVariables(template.variables).length})</CardTitle></CardHeader>
                  <CardContent>
                    {parseVariables(template.variables).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Nenhuma variável definida</p>
                    ) : (
                      <div className="space-y-2">{parseVariables(template.variables).map((v, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium font-mono">{'{{' + v.name + '}}'}</p>
                            <p className="text-xs text-muted-foreground">{v.label} · {v.type}{v.required ? ' · Obrigatório' : ''}</p>
                          </div>
                        </div>
                      ))}</div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* ═══ EDITOR TAB ═══ */}
        <TabsContent value="editor" className="mt-6">
          {template.status !== 'draft' ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
              <Pencil className="h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 text-lg font-semibold">Apenas rascunhos podem ser editados</h3>
              <p className="mt-1 text-sm text-muted-foreground">Clone este template para criar uma versão editável.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Editor header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Etapas</h2>
                  <Badge variant="secondary">{stages.length}</Badge>
                  <Badge variant="outline">{totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={saving || !stagesDirty}>
                    {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                    Salvar
                  </Button>
                  <Button size="sm" onClick={addStage}><Plus className="mr-1.5 h-4 w-4" />Adicionar Etapa</Button>
                </div>
              </div>

              {stages.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-3 text-lg font-semibold">Nenhuma etapa</h3>
                  <p className="text-sm text-muted-foreground">Adicione etapas para estruturar seu processo</p>
                  <Button className="mt-4" size="sm" onClick={addStage}><Plus className="mr-1.5 h-4 w-4" />Primeira Etapa</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {stages.map((stage, stageIdx) => {
                    const isExpanded = expandedStages.has(stage.id)
                    return (
                      <Card key={stage.id} className={!isExpanded ? 'opacity-80' : ''}>
                        {/* Stage header */}
                        <div className="flex items-center gap-2 p-4">
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            {isExpanded ? (
                              <Input value={stage.name} onChange={e => updateStageField(stage.id, 'name', e.target.value)}
                                className="font-semibold h-8" placeholder="Nome da etapa" />
                            ) : (
                              <p className="font-semibold text-sm truncate">{stage.name || 'Sem nome'}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {stage.tasks.length} tarefa{stage.tasks.length !== 1 ? 's' : ''}
                          </Badge>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(stageIdx, -1)} disabled={stageIdx === 0}>
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStage(stageIdx, 1)} disabled={stageIdx === stages.length - 1}>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStageExpand(stage.id)}>
                              {isExpanded ? <ChevronUp className="h-4 w-4 -rotate-90" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeStage(stage.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded stage content */}
                        {isExpanded && (
                          <div className="border-t px-4 pb-4 pt-3 space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Descrição da Etapa</Label>
                              <Textarea value={stage.description} onChange={e => updateStageField(stage.id, 'description', e.target.value)}
                                rows={2} placeholder="Opcional" className="text-sm" />
                            </div>

                            {/* Tasks section */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Tarefas ({stage.tasks.length})</span>
                                <Button variant="outline" size="sm" onClick={() => addTask(stage.id)} className="h-7 text-xs">
                                  <Plus className="mr-1 h-3 w-3" />Tarefa
                                </Button>
                              </div>

                              {stage.tasks.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-3 rounded-lg border border-dashed">Nenhuma tarefa</p>
                              )}

                              {stage.tasks.map((task, taskIdx) => {
                                const taskExpanded = expandedTasks.has(task.id)
                                const priorityLabel = PRIORITIES.find(p => p.v === task.priority)?.l || 'Média'
                                return (
                                  <div key={task.id} className="rounded-lg border bg-muted/30">
                                    {/* Task header */}
                                    <div className="flex items-center gap-2 p-2.5">
                                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-grab" />
                                      <div className="flex-1 min-w-0">
                                        {taskExpanded ? (
                                          <Input value={task.title} onChange={e => updateTaskField(stage.id, task.id, 'title', e.target.value)}
                                            className="h-7 text-sm font-medium" placeholder="Título da tarefa" />
                                        ) : (
                                          <p className="text-sm font-medium truncate">{task.title || 'Sem título'}</p>
                                        )}
                                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                          <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'destructive' : 'outline'} className="text-[9px] px-1 py-0">{priorityLabel}</Badge>
                                          {task.optional && <Badge variant="outline" className="text-[9px] px-1 py-0">Opcional</Badge>}
                                          {task.portalVisible && <Badge variant="outline" className="text-[9px] px-1 py-0">Portal</Badge>}
                                          {task.recurrence.frequency && <Badge variant="secondary" className="text-[9px] px-1 py-0">{task.recurrence.frequency}</Badge>}
                                          {task.estimatedDuration > 0 && <span className="text-[10px] text-muted-foreground">{task.estimatedDuration}min</span>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveTask(stage.id, taskIdx, -1)} disabled={taskIdx === 0}><ChevronUp className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveTask(stage.id, taskIdx, 1)} disabled={taskIdx === stage.tasks.length - 1}><ChevronDown className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleTaskExpand(task.id)}>
                                          {taskExpanded ? <ChevronUp className="h-3 w-3 -rotate-90" /> : <ChevronRight className="h-3 w-3" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeTask(stage.id, task.id)}><Trash2 className="h-3 w-3" /></Button>
                                      </div>
                                    </div>

                                    {/* Expanded task details */}
                                    {taskExpanded && (
                                      <div className="border-t px-3 pb-3 pt-2 space-y-3">
                                        <div className="grid gap-3 sm:grid-cols-2">
                                          <div className="space-y-1 sm:col-span-2">
                                            <Label className="text-[11px]">Descrição</Label>
                                            <Textarea value={task.description} onChange={e => updateTaskField(stage.id, task.id, 'description', e.target.value)}
                                              rows={2} placeholder="Opcional" className="text-xs" />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[11px]">Prioridade</Label>
                                            <Select value={task.priority} onValueChange={v => updateTaskField(stage.id, task.id, 'priority', v)}>
                                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                              <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
                                            </Select>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[11px]">Departamento</Label>
                                            <Select value={task.department} onValueChange={v => updateTaskField(stage.id, task.id, 'department', v)}>
                                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                              <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[11px]">Revisor</Label>
                                            <Select value={task.reviewer} onValueChange={v => updateTaskField(stage.id, task.id, 'reviewer', v)}>
                                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                              <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[11px]">Duração Estimada (min)</Label>
                                            <Input type="number" min={0} value={task.estimatedDuration || ''}
                                              onChange={e => updateTaskField(stage.id, task.id, 'estimatedDuration', parseInt(e.target.value) || 0)}
                                              className="h-8 text-xs" placeholder="0" />
                                          </div>

                                          {/* Due date rule */}
                                          <div className="space-y-1 sm:col-span-2">
                                            <Label className="text-[11px]">Regra de Prazo</Label>
                                            <div className="flex items-center gap-2">
                                              <Select value={task.dueDateRule.type}
                                                onValueChange={v => updateTaskField(stage.id, task.id, 'dueDateRule', { ...task.dueDateRule, type: v })}>
                                                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                                                <SelectContent>{DUE_DATE_RULES.map(r => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}</SelectContent>
                                              </Select>
                                              {(task.dueDateRule.type === 'days_before' || task.dueDateRule.type === 'days_after') && (
                                                <Input type="number" min={0} value={task.dueDateRule.value || ''}
                                                  onChange={e => updateTaskField(stage.id, task.id, 'dueDateRule', { ...task.dueDateRule, value: parseInt(e.target.value) || 0 })}
                                                  className="h-8 text-xs w-24" placeholder="N" />
                                              )}
                                              {task.dueDateRule.type === 'fixed_month_day' && (
                                                <Input type="number" min={1} max={31} value={task.dueDateRule.value || ''}
                                                  onChange={e => updateTaskField(stage.id, task.id, 'dueDateRule', { ...task.dueDateRule, value: parseInt(e.target.value) || 1 })}
                                                  className="h-8 text-xs w-24" placeholder="Dia" />
                                              )}
                                            </div>
                                          </div>

                                          {/* Recurrence */}
                                          <div className="space-y-1">
                                            <Label className="text-[11px]">Recorrência</Label>
                                            <Select value={task.recurrence.frequency || '_none_'}
                                              onValueChange={v => updateTaskField(stage.id, task.id, 'recurrence', { frequency: v === '_none_' ? null : v })}>
                                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="_none_">Nenhuma</SelectItem>
                                                {RECURRENCE_FREQS.map(f => <SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          {/* Toggles */}
                                          <div className="flex items-center gap-4 pt-1">
                                            <div className="flex items-center gap-2">
                                              <Switch checked={task.optional} onCheckedChange={v => updateTaskField(stage.id, task.id, 'optional', v)} />
                                              <Label className="text-[11px]">Opcional</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Switch checked={task.portalVisible} onCheckedChange={v => updateTaskField(stage.id, task.id, 'portalVisible', v)} />
                                              <Label className="text-[11px]">Visível no Portal</Label>
                                            </div>
                                          </div>

                                          {task.portalVisible && (
                                            <div className="space-y-1 sm:col-span-2">
                                              <Label className="text-[11px]">Instruções do Portal</Label>
                                              <Textarea value={task.portalInstructions} onChange={e => updateTaskField(stage.id, task.id, 'portalInstructions', e.target.value)}
                                                rows={2} placeholder="Instruções para o cliente no portal..." className="text-xs" />
                                            </div>
                                          )}
                                        </div>

                                        {/* ── Checklist ── */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Checklist ({task.checklist.length})</span>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addChecklistItem(stage.id, task.id)}>
                                              <Plus className="mr-1 h-3 w-3" />Item
                                            </Button>
                                          </div>
                                          {task.checklist.length === 0 && (
                                            <p className="text-[11px] text-muted-foreground pl-2">Nenhum item</p>
                                          )}
                                          <div className="space-y-1.5">
                                            {task.checklist.map((item) => (
                                              <div key={item.id} className="flex items-center gap-2 pl-2">
                                                <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                                <Input value={item.text} onChange={e => updateChecklistItem(stage.id, task.id, item.id, 'text', e.target.value)}
                                                  className="h-7 text-xs flex-1" placeholder="Item do checklist" />
                                                <Checkbox checked={item.required} onCheckedChange={v => updateChecklistItem(stage.id, task.id, item.id, 'required', !!v)} />
                                                <span className="text-[10px] text-muted-foreground shrink-0">Obrig.</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                                  onClick={() => removeChecklistItem(stage.id, task.id, item.id)}><X className="h-3 w-3" /></Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* ── Documents ── */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Documentos ({task.documents.length})</span>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addDocument(stage.id, task.id)}>
                                              <Plus className="mr-1 h-3 w-3" />Documento
                                            </Button>
                                          </div>
                                          {task.documents.length === 0 && (
                                            <p className="text-[11px] text-muted-foreground pl-2">Nenhum documento exigido</p>
                                          )}
                                          <div className="space-y-1.5">
                                            {task.documents.map((doc) => (
                                              <div key={doc.id} className="flex items-center gap-2 pl-2">
                                                <Input value={doc.name} onChange={e => updateDocument(stage.id, task.id, doc.id, 'name', e.target.value)}
                                                  className="h-7 text-xs flex-1" placeholder="Nome do documento" />
                                                <Select value={doc.type} onValueChange={v => updateDocument(stage.id, task.id, doc.id, 'type', v)}>
                                                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                                                  <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <Checkbox checked={doc.required} onCheckedChange={v => updateDocument(stage.id, task.id, doc.id, 'required', !!v)} />
                                                <span className="text-[10px] text-muted-foreground shrink-0">Obrig.</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                                  onClick={() => removeDocument(stage.id, task.id, doc.id)}><X className="h-3 w-3" /></Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ═══ VERSÕES TAB ═══ */}
        <TabsContent value="versoes" className="mt-6">
          <div className="mx-auto max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Versões</CardTitle>
              </CardHeader>
              <CardContent>
                {versions.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <GitCompare className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Nenhuma versão publicada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {versions.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${v.isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          v{v.versionNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Versão {v.versionNumber}</p>
                            {v.isCurrent && <Badge className="text-[10px]">Atual</Badge>}
                            {v.isDraft && <Badge variant="secondary" className="text-[10px]">Rascunho</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {v.isDraft ? 'Em edição' : `Publicado em ${v.publishedAt ? formatDate(v.publishedAt) : '—'}`}
                            {v.publishedByName && ` por ${v.publishedByName}`}
                            {` · ${v.stagesCount} etapa${v.stagesCount !== 1 ? 's' : ''} · ${v.tasksCount} tarefa${v.tasksCount !== 1 ? 's' : ''}`}
                            {v.applicationsCount > 0 && ` · ${v.applicationsCount} uso${v.applicationsCount !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ USOS TAB ═══ */}
        <TabsContent value="usos" className="mt-6">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Empresas Usando Este Template</CardTitle>
                  <Badge variant="outline">{template.applications.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {template.applications.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Nenhuma empresa está usando este template</p>
                    <p className="text-xs text-muted-foreground mt-1">Aplique o template em uma empresa para ver aqui</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>Data-base</TableHead>
                          <TableHead>Versão</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Aplicado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {template.applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <Link href={`/app/empresas/${app.client.id}`} className="text-sm font-medium hover:underline">
                                {app.client.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm font-mono text-muted-foreground">{app.client.cnpj}</TableCell>
                            <TableCell className="text-sm">{formatDate(app.baseDate)}</TableCell>
                            <TableCell><Badge variant="outline">v{app.version.versionNumber}</Badge></TableCell>
                            <TableCell>
                              <Badge variant={app.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                {app.status === 'active' ? 'Ativo' : app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDate(app.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
