'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
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
function getSession() {
  try {
    const raw = localStorage.getItem('cr_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function formatCNPJInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function stripCNPJ(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function stripCEP(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function stripPhone(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const TAX_REGIMES = [
  { value: 'Simples Nacional', label: 'Simples Nacional' },
  { value: 'Lucro Presumido', label: 'Lucro Presumido' },
  { value: 'Lucro Real', label: 'Lucro Real' },
]

const COMPANY_SIZES = [
  { value: 'ME', label: 'ME - Microempresa' },
  { value: 'EPP', label: 'EPP - Empresa de Pequeno Porte' },
  { value: 'Media', label: 'Média Empresa' },
  { value: 'Grande', label: 'Grande Empresa' },
]

const SEGMENTS = [
  'Comércio', 'Indústria', 'Serviços', 'Agronegócio', 'Tecnologia',
  'Saúde', 'Construção Civil', 'Educação', 'Finanças', 'Logística', 'Outro',
]

// ── Page ───────────────────────────────────────────────────
export default function NovoClientePage() {
  const router = useRouter()
  const session = getSession()

  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Form fields
  const [name, setName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [ie, setIe] = useState('')
  const [im, setIm] = useState('')
  const [cnae, setCnae] = useState('')
  const [taxRegime, setTaxRegime] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [segment, setSegment] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [responsibleId, setResponsibleId] = useState('')
  const [notes, setNotes] = useState('')

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.ok ? r.json() : [])
      .then(data => setMembers(data.filter((m: OrgMember) => m.status === 'active')))
      .catch(() => {})
    // fetch tags
    fetch('/api/clients?limit=100')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.clients) {
          const allTags: TagItem[] = []
          const seen = new Set<string>()
          data.clients.forEach((c: { tagsList: TagItem[] }) => {
            c.tagsList.forEach(t => {
              if (!seen.has(t.id)) {
                seen.add(t.id)
                allTags.push(t)
              }
            })
          })
          setTags(allTags)
        }
      })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Razão Social é obrigatória'
    if (!cnpj.trim()) e.cnpj = 'CNPJ é obrigatório'
    else if (stripCNPJ(cnpj).length !== 14) e.cnpj = 'CNPJ deve ter 14 dígitos'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: session?.orgId || 'org-default',
          name: name.trim(),
          tradeName: tradeName.trim() || null,
          cnpj: stripCNPJ(cnpj),
          ie: ie.trim() || null,
          im: im.trim() || null,
          cnae: cnae.trim() || null,
          taxRegime: taxRegime || null,
          companySize: companySize || null,
          segment: segment || null,
          openDate: openDate || null,
          email: email.trim() || null,
          phone: stripPhone(phone) || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state || null,
          zipCode: stripCEP(zipCode) || null,
          responsibleId: responsibleId || null,
          notes: notes.trim() || null,
          tags: selectedTags,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }
      const client = await res.json()
      toast.success('Cliente criado com sucesso!')
      router.push(`/app/empresas/${client.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar cliente')
    } finally {
      setSaving(false)
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/app/empresas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados para cadastrar um novo cliente</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* ── Dados Cadastrais ──────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Razão Social <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Empresa Ltda."
                value={name}
                onChange={e => setName(e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia</Label>
              <Input
                id="tradeName"
                placeholder="Nome Fantasia"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ <span className="text-destructive">*</span></Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={e => setCnpj(formatCNPJInput(e.target.value))}
                className={`font-mono ${errors.cnpj ? 'border-destructive' : ''}`}
              />
              {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="openDate">Data de Abertura</Label>
              <Input
                id="openDate"
                type="date"
                value={openDate}
                onChange={e => setOpenDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ie">Inscrição Estadual</Label>
              <Input
                id="ie"
                placeholder="123.456.789.000"
                value={ie}
                onChange={e => setIe(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="im">Inscrição Municipal</Label>
              <Input
                id="im"
                placeholder="12345"
                value={im}
                onChange={e => setIm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE</Label>
              <Input
                id="cnae"
                placeholder="0000-0/00"
                value={cnae}
                onChange={e => setCnae(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRegime">Regime Tributário</Label>
              <Select value={taxRegime} onValueChange={setTaxRegime}>
                <SelectTrigger id="taxRegime">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_REGIMES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companySize">Porte da Empresa</Label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger id="companySize">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segmento</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger id="segment">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Contato ───────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Endereço ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua, número, complemento"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="São Paulo"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BR_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  placeholder="00000-000"
                  value={zipCode}
                  onChange={e => setZipCode(formatCEP(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Responsável e Tags ────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipe e Classificação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger id="responsible">
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 rounded-md border p-2 min-h-[42px]">
                {selectedTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId)
                  if (!tag) return null
                  return (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer gap-1"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      <X className="h-3 w-3" />
                    </Badge>
                  )
                })}
                {selectedTags.length === 0 && (
                  <span className="text-sm text-muted-foreground">Nenhuma tag selecionada</span>
                )}
              </div>
              {tags.filter(t => !selectedTags.includes(t.id)).length > 0 && (
                <Select onValueChange={v => toggleTag(v)}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="+ Adicionar tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags
                      .filter(t => !selectedTags.includes(t.id))
                      .map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Observações ───────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observações sobre o cliente..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* ── Actions ───────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button variant="outline" onClick={() => router.push('/app/empresas')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Cliente
          </Button>
        </div>
      </div>
    </div>
  )
}