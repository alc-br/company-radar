'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  FileSpreadsheet,
  LayoutTemplate,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Sparkles,
  Upload,
  Plus,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  ImageIcon,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────
type Session = {
  userId: string
  email: string
  name: string
  orgId: string
  role: string
}

const TOTAL_STEPS = 6

const SUGGESTED_DEPARTMENTS = [
  { name: 'Fiscal', color: '#ef4444', description: 'SPED, guias, tributos' },
  { name: 'Contábil', color: '#3b82f6', description: 'Escrituração, balanços, relatórios' },
  { name: 'Pessoal', color: '#10b981', description: 'Folha, e-social, FGTS' },
  { name: 'Societário', color: '#f59e0b', description: 'Contratos, atas, alterações' },
  { name: 'Atendimento', color: '#8b5cf6', description: 'Atendimento ao cliente' },
]

const TEMPLATE_EXAMPLES = [
  { id: 'mensal-contabil', name: 'Mensal Contábil', description: 'Escrituração mensal completa com conciliação, lançamentos e relatórios.', icon: '📊', category: 'Contábil' },
  { id: 'obrigacoes-fiscais', name: 'Obrigações Fiscais Mensais', description: 'SPED Fiscal, guias de pagamento e DARF mensais.', icon: '📋', category: 'Fiscal' },
  { id: 'encerramento-anual', name: 'Encerramento Anual', description: 'Balanço patrimonial, DCTF, ECF, IRPJ e CSLL.', icon: '📅', category: 'Contábil' },
  { id: 'folha-pagamento', name: 'Folha de Pagamento', description: 'Processamento mensal da folha, e-social e FGTS.', icon: '👥', category: 'Pessoal' },
  { id: 'sped-contribuicoes', name: 'SPED Contribuições', description: 'PIS/COFINS, apuração e retenções.', icon: '📑', category: 'Fiscal' },
]

const TIMEZONES = [
  { label: 'São Paulo (GMT-3)', value: 'America/Sao_Paulo' },
  { label: 'Rio de Janeiro (GMT-3)', value: 'America/Sao_Paulo' },
  { label: 'Belo Horizonte (GMT-3)', value: 'America/Sao_Paulo' },
  { label: 'Brasília (GMT-3)', value: 'America/Sao_Paulo' },
  { label: 'Manaus (GMT-4)', value: 'America/Manaus' },
  { label: 'Cuiabá (GMT-4)', value: 'America/Cuiaba' },
  { label: 'Porto Velho (GMT-4)', value: 'America/Porto_Velho' },
  { label: 'Recife (GMT-3)', value: 'America/Recife' },
  { label: 'Fortaleza (GMT-3)', value: 'America/Fortaleza' },
  { label: 'Curitiba (GMT-3)', value: 'America/Sao_Paulo' },
  { label: 'Porto Alegre (GMT-3)', value: 'America/Sao_Paulo' },]

const COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0d9488', '#0891b2', '#4f46e5',
]

// ── Step Components ──────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  const steps = [
    { icon: Building2, title: 'Dados da Organização', desc: 'Configure as informações do seu escritório' },
    { icon: Users, title: 'Estrutura', desc: 'Defina departamentos e equipes' },
    { icon: FileSpreadsheet, title: 'Importar Clientes', desc: 'Carregue sua base de clientes' },
    { icon: LayoutTemplate, title: 'Primeiro Template', desc: 'Escolha ou crie um modelo de trabalho' },
  ]

  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2563eb]/10">
          <Rocket className="h-10 w-10 text-[#2563eb]" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Bem-vindo ao <span className="text-[#2563eb]">Company Radar</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Configure seu escritório em poucos minutos. Vamos guiá-lo por cada etapa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-10">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <Card key={i} className="text-left hover:border-[#2563eb]/30 transition-colors">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb]/10 text-[#2563eb] font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-[#2563eb]" />
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button size="lg" onClick={onNext} className="gap-2">
        Começar configuração
        <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Você pode pular etapas e configurar depois
      </p>
    </div>
  )
}

function StepOrgData({
  onNext,
  onBack,
  saving,
}: {
  onNext: (data: Record<string, string>) => void
  onBack: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    crc: '',
    telefone: '',
    email: '',
    endereco: '',
    fuso: 'America/Sao_Paulo',
    corPrincipal: '#2563eb',
  })

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleNext() {
    if (!form.razaoSocial.trim()) {
      toast.error('Informe a razão social.')
      return
    }
    onNext(form)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Dados da Organização</h2>
        <p className="text-muted-foreground mt-1">
          Informe os dados básicos do seu escritório contábil.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input
                id="razaoSocial"
                placeholder="Ex: Silva & Associados Contabilidade Ltda"
                value={form.razaoSocial}
                onChange={(e) => updateField('razaoSocial', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
              <Input
                id="nomeFantasia"
                placeholder="Ex: Silva Contabilidade"
                value={form.nomeFantasia}
                onChange={(e) => updateField('nomeFantasia', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={(e) => updateField('cnpj', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="crc">CRC</Label>
              <Input
                id="crc"
                placeholder="Ex: 1SP123456/O-5"
                value={form.crc}
                onChange={(e) => updateField('crc', e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="telefone"
                  placeholder="(11) 99999-0000"
                  value={form.telefone}
                  onChange={(e) => updateField('telefone', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="emailOrg">E-mail do escritório</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="emailOrg"
                  type="email"
                  placeholder="contato@escritorio.com.br"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endereco"
                  placeholder="Rua, número, complemento, bairro, cidade - UF"
                  value={form.endereco}
                  onChange={(e) => updateField('endereco', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fuso">Fuso Horário</Label>
              <div className="relative mt-1.5">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="fuso"
                  value={form.fuso}
                  onChange={(e) => updateField('fuso', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2563eb]"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Cor Principal</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateField('corPrincipal', color)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        form.corPrincipal === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Cor ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>Logotipo</Label>
              <div className="mt-1.5 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 transition-colors hover:border-muted-foreground/50">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Envio de logotipo em breve — configure depois em Configurações
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    PNG, JPG até 2MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={saving}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} className="gap-2" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function StepStructure({
  onNext,
  onBack,
  saving,
}: {
  onNext: (departments: Array<{ name: string; color: string; description: string }>) => void
  onBack: () => void
  saving: boolean
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(SUGGESTED_DEPARTMENTS.map((d) => d.name))
  )
  const [customName, setCustomName] = useState('')
  const [customColor, setCustomColor] = useState('#6b7280')
  const [customItems, setCustomItems] = useState<Array<{ name: string; color: string }>>([])

  function toggleDept(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function addCustom() {
    if (!customName.trim()) return
    if (selected.has(customName.trim()) || customItems.find((d) => d.name === customName.trim())) {
      toast.error('Departamento já adicionado')
      return
    }
    setCustomItems((prev) => [...prev, { name: customName.trim(), color: customColor }])
    setCustomName('')
  }

  function removeCustom(name: string) {
    setCustomItems((prev) => prev.filter((d) => d.name !== name))
  }

  function handleNext() {
    const allDepts = []
    for (const dept of SUGGESTED_DEPARTMENTS) {
      if (selected.has(dept.name)) {
        allDepts.push(dept)
      }
    }
    for (const custom of customItems) {
      allDepts.push({ name: custom.name, color: custom.color, description: '' })
    }
    onNext(allDepts)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Estrutura do Escritório</h2>
        <p className="text-muted-foreground mt-1">
          Selecione os departamentos que compõem o seu escritório.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Departamentos Sugeridos</CardTitle>
          <CardDescription>Clique para selecionar ou remover</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUGGESTED_DEPARTMENTS.map((dept) => {
              const isSelected = selected.has(dept.name)
              return (
                <button
                  key={dept.name}
                  onClick={() => toggleDept(dept.name)}
                  className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
                    isSelected
                      ? 'border-[#2563eb] bg-[#2563eb]/5'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <div
                    className="mt-0.5 h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: dept.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{dept.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{dept.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-[#2563eb] shrink-0 ml-auto" />
                  )}
                </button>
              )
            })}
          </div>

          <Separator className="my-5" />

          <p className="text-sm font-medium mb-3">Adicionar Departamento Personalizado</p>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do departamento"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              className="flex-1"
            />
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border border-input"
              aria-label="Cor do departamento"
            />
            <Button variant="outline" onClick={addCustom} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {customItems.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {customItems.map((item) => (
                <Badge
                  key={item.name}
                  variant="secondary"
                  className="gap-1.5 py-1.5 px-3"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                  <button
                    onClick={() => removeCustom(item.name)}
                    className="ml-1 hover:text-destructive"
                    aria-label={`Remover ${item.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={saving}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} className="gap-2" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

type ParsedClientRow = { name: string; cnpj: string; email: string; phone: string; city: string; state: string }

function parseClientsCsv(text: string): ParsedClientRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const col = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1
  const idx = {
    name: col(['razao_social', 'nome', 'name']),
    cnpj: col(['cnpj']),
    email: col(['email', 'e-mail']),
    phone: col(['telefone', 'phone']),
    city: col(['cidade', 'city']),
    state: col(['estado', 'uf', 'state']),
  }
  if (idx.name < 0) return []
  const rows: ParsedClientRow[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split(',').map((c) => c.trim())
    const name = cells[idx.name] || ''
    if (!name) continue
    rows.push({
      name,
      cnpj: idx.cnpj >= 0 ? cells[idx.cnpj] || '' : '',
      email: idx.email >= 0 ? cells[idx.email] || '' : '',
      phone: idx.phone >= 0 ? cells[idx.phone] || '' : '',
      city: idx.city >= 0 ? cells[idx.city] || '' : '',
      state: idx.state >= 0 ? cells[idx.state] || '' : '',
    })
  }
  return rows
}

function StepImportClients({
  onNext,
  onBack,
  onImport,
  importing,
  importedCount,
}: {
  onNext: () => void
  onBack: () => void
  onImport: (rows: ParsedClientRow[]) => Promise<void>
  importing: boolean
  importedCount: number
}) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedCount, setParsedCount] = useState<number | null>(null)

  async function handleFile(f: File) {
    if (!f.name.endsWith('.csv')) {
      toast.error('Envie um arquivo CSV. Suporte a XLSX ainda não está disponível.')
      return
    }
    setFile(f)
    const text = await f.text()
    const rows = parseClientsCsv(text)
    setParsedCount(rows.length)
    if (rows.length === 0) toast.error('Não encontramos linhas válidas no CSV. Confira o cabeçalho.')
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleImportClick() {
    if (!file) return
    const text = await file.text()
    const rows = parseClientsCsv(text)
    if (rows.length === 0) { toast.error('Nenhuma linha válida para importar.'); return }
    await onImport(rows)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Importar Clientes</h2>
        <p className="text-muted-foreground mt-1">
          Carregue sua base de clientes ou pule esta etapa para adicionar depois.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-12 transition-colors hover:border-muted-foreground/50"
          >
            <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-sm">Arraste seu arquivo aqui</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Formato aceito: CSV
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Upload className="h-4 w-4" />
                Selecionar arquivo
              </span>
            </label>
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <FileSpreadsheet className="h-8 w-8 text-[#2563eb]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                  {parsedCount !== null && ` · ${parsedCount} cliente(s) identificado(s)`}
                </p>
              </div>
              <button
                onClick={() => { setFile(null); setParsedCount(null) }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remover arquivo"
              >
                <X className="h-4 w-4" />
              </button>
              {parsedCount !== null && parsedCount > 0 && importedCount === 0 && (
                <Button size="sm" onClick={handleImportClick} disabled={importing}>
                  {importing && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Importar {parsedCount}
                </Button>
              )}
            </div>
          )}

          {importedCount > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" /> {importedCount} cliente(s) importado(s) com sucesso.
            </div>
          )}

          <div className="mt-6 rounded-lg bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Formato esperado do CSV (cabeçalho na primeira linha):
            </p>
            <code className="text-xs text-muted-foreground bg-background rounded px-2 py-1">
              razao_social, cnpj, email, telefone, cidade, estado
            </code>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={importing}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext} disabled={importing}>
            Pular esta etapa
          </Button>
          <Button onClick={onNext} className="gap-2" disabled={importing}>
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function StepTemplate({
  onNext,
  onBack,
  saving,
}: {
  onNext: (templateId: string | null) => void
  onBack: () => void
  saving: boolean
}) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Primeiro Template</h2>
        <p className="text-muted-foreground mt-1">
          Escolha um modelo de trabalho para começar (criado vazio, pronto para você montar as etapas) ou crie um em branco depois.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATE_EXAMPLES.map((tmpl) => {
          const isSelected = selected === tmpl.id
          return (
            <button
              key={tmpl.id}
              onClick={() => setSelected(tmpl.id)}
              className={`text-left rounded-xl border-2 p-5 transition-all ${
                isSelected
                  ? 'border-[#2563eb] bg-[#2563eb]/5 shadow-sm'
                  : 'border-border hover:border-muted-foreground/30 hover:shadow-sm'
              }`}
            >
              <div className="text-3xl mb-3">{tmpl.icon}</div>
              <h3 className="font-semibold text-sm">{tmpl.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tmpl.description}</p>
              <Badge variant="secondary" className="mt-3 text-[10px]">
                {tmpl.category}
              </Badge>
            </button>
          )
        })}

        <button
          onClick={() => setSelected('__blank__')}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-all min-h-[180px] ${
            selected === '__blank__'
              ? 'border-[#2563eb] bg-[#2563eb]/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <Plus className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">
            Criar em branco
          </p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            Começar do zero em Templates
          </p>
        </button>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={saving}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onNext(null)} disabled={saving}>
            Pular esta etapa
          </Button>
          <Button onClick={() => onNext(selected)} className="gap-2" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function StepCompletion({
  onNext,
  onBack,
  completedSteps,
  saving,
}: {
  onNext: (extra: { teamInvited: boolean; alertsConfigured: boolean }) => void
  onBack: () => void
  completedSteps: {
    orgConfigured: boolean
    clientRegistered: boolean
    templateApplied: boolean
  }
  saving: boolean
}) {
  const [teamInvited, setTeamInvited] = useState(false)
  const [alertsConfigured, setAlertsConfigured] = useState(false)

  const items = [
    { key: 'orgConfigured' as const, label: 'Organização configurada', desc: 'Dados básicos preenchidos', checked: completedSteps.orgConfigured, editable: false },
    { key: 'clientRegistered' as const, label: 'Cliente cadastrado', desc: 'Primeiro cliente adicionado', checked: completedSteps.clientRegistered, editable: false },
    { key: 'templateApplied' as const, label: 'Template aplicado', desc: 'Modelo de trabalho selecionado', checked: completedSteps.templateApplied, editable: false },
    { key: 'teamInvited' as const, label: 'Equipe convidada', desc: 'Convide colaboradores em Equipe quando quiser', checked: teamInvited, editable: true, onToggle: () => setTeamInvited((v) => !v) },
    { key: 'alertsConfigured' as const, label: 'Alertas configurados', desc: 'Ajuste em Configurações > Alertas quando quiser', checked: alertsConfigured, editable: true, onToggle: () => setAlertsConfigured((v) => !v) },
  ]

  const doneCount = items.filter((i) => i.checked).length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563eb]/10">
          <Sparkles className="h-8 w-8 text-[#2563eb]" />
        </div>
        <h2 className="text-2xl font-bold">Quase lá!</h2>
        <p className="text-muted-foreground mt-1">
          Este é o seu progresso real nesta configuração. Os dois últimos itens você pode fazer a qualquer momento.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {items.map((item) => (
              <label
                key={item.key}
                className={`flex items-start gap-3 rounded-lg border border-border p-4 transition-colors ${item.editable ? 'cursor-pointer hover:bg-muted/30' : 'opacity-90'}`}
              >
                <Checkbox
                  checked={item.checked}
                  disabled={!item.editable}
                  onCheckedChange={item.editable ? item.onToggle : undefined}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                {item.checked && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                )}
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-sm font-medium">
              Progresso: {doneCount}/{items.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {doneCount === items.length
                ? 'Tudo pronto! 🎉'
                : `${items.length - doneCount} restante(s)`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={saving}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={() => onNext({ teamInvited, alertsConfigured })} className="gap-2" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Rocket className="h-4 w-4" />
          Concluir configuração
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [orgId, setOrgId] = useState<string>('')
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [orgConfigured, setOrgConfigured] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [templateApplied, setTemplateApplied] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cr_session')
      if (raw) {
        const parsed = JSON.parse(raw)
        setSession(parsed)
        setOrgId(parsed.orgId || '')
      }
    } catch {
      // ignore
    }
  }, [])

  function persistOrgId(id: string) {
    setOrgId(id)
    try {
      const raw = localStorage.getItem('cr_session')
      const parsed = raw ? JSON.parse(raw) : {}
      localStorage.setItem('cr_session', JSON.stringify({ ...parsed, orgId: id }))
    } catch {
      // ignore
    }
  }

  async function ensureOrg(fallbackName: string): Promise<string | null> {
    if (orgId) return orgId
    const res = await fetch('/api/organizations/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fallbackName || 'Minha Organização' }),
    })
    if (!res.ok) return null
    const created = await res.json()
    persistOrgId(String(created.id))
    return String(created.id)
  }

  async function saveOrgData(data: Record<string, string>) {
    setSaving(true)
    try {
      const activeOrgId = await ensureOrg(data.razaoSocial)
      if (!activeOrgId) { toast.error('Erro ao criar organização'); return }

      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.razaoSocial,
          tradeName: data.nomeFantasia,
          cnpj: data.cnpj,
          email: data.email,
          phone: data.telefone,
          address: data.endereco,
          timezone: data.fuso,
          primaryColor: data.corPrincipal,
          settings: { crc: data.crc },
        }),
      })
      if (!res.ok) { toast.error('Erro ao salvar dados da organização'); return }
      setOrgConfigured(true)
      setStep(3)
    } catch {
      toast.error('Erro ao salvar dados')
    } finally {
      setSaving(false)
    }
  }

  async function saveDepartments(
    departments: Array<{ name: string; color: string; description: string }>
  ) {
    if (departments.length === 0) { setStep(4); return }
    setSaving(true)
    try {
      const results = await Promise.all(
        departments.map((d) =>
          fetch('/api/departments', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: d.name, color: d.color, description: d.description }),
          }).then((r) => r.ok)
        )
      )
      const created = results.filter(Boolean).length
      if (created > 0) toast.success(`${created} departamento(s) criado(s)`)
      if (created < departments.length) toast.error(`${departments.length - created} departamento(s) não puderam ser criados`)
      setStep(4)
    } catch {
      toast.error('Erro ao salvar departamentos')
    } finally {
      setSaving(false)
    }
  }

  async function importClients(rows: ParsedClientRow[]) {
    setImporting(true)
    try {
      const results = await Promise.all(
        rows.map((row) =>
          fetch('/api/clients', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: row.name, cnpj: row.cnpj, email: row.email, phone: row.phone, city: row.city, state: row.state }),
          }).then((r) => r.ok)
        )
      )
      const created = results.filter(Boolean).length
      setImportedCount(created)
      if (created > 0) toast.success(`${created} cliente(s) importado(s)`)
      if (created < rows.length) toast.error(`${rows.length - created} linha(s) não puderam ser importadas`)
    } catch {
      toast.error('Erro ao importar clientes')
    } finally {
      setImporting(false)
    }
  }

  async function applyTemplate(templateId: string | null) {
    if (!templateId || templateId === '__blank__') { setStep(6); return }
    setSaving(true)
    try {
      const example = TEMPLATE_EXAMPLES.find((t) => t.id === templateId)
      if (!example) { setStep(6); return }
      const res = await fetch('/api/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: example.name, description: example.description, category: example.category, stages: [] }),
      })
      if (res.ok) { setTemplateApplied(true); toast.success('Template criado — edite as etapas em Templates.') }
      else toast.error('Erro ao criar template')
      setStep(6)
    } catch {
      toast.error('Erro ao criar template')
      setStep(6)
    } finally {
      setSaving(false)
    }
  }

  async function finishOnboarding(extra: { teamInvited: boolean; alertsConfigured: boolean }) {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCompleted: true, settings: { onboarding: extra } }),
      })
      if (!res.ok) { toast.error('Erro ao concluir. Tente novamente.'); return }
      toast.success('Configuração concluída com sucesso!')
      router.replace('/app')
    } catch {
      toast.error('Erro ao concluir. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  const progressPercent = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with progress */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]">
                <span className="text-white font-bold text-xs">CR</span>
              </div>
              <span className="font-semibold text-sm">Configuração Inicial</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Etapa {step} de {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </header>

      {/* Step Content */}
      <div className="px-4 py-8">
        {step === 1 && (
          <StepWelcome onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <StepOrgData
            onNext={saveOrgData}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}
        {step === 3 && (
          <StepStructure
            onNext={saveDepartments}
            onBack={() => setStep(2)}
            saving={saving}
          />
        )}
        {step === 4 && (
          <StepImportClients
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
            onImport={importClients}
            importing={importing}
            importedCount={importedCount}
          />
        )}
        {step === 5 && (
          <StepTemplate
            onNext={applyTemplate}
            onBack={() => setStep(4)}
            saving={saving}
          />
        )}
        {step === 6 && (
          <StepCompletion
            onNext={finishOnboarding}
            onBack={() => setStep(5)}
            saving={saving}
            completedSteps={{
              orgConfigured,
              clientRegistered: importedCount > 0,
              templateApplied,
            }}
          />
        )}
      </div>
    </div>
  )
}
