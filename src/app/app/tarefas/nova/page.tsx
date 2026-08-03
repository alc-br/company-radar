'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  Plus,
  Calendar,
  Repeat,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface ClientItem {
  id: string
  name: string
}

interface MemberItem {
  id: string
  name: string
  email: string
}

interface DepartmentItem {
  id: string
  name: string
}

interface TagItem {
  id: string
  name: string
  color: string
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

const CATEGORIES = [
  'Contábil',
  'Fiscal',
  'Trabalhista',
  'Societário',
  'Financeiro',
  'Departamento Pessoal',
  'Governança Corporativa',
  'Planejamento Tributário',
  'Auditoria',
  'Outro',
]

const PRIORITIES = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

const RECURRENCE_FREQUENCIES = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'yearly', label: 'Anual' },
]

// ── Component ──────────────────────────────────────────────
export default function NovaTarefaPage() {
  const router = useRouter()
  const session = getSession()

  // Meta
  const [clients, setClients] = useState<ClientItem[]>([])
  const [members, setMembers] = useState<MemberItem[]>([])
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [metaLoading, setMetaLoading] = useState(true)

  // Form
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    clientId: '',
    priority: 'medium',
    category: '',
    departmentId: '',
    assignedTo: '',
    assignedToId: '',
    reviewerId: '',
    dueDate: '',
    // Recurrence
    hasRecurrence: false,
    recurrenceFrequency: 'monthly',
    recurrenceDayOfMonth: 10,
    recurrenceStart: '',
    recurrenceEnd: '',
    recurrenceMaxOccurrences: '',
    // Portal
    portalVisible: false,
    portalInstructions: '',
    // Tags
    selectedTags: [] as string[],
  })

  useEffect(() => {
    async function load() {
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
          setMembers(Array.isArray(mData) ? mData.map((m: MemberItem) => ({ id: m.id, name: m.name, email: m.email })) : [])
        }
        if (dRes.ok) {
          const dData = await dRes.json()
          setDepartments(dData.departments || [])
          setTags(dData.tags || [])
        }
      } catch {
        // silent
      } finally {
        setMetaLoading(false)
      }
    }
    load()
  }, [])

  const updateForm = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Informe o título da tarefa')
      return
    }
    if (!form.clientId) {
      toast.error('Selecione um cliente')
      return
    }

    setSaving(true)
    try {
      const recurrenceRule = form.hasRecurrence
        ? JSON.stringify({
            frequency: form.recurrenceFrequency,
            dayOfMonth: form.recurrenceDayOfMonth,
            startDate: form.recurrenceStart || null,
            endDate: form.recurrenceEnd || null,
            maxOccurrences: form.recurrenceMaxOccurrences ? parseInt(form.recurrenceMaxOccurrences) : null,
          })
        : null

      const body: Record<string, unknown> = {
        organizationId: session?.orgId,
        clientId: form.clientId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        category: form.category || null,
        departmentId: form.departmentId || null,
        assignedTo: form.assignedTo || null,
        assignedToId: form.assignedToId || null,
        reviewerId: form.reviewerId || null,
        dueDate: form.dueDate ? new Date(form.dueDate + 'T12:00:00').toISOString() : null,
        recurrenceRule,
        portalVisible: form.portalVisible,
        portalInstructions: form.portalVisible ? form.portalInstructions.trim() || null : null,
        tags: form.selectedTags,
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const task = await res.json()
        toast.success('Tarefa criada com sucesso!')
        router.push(`/app/tarefas/${task.id}`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao criar tarefa')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  if (metaLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/tarefas">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Tarefa</h1>
          <p className="text-sm text-muted-foreground">Crie uma nova tarefa para sua equipe</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Description */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Título <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="Ex: Declaração IRPF - João Silva"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os detalhes da tarefa..."
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Atribuição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Responsável</Label>
                  <Select
                    value={form.assignedToId}
                    onValueChange={(v) => {
                      const member = members.find((m) => m.id === v)
                      setForm((prev) => ({
                        ...prev,
                        assignedToId: v,
                        assignedTo: member?.name || '',
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Revisor</Label>
                  <Select
                    value={form.reviewerId}
                    onValueChange={(v) => updateForm('reviewerId', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => updateForm('category', v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhuma</SelectItem>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Departamento</Label>
                  <Select value={form.departmentId} onValueChange={(v) => updateForm('departmentId', v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portal Visibility */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Portal do Cliente</CardTitle>
                  <CardDescription className="text-xs mt-1">Tornar esta tarefa visível no portal do cliente</CardDescription>
                </div>
                <Switch
                  checked={form.portalVisible}
                  onCheckedChange={(checked) => updateForm('portalVisible', checked)}
                />
              </div>
            </CardHeader>
            {form.portalVisible && (
              <CardContent>
                <div className="space-y-1.5">
                  <Label htmlFor="portalInstructions">Instruções para o Portal</Label>
                  <Textarea
                    id="portalInstructions"
                    placeholder="Instruções que o cliente verá no portal..."
                    value={form.portalInstructions}
                    onChange={(e) => updateForm('portalInstructions', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Client & Priority */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cliente <span className="text-destructive">*</span></Label>
                <Select value={form.clientId} onValueChange={(v) => updateForm('clientId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => updateForm('priority', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Prazo</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateForm('dueDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recurrence */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">Recorrência</CardTitle>
                    <CardDescription className="text-xs mt-1">Criar tarefa recorrente</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={form.hasRecurrence}
                  onCheckedChange={(checked) => updateForm('hasRecurrence', checked)}
                />
              </div>
            </CardHeader>
            {form.hasRecurrence && (
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Frequência</Label>
                  <Select value={form.recurrenceFrequency} onValueChange={(v) => updateForm('recurrenceFrequency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recurrenceDay">Dia do Mês</Label>
                  <Input
                    id="recurrenceDay"
                    type="number"
                    min={1}
                    max={31}
                    value={form.recurrenceDayOfMonth}
                    onChange={(e) => updateForm('recurrenceDayOfMonth', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recurrenceStart">Início</Label>
                  <Input
                    id="recurrenceStart"
                    type="date"
                    value={form.recurrenceStart}
                    onChange={(e) => updateForm('recurrenceStart', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recurrenceEnd">Fim (opcional)</Label>
                  <Input
                    id="recurrenceEnd"
                    type="date"
                    value={form.recurrenceEnd}
                    onChange={(e) => updateForm('recurrenceEnd', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recurrenceMax">Máx. Ocorrências (opcional)</Label>
                  <Input
                    id="recurrenceMax"
                    type="number"
                    min={1}
                    placeholder="Ex: 12"
                    value={form.recurrenceMaxOccurrences}
                    onChange={(e) => updateForm('recurrenceMaxOccurrences', e.target.value)}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma etiqueta cadastrada.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = form.selectedTags.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border ${
                          isSelected
                            ? 'border-foreground/20 bg-foreground/5'
                            : 'border-border hover:bg-muted'
                        }`}
                        style={isSelected ? { borderColor: tag.color, backgroundColor: tag.color + '15', color: tag.color } : {}}
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            selectedTags: isSelected
                              ? prev.selectedTags.filter((t) => t !== tag.id)
                              : [...prev.selectedTags, tag.id],
                          }))
                        }}
                      >
                        {tag.name}
                        {isSelected && <X className="h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Tarefa
            </Button>
            <Link href="/app/tarefas">
              <Button variant="outline" className="w-full">Cancelar</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
