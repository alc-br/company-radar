'client'

import { useState, useEffect, useMemo } from 'react'
import {
  DollarSign,
  Building2,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  BadgeCheck,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Types ────────────────────────────────────────────────
interface OrgRow {
  id: string
  name: string
  tradeName: string | null
  cnpj: string | null
  plan: string
  onboardingCompleted: boolean
  createdAt: string
  _count: {
    clients: number
    members: number
  }
  subscriptions: Array<{
    status: string
    billingCycle: string
    currentPeriodEnd: string
    plan: {
      name: string
      price: number
    } | null
  }>
}

interface DashboardStats {
  mrr: number
  activeOrgs: number
  trials: number
  cancellations: number
  inadimplencia: number
  totalOrgs: number
}

// ── Helpers ──────────────────────────────────────────────
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function getPlanBadge(plan: string) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    free: { label: 'Grátis', variant: 'secondary' },
    essencial: { label: 'Essencial', variant: 'outline' },
    profissional: { label: 'Profissional', variant: 'default' },
    gestao: { label: 'Gestão', variant: 'default' },
    escala: { label: 'Escala', variant: 'default' },
    enterprise: { label: 'Enterprise', variant: 'default' },
  }
  const info = map[plan] || { label: plan, variant: 'secondary' as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Ativa', className: 'bg-green-100 text-green-700' },
    trial: { label: 'Trial', className: 'bg-amber-100 text-amber-700' },
    cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
    past_due: { label: 'Inadimplente', className: 'bg-orange-100 text-orange-700' },
  }
  const info = map[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  return <Badge className={info.className}>{info.label}</Badge>
}

// ── Stat Card ────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <div className="flex items-center gap-1 text-xs">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className="text-muted-foreground">{subtitle}</span>
              </div>
            )}
          </div>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Page ────────────────────────────────────────────
export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedOrg, setSelectedOrg] = useState<OrgRow | null>(null)

  useEffect(() => {
    loadAdminData()
  }, [])

  async function loadAdminData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || null)
        setOrgs(data.orgs || [])
      } else {
        // Fallback: load orgs directly
        const orgsRes = await fetch('/api/organizations?all=true')
        if (orgsRes.ok) {
          const orgsData = await orgsRes.json()
          const orgList = Array.isArray(orgsData) ? orgsData : orgsData.organizations || []
          setOrgs(orgList)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filteredOrgs = useMemo(() => {
    let result = [...orgs]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          (o.tradeName && o.tradeName.toLowerCase().includes(q)) ||
          (o.cnpj && o.cnpj.includes(q))
      )
    }

    if (filterPlan !== 'all') {
      result = result.filter((o) => o.plan === filterPlan)
    }

    if (filterStatus !== 'all') {
      result = result.filter((o) => {
        const sub = o.subscriptions?.[0]
        if (filterStatus === 'active') return sub?.status === 'active'
        if (filterStatus === 'trial') return !sub || sub.status === 'trial'
        if (filterStatus === 'cancelled') return sub?.status === 'cancelled'
        if (filterStatus === 'past_due') return sub?.status === 'past_due'
        return true
      })
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt)
      else if (sortField === 'clients') cmp = a._count.clients - b._count.clients
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [orgs, search, filterPlan, filterStatus, sortField, sortDir])

  // Compute stats from orgs if API doesn't return them
  const computedStats = useMemo(() => {
    if (stats) return stats
    const allOrgs = orgs
    let mrr = 0
    let active = 0
    let trials = 0
    let cancellations = 0
    let inadimplencia = 0

    for (const org of allOrgs) {
      const sub = org.subscriptions?.[0]
      if (sub) {
        if (sub.status === 'active') {
          active++
          mrr += sub.plan?.price || 0
        } else if (sub.status === 'cancelled') {
          cancellations++
        } else if (sub.status === 'past_due') {
          inadimplencia++
        }
      } else {
        trials++
      }
    }

    return {
      mrr,
      activeOrgs: active,
      trials,
      cancellations,
      inadimplencia,
      totalOrgs: allOrgs.length,
    }
  }, [orgs, stats])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#2563eb]" />
            <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral da plataforma — organizações, assinaturas e métricas
          </p>
        </div>
        <Button variant="outline" onClick={loadAdminData} disabled={loading}>
          Atualizar dados
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="MRR Estimado"
          value={formatCurrency(computedStats.mrr)}
          subtitle="Receita mensal recorrente"
          icon={DollarSign}
          trend="up"
          color="#16a34a"
        />
        <StatCard
          title="Organizações Ativas"
          value={String(computedStats.activeOrgs)}
          subtitle={`de ${computedStats.totalOrgs} total`}
          icon={Building2}
          color="#2563eb"
        />
        <StatCard
          title="Em Trial"
          value={String(computedStats.trials)}
          subtitle="Aguardando assinatura"
          icon={BadgeCheck}
          color="#f59e0b"
        />
        <StatCard
          title="Cancelamentos"
          value={String(computedStats.cancellations)}
          subtitle="Últimos 30 dias"
          icon={UserX}
          trend={computedStats.cancellations > 0 ? 'down' : 'neutral'}
          color="#dc2626"
        />
        <StatCard
          title="Inadimplência"
          value={String(computedStats.inadimplencia)}
          subtitle={computedStats.totalOrgs > 0 ? `${((computedStats.inadimplencia / computedStats.totalOrgs) * 100).toFixed(1)}% do total` : '0%'}
          icon={AlertTriangle}
          color="#ea580c"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, fantasia ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="free">Grátis</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="gestao">Gestão</SelectItem>
                  <SelectItem value="escala">Escala</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="past_due">Inadimplente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orgs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Organizações ({filteredOrgs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Nenhuma organização encontrada
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Ajuste os filtros ou aguarde novos cadastros
              </p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">
                      <button
                        onClick={() => toggleSort('name')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Organização
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <button
                        onClick={() => toggleSort('clients')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Clientes
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Dono</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <button
                        onClick={() => toggleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Criado em
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-12 pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org) => {
                    const sub = org.subscriptions?.[0]
                    const status = sub?.status || 'trial'
                    return (
                      <TableRow
                        key={org.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedOrg(org)}
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563eb]/10 text-[#2563eb] text-xs font-bold">
                              {org.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[200px]">
                                {org.name}
                              </p>
                              {org.cnpj && (
                                <p className="text-xs text-muted-foreground">{org.cnpj}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(org.plan)}</TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                        <TableCell>
                          <span className="font-medium">{org._count.clients}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                              {org._count.members > 0 ? '1' : '—'}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {org._count.members} membro(s)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {formatDate(org.createdAt)}
                        </TableCell>
                        <TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedOrg(org)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
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
        </CardContent>
      </Card>

      {/* Org Detail Dialog */}
      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#2563eb]" />
              {selectedOrg?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Nome Fantasia</p>
                  <p className="text-sm">{selectedOrg.tradeName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">CNPJ</p>
                  <p className="text-sm">{selectedOrg.cnpj || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Plano</p>
                  {getPlanBadge(selectedOrg.plan)}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedOrg.subscriptions?.[0]?.status || 'trial')}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Clientes</p>
                  <p className="text-sm font-semibold">{selectedOrg._count.clients}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Membros</p>
                  <p className="text-sm font-semibold">{selectedOrg._count.members}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Data de Criação</p>
                <p className="text-sm">{formatDate(selectedOrg.createdAt)}</p>
              </div>
              {selectedOrg.subscriptions?.[0] && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Assinatura</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Ciclo</p>
                        <p className="capitalize">{selectedOrg.subscriptions[0].billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Próx. venc.</p>
                        <p>{formatDate(selectedOrg.subscriptions[0].currentPeriodEnd)}</p>
                      </div>
                      {selectedOrg.subscriptions[0].plan && (
                        <div>
                          <p className="text-xs text-muted-foreground">Valor</p>
                          <p className="font-semibold">{formatCurrency(selectedOrg.subscriptions[0].plan.price)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
