'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface OrgMember {
  id: string
  name: string
  email: string
  status: string
}

interface TemplateVariable {
  id: string
  name: string
  label: string
  type: string
  required: boolean
}

// ── Constants ──────────────────────────────────────────────
const CATEGORIES = [
  'Tributário', 'Contábil', 'Trabalhista', 'Societário',
  'Fiscal', 'Departamento Pessoal', 'SPED', 'Competência', 'Outro',
]

const PERIODICITIES = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]

const VARIABLE_TYPES = [
  { value: 'texto', label: 'Texto' },
  { value: 'número', label: 'Número' },
  { value: 'data', label: 'Data' },
  { value: 'select', label: 'Seleção' },
  { value: 'booleano', label: 'Sim/Não' },
]

const COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0d9488', '#0891b2', '#475569',
]

// ── Helpers ────────────────────────────────────────────────
function getSession() {
  try {
    const raw = localStorage.getItem('cr_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Page ───────────────────────────────────────────────────
export default function NovoTemplatePage() {
  const router = useRouter()
  const session = getSession()

  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form fields
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [purpose, setPurpose] = useState('')
  const [category, setCategory] = useState('')
  const [color, setColor] = useState('#2563eb')
  const [responsibleId, setResponsibleId] = useState('')
  const [instructions, setInstructions] = useState('')
  const [warning, setWarning] = useState('')
  const [periodicity, setPeriodicity] = useState('')
  const [variables, setVariables] = useState<TemplateVariable[]>([])

  useEffect(() => {
    fetch('/api/team')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMembers((data || []).filter((m: OrgMember) => m.status === 'active')))
      .catch(() => {})
  }, [])

  function addVariable() {
    setVariables((prev) => [
      ...prev,
      { id: genId(), name: '', label: '', type: 'texto', required: false },
    ])
  }

  function removeVariable(id: string) {
    setVariables((prev) => prev.filter((v) => v.id !== id))
  }

  function updateVariable(id: string, field: keyof TemplateVariable, value: string | boolean) {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    )
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome é obrigatório'
    if (code.trim() && !/^[A-Z0-9\-]+$/.test(code.trim().toUpperCase())) {
      e.code = 'Use apenas letras, números e hífen (maiúsculas)'
    }
    // Check for duplicate variable names
    const varNames = variables.filter(v => v.name.trim()).map(v => v.name.trim())
    const dupes = varNames.filter((n, i) => varNames.indexOf(n) !== i)
    if (dupes.length > 0) e.variables = `Nomes duplicados: ${dupes.join(', ')}`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: session?.orgId || 'org-default',
          name: name.trim(),
          code: code.trim().toUpperCase() || null,
          description: description.trim() || null,
          purpose: purpose.trim() || null,
          category: category || null,
          color,
          responsibleId: responsibleId || null,
          instructions: instructions.trim() || null,
          warning: warning.trim() || null,
          defaultPeriodicity: periodicity || null,
          variables: variables
            .filter((v) => v.name.trim())
            .map((v) => ({
              name: v.name.trim().toLowerCase().replace(/\s+/g, '_'),
              label: v.label.trim() || v.name.trim(),
              type: v.type,
              required: v.required,
            })),
          stages: [],
        }),
      })
      if (res.ok) {
        const template = await res.json()
        toast.success('Template criado como rascunho!')
        router.push(`/app/templates/${template.id}?tab=editor`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao salvar')
      }
    } catch {
      toast.error('Erro ao criar template')
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/app/templates')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Template</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os metadados do template. Você poderá editar as etapas depois.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* ── Dados Básicos ──────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Básicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Ex: SPED Fiscal Mensal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código Interno</Label>
              <Input
                id="code"
                placeholder="Ex: SPED-FISCAL-MENSAL"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={`font-mono text-sm ${errors.code ? 'border-destructive' : ''}`}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
              <p className="text-[11px] text-muted-foreground">Único por organização</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o propósito e o escopo do template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="purpose">Finalidade</Label>
              <Textarea
                id="purpose"
                placeholder="Qual a finalidade deste template? Para que serve?"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Aparência ──────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Cor de Identificação</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      color === c ? 'scale-110 border-foreground ring-2 ring-foreground/20' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Responsável e Configurações ────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Responsável e Configurações</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável Técnico</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger id="responsible">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodicity">Periodicidade Padrão</Label>
              <Select value={periodicity} onValueChange={setPeriodicity}>
                <SelectTrigger id="periodicity">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="instructions">Instruções</Label>
              <Textarea
                id="instructions"
                placeholder="Instruções para quem for usar este template..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="warning">Aviso</Label>
              <Textarea
                id="warning"
                placeholder="Aviso jurídico ou observação importante sobre o uso deste template..."
                value={warning}
                onChange={(e) => setWarning(e.target.value)}
                rows={2}
                className="border-amber-200 focus-visible:ring-amber-300"
              />
              <p className="text-[11px] text-muted-foreground">Exibido como destaque amarelo ao usar o template</p>
            </div>
          </CardContent>
        </Card>

        {/* ── Variáveis ──────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Variáveis</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVariable}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
            </Button>
          </CardHeader>
          <CardContent>
            {errors.variables && (
              <p className="mb-3 text-xs text-destructive">{errors.variables}</p>
            )}
            {variables.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
                <p className="text-sm text-muted-foreground">
                  Nenhuma variável definida.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Variáveis permitem personalizar o template ao aplicar em uma empresa.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={addVariable}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Primeira Variável
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {variables.map((v, idx) => (
                  <div key={v.id} className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Nome</label>
                      <Input
                        placeholder="ex: competencia"
                        value={v.name}
                        onChange={(e) => updateVariable(v.id, 'name', e.target.value)}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    <div className="flex-1 min-w-[120px] space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Label</label>
                      <Input
                        placeholder="ex: Competência"
                        value={v.label}
                        onChange={(e) => updateVariable(v.id, 'label', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-[140px] space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Tipo</label>
                      <Select
                        value={v.type}
                        onValueChange={(val) => updateVariable(v.id, 'type', val)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VARIABLE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1.5 pb-1">
                      <Checkbox
                        checked={v.required}
                        onCheckedChange={(checked) => updateVariable(v.id, 'required', !!checked)}
                      />
                      <label className="text-xs text-muted-foreground cursor-pointer" onClick={() => updateVariable(v.id, 'required', !v.required)}>
                        Obrigatório
                      </label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeVariable(v.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Actions ────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" onClick={() => router.push('/app/templates')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Rascunho
          </Button>
        </div>
      </div>
    </div>
  )
}
