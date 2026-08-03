'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Layers,
  Calendar,
  FileText,
  Users,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  color: string
  status: string
  currentVersion: number
  department?: { id: string; name: string } | null
}

interface TemplateVersion {
  id: string
  versionNumber: number
  name: string | null
  stages: Stage[]
  variables: TemplateVariable[]
  publishedAt: string | null
  isCurrent: boolean
}

interface TemplateVariable {
  name: string
  label: string
  type: string
  required?: boolean
}

interface Stage {
  name: string
  tasks: StageTask[]
}

interface StageTask {
  title: string
  description?: string
  dueDateRule?: { type: string; value?: number }
  priority?: string
  department?: string
  role?: string
  checklist?: Array<{ text: string; required?: boolean }>
  documents?: Array<{ name: string; required?: boolean }>
}

interface OrgMember {
  id: string
  name: string
  email: string
  role: string
  status: string
}

// ── Helpers ────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Espelha _compute_due_date() do backend (apps/radar_tasks/services.py) —
// os tipos reais sao base_date/days_before/days_after/fixed_month_day/no_deadline
// (ver Select de "Regra de Prazo" em templates/[id]/page.tsx).
function computeDueDate(baseDateStr: string, rule?: { type: string; value?: number }): string {
  const base = new Date(`${baseDateStr}T00:00:00`)
  if (!rule || !rule.type || rule.type === 'base_date') return formatDate(baseDateStr)
  if (rule.type === 'no_deadline') return 'Sem prazo'
  const value = rule.value || 0
  if (rule.type === 'days_before') {
    const d = new Date(base)
    d.setDate(d.getDate() - value)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }
  if (rule.type === 'days_after') {
    const d = new Date(base)
    d.setDate(d.getDate() + value)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }
  if (rule.type === 'fixed_month_day') {
    const day = Math.min(value || base.getDate(), new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate())
    const d = new Date(base.getFullYear(), base.getMonth(), day)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }
  return formatDate(baseDateStr)
}

// ── Page ───────────────────────────────────────────────────
export default function AplicarTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = use(params)
  const router = useRouter()

  const [clientName, setClientName] = useState('')
  const [loadingClient, setLoadingClient] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [members, setMembers] = useState<OrgMember[]>([])

  // Wizard state
  const [step, setStep] = useState(1)
  const totalSteps = 5

  // Step 1: Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedVersionId, setSelectedVersionId] = useState('')
  const [versions, setVersions] = useState<TemplateVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  function selectTemplate(templateId: string) {
    setSelectedTemplateId(templateId)
    setSelectedVersionId('')
    setVersions([])
    if (!templateId) return
    setLoadingVersions(true)
    fetch(`/api/templates/${templateId}/versions`)
      .then(r => r.ok ? r.json() : { versions: [] })
      .then(data => {
        const vs: TemplateVersion[] = Array.isArray(data.versions) ? data.versions : []
        setVersions(vs)
        const current = vs.find(v => v.isCurrent)
        setSelectedVersionId(current?.id || vs[0]?.id || '')
      })
      .catch(() => setVersions([]))
      .finally(() => setLoadingVersions(false))
  }

  // Step 2: Base date and variables
  const [baseDate, setBaseDate] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({})

  // Step 3: Role mappings
  const [roleMappings, setRoleMappings] = useState<Record<string, string>>({})

  // Step 4: Review (computed)
  // Step 5: Confirm
  const [submitting, setSubmitting] = useState(false)

  // Computed
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
  const selectedVersion = versions.find(v => v.id === selectedVersionId)
  const stages: Stage[] = selectedVersion?.stages || []
  const templateVars: TemplateVariable[] = selectedVersion?.variables || []

  // ── Fetch data ───────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setClientName(data.tradeName || data.name) })
      .catch(() => {})
      .finally(() => setLoadingClient(false))

    fetch('/api/templates?status=published')
      .then(r => r.ok ? r.json() : [])
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false))

    fetch('/api/team')
      .then(r => r.ok ? r.json() : [])
      .then(data => setMembers(data.filter((m: OrgMember) => m.status === 'active')))
      .catch(() => {})
  }, [clientId])

  // ── Derived roles from stages ────────────────────────────
  const uniqueRoles = Array.from(
    new Set(stages.flatMap(s => s.tasks.map(t => t.role).filter(Boolean) as string[]))
  )

  const uniqueDepartments = Array.from(
    new Set(stages.flatMap(s => s.tasks.map(t => t.department).filter(Boolean) as string[]))
  )

  // When version changes, reset dependent state
  useEffect(() => {
    const vars: Record<string, string> = {}
    templateVars.forEach(v => { vars[v.name] = '' })
    setVariables(vars)
  }, [selectedVersionId])

  useEffect(() => {
    const maps: Record<string, string> = {}
    uniqueRoles.forEach(r => { maps[r] = '' })
    uniqueDepartments.forEach(d => { maps[`dept_${d}`] = '' })
    setRoleMappings(maps)
  }, [selectedVersionId, JSON.stringify(uniqueRoles), JSON.stringify(uniqueDepartments)])

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit() {
    if (!selectedTemplateId || !selectedVersionId || !baseDate) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/template-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          templateVersionId: selectedVersionId,
          clientId,
          baseDate,
          variables: JSON.stringify(variables),
          roleMappings: JSON.stringify(roleMappings),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao aplicar template')
      }
      toast.success('Template aplicado com sucesso! Tarefas criadas.')
      router.push(`/app/empresas/${clientId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aplicar template')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Step validation ──────────────────────────────────────
  function canProceed(): boolean {
    switch (step) {
      case 1: return !!selectedTemplateId && !!selectedVersionId
      case 2: return !!baseDate && templateVars.filter(v => v.required && !variables[v.name]).length === 0
      case 3: return true // role mappings are optional
      case 4: return true
      default: return true
    }
  }

  function nextStep() {
    if (step < totalSteps && canProceed()) setStep(step + 1)
  }

  function prevStep() {
    if (step > 1) setStep(step - 1)
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/app/empresas/${clientId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aplicar Template</h1>
          <p className="text-sm text-muted-foreground">
            {loadingClient ? 'Carregando...' : `Cliente: ${clientName}`}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { n: 1, label: 'Template' },
          { n: 2, label: 'Variáveis' },
          { n: 3, label: 'Responsáveis' },
          { n: 4, label: 'Revisão' },
          { n: 5, label: 'Confirmar' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <button
              onClick={() => s.n < step && setStep(s.n)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${step === s.n
                  ? 'bg-primary text-primary-foreground'
                  : step > s.n
                    ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/15'
                    : 'bg-muted text-muted-foreground'
                }`
              }
            >
              {step > s.n ? <Check className="h-4 w-4" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs">{s.n}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < 4 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Select Template ─────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Template</CardTitle>
            <CardDescription>Escolha um template publicado e a versão a ser aplicada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingTemplates ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Layers className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">Nenhum template publicado disponível</p>
                <Button variant="outline" className="mt-3" onClick={() => router.push('/app/templates')}>
                  Criar Template
                </Button>
              </div>
            ) : (
              <>
                <Select value={selectedTemplateId} onValueChange={selectTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.status === 'published').map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                          {t.category && <span className="text-muted-foreground">· {t.category}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTemplate && (
                  <>
                    {selectedTemplate.description && (
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    )}
                    <div className="space-y-2">
                      <Label>Versão</Label>
                      {loadingVersions ? (
                        <Skeleton className="h-9" />
                      ) : (
                        <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a versão" />
                          </SelectTrigger>
                          <SelectContent>
                            {versions.filter(v => v.publishedAt).map(v => (
                              <SelectItem key={v.id} value={v.id}>
                                Versão {v.versionNumber}{v.name ? ` — ${v.name}` : ''}{v.isCurrent ? ' (atual)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {selectedVersion && (
                      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <p className="font-medium">Resumo da versão selecionada:</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
                          <span>• {stages.length} etapa(s)</span>
                          <span>• {stages.reduce((acc, s) => acc + s.tasks.length, 0)} tarefa(s)</span>
                          <span>• {templateVars.length} variável(is)</span>
                          <span>• {uniqueRoles.length} papel(is) definido(s)</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Variables ──────────────────────────────── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações e Variáveis</CardTitle>
            <CardDescription>Defina a data base e preencha as variáveis do template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseDate">Data Base <span className="text-destructive">*</span></Label>
              <Input
                id="baseDate"
                type="date"
                value={baseDate}
                onChange={e => setBaseDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">As datas das tarefas serão calculadas a partir desta data</p>
            </div>

            {templateVars.length > 0 && (
              <>
                <Separator />
                <h3 className="font-medium">Variáveis do Template</h3>
                <div className="space-y-3">
                  {templateVars.map(v => (
                    <div key={v.name} className="space-y-1.5">
                      <Label htmlFor={`var_${v.name}`}>
                        {v.label}
                        {v.required && <span className="ml-1 text-destructive">*</span>}
                      </Label>
                      {v.type === 'textarea' ? (
                        <Textarea
                          id={`var_${v.name}`}
                          placeholder={`Informe ${v.label.toLowerCase()}`}
                          value={variables[v.name] || ''}
                          onChange={e => setVariables(p => ({ ...p, [v.name]: e.target.value }))}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={`var_${v.name}`}
                          type={v.type === 'number' ? 'number' : 'text'}
                          placeholder={`Informe ${v.label.toLowerCase()}`}
                          value={variables[v.name] || ''}
                          onChange={e => setVariables(p => ({ ...p, [v.name]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── STEP 3: Role Mappings ──────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapeamento de Responsáveis</CardTitle>
            <CardDescription>Defina quem será responsável por cada papel no template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uniqueRoles.length === 0 && uniqueDepartments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Este template não possui papéis ou departamentos definidos.
                  As tarefas serão criadas sem responsável atribuído.
                </p>
              </div>
            ) : (
              <>
                {uniqueRoles.map(role => (
                  <div key={role} className="space-y-1.5">
                    <Label>{role}</Label>
                    <Select
                      value={roleMappings[role] || ''}
                      onValueChange={v => setRoleMappings(p => ({ ...p, [role]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar membro (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {uniqueDepartments.map(dept => (
                  <div key={`dept_${dept}`} className="space-y-1.5">
                    <Label>Departamento: {dept}</Label>
                    <Select
                      value={roleMappings[`dept_${dept}`] || ''}
                      onValueChange={v => setRoleMappings(p => ({ ...p, [`dept_${dept}`]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar membro (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── STEP 4: Review ────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Aplicação</CardTitle>
              <CardDescription>Revise as tarefas que serão criadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-3 text-center">
                  <Layers className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-1 text-xl font-bold">{selectedTemplate?.name}</p>
                  <p className="text-xs text-muted-foreground">Template</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold">v{selectedVersion?.versionNumber}</p>
                  <p className="text-xs text-muted-foreground">Versão</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold">{formatDate(baseDate)}</p>
                  <p className="text-xs text-muted-foreground">Data Base</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xl font-bold">{stages.reduce((a, s) => a + s.tasks.length, 0)}</p>
                  <p className="text-xs text-muted-foreground">Tarefas</p>
                </div>
              </div>

              {templateVars.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-sm font-medium">Variáveis Preenchidas</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {templateVars.map(v => (
                        <div key={v.name} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                          <span className="text-sm text-muted-foreground">{v.label}:</span>
                          <span className="text-sm font-medium">{variables[v.name] || '(vazio)'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Task Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Tarefas que serão Criadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stages.map((stage, si) => (
                  <div key={si}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">Etapa {si + 1}</Badge>
                      <h3 className="font-medium">{stage.name}</h3>
                    </div>
                    <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
                      {stage.tasks.map((task, ti) => {
                        const assignedMember = task.role
                          ? members.find(m => m.id === roleMappings[task.role])
                          : null
                        return (
                          <div key={ti} className="rounded-lg border bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm">{task.title}</p>
                                {task.description && (
                                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {computeDueDate(baseDate, task.dueDateRule)}
                                  </span>
                                  {task.priority && (
                                    <Badge variant="outline" className="text-[10px] capitalize">{task.priority}</Badge>
                                  )}
                                  {task.department && (
                                    <Badge variant="outline" className="text-[10px]">{task.department}</Badge>
                                  )}
                                </div>
                                {/* Checklist preview */}
                                {task.checklist && task.checklist.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                      Checklist ({task.checklist.length})
                                    </p>
                                    {task.checklist.map((item, ci) => (
                                      <div key={ci} className="flex items-center gap-2 text-xs">
                                        <div className="h-3.5 w-3.5 rounded border" />
                                        <span>{item.text}</span>
                                        {item.required && <span className="text-destructive">*</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Documents preview */}
                                {task.documents && task.documents.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                      Documentos ({task.documents.length})
                                    </p>
                                    {task.documents.map((doc, di) => (
                                      <div key={di} className="flex items-center gap-2 text-xs">
                                        <FileText className="h-3 w-3" />
                                        <span>{doc.name}</span>
                                        {doc.required && <span className="text-destructive">*</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {assignedMember && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  {assignedMember.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── STEP 5: Confirm ───────────────────────────────── */}
      {step === 5 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Pronto para Aplicar</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Ao confirmar, serão criadas <strong>{stages.reduce((a, s) => a + s.tasks.length, 0)} tarefa(s)</strong> para o cliente{' '}
              <strong>{clientName}</strong> com base no template <strong>{selectedTemplate?.name}</strong>.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirmar e Criar Tarefas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Navigation Buttons ──────────────────────────────── */}
      {step < totalSteps && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={prevStep} disabled={step <= 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={nextStep} disabled={!canProceed()}>
            Próximo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}