'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, Download, TrendingUp, TrendingDown, Clock, AlertTriangle,
  CheckCircle2, FileText, CalendarDays, Loader2, Users, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

function fmtNum(v: number) { return new Intl.NumberFormat('pt-BR').format(v) }

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, trend, trendLabel, color }: {
  title: string; value: string | number; icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string; color?: string
}) {
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color || 'bg-primary/10'}`}><Icon className={`h-5 w-5 ${color ? 'text-white' : 'text-primary'}`} /></div>
        {trend && trend !== 'neutral' && <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="text-[10px] gap-0.5">{trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{trendLabel}</Badge>}
      </div>
      <div className="mt-3"><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground mt-0.5">{title}</p></div>
    </CardContent></Card>
  )
}

export default function RelatoriosPage() {
  const [tab, setTab] = useState('produtividade')
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState<Record<string, unknown>>({})

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      params.set('type', tab)
      const res = await fetch(`/api/reports?${params}`)
      if (res.ok) { const d = await res.json(); setData(d) }
    } catch { toast.error('Erro ao carregar relatório') } finally { setLoading(false) }
  }, [tab, dateFrom, dateTo])

  useEffect(() => { fetchReport() }, [fetchReport])

  async function handleExport() {
    try {
      const res = await fetch('/api/exports', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: tab, format: 'csv', filters: { from: dateFrom, to: dateTo } }),
      })
      if (res.ok) toast.success('Exportação iniciada.')
    } catch { toast.error('Erro ao exportar') }
  }

  // ── Produtividade Tab ────────────────────────────────────
  function Produtividade() {
    const d = data as Record<string, number | Array<{ name: string; completed: number; total: number; avgTime: number }>>
    const personLoad = (d.personLoad || []) as Array<{ name: string; completed: number; total: number; avgTime: number }>
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Concluídas" value={fmtNum(d.completed ?? 0)} icon={CheckCircle2} color="bg-green-500" trend="up" trendLabel="+12%" />
          <StatCard title="No Prazo" value={fmtNum(d.onTime ?? 0)} icon={CheckCircle2} color="bg-emerald-500" />
          <StatCard title="Atrasadas" value={fmtNum(d.overdue ?? 0)} icon={AlertTriangle} color="bg-red-500" trend="down" trendLabel="-5%" />
          <StatCard title="Tempo Médio" value={`${d.avgTime ?? 0}h`} icon={Clock} color="bg-blue-500" />
        </div>
        <Card><CardHeader><CardTitle className="text-base">Carga por Pessoa</CardTitle></CardHeader><CardContent>
          {personLoad.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-6">Sem dados disponíveis</p>) : (
            <Table><TableHeader><TableRow><TableHead>Pessoa</TableHead><TableHead className="text-right">Concluídas</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Tempo Médio</TableHead><TableHead className="text-right">% Conclusão</TableHead></TableRow></TableHeader>
              <TableBody>{personLoad.map((p, i) => (<TableRow key={i}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="text-right">{p.completed}</TableCell><TableCell className="text-right">{p.total}</TableCell><TableCell className="text-right">{p.avgTime}h</TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-2"><div className="h-2 w-16 rounded-full bg-muted"><div className="h-2 rounded-full bg-green-500" style={{ width: `${p.total ? (p.completed / p.total) * 100 : 0}%` }} /></div><span className="text-xs">{p.total ? Math.round((p.completed / p.total) * 100) : 0}%</span></div></TableCell></TableRow>))}</TableBody></Table>
          )}
        </CardContent></Card>
      </div>
    )
  }

  // ── Carteira Tab ─────────────────────────────────────────
  function Carteira() {
    const d = data as Record<string, number | string[]>
    const noTemplates = (d.noTemplates || []) as string[]
    const withDelays = (d.withDelays || []) as string[]
    const inactive = (d.inactive || []) as string[]
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Sem Templates" value={noTemplates.length} icon={FileText} color="bg-amber-500" />
          <StatCard title="Com Atrasos" value={withDelays.length} icon={AlertTriangle} color="bg-red-500" />
          <StatCard title="Inativos" value={inactive.length} icon={Building2} color="bg-gray-500" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Sem Templates</CardTitle></CardHeader><CardContent className="max-h-48 overflow-y-auto">{noTemplates.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum</p> : <ul className="space-y-1">{noTemplates.map((c, i) => (<li key={i} className="text-xs py-0.5 border-b last:border-0">{c}</li>))}</ul>}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Com Atrasos</CardTitle></CardHeader><CardContent className="max-h-48 overflow-y-auto">{withDelays.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum</p> : <ul className="space-y-1">{withDelays.map((c, i) => (<li key={i} className="text-xs py-0.5 border-b last:border-0">{c}</li>))}</ul>}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Inativos</CardTitle></CardHeader><CardContent className="max-h-48 overflow-y-auto">{inactive.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum</p> : <ul className="space-y-1">{inactive.map((c, i) => (<li key={i} className="text-xs py-0.5 border-b last:border-0">{c}</li>))}</ul>}</CardContent></Card>
        </div>
      </div>
    )
  }

  // ── Prazos Tab ───────────────────────────────────────────
  function Prazos() {
    const d = data as Record<string, number | Array<{ title: string; client: string; dueDate: string; status: string }>>
    const upcoming = (d.upcoming || []) as Array<{ title: string; client: string; dueDate: string; status: string }>
    const recurring = (d.recurring || []) as Array<{ title: string; client: string; dueDate: string }>
    const accumulated = (d.accumulated || []) as Array<{ title: string; client: string; days: number }>
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Próximos Prazos" value={fmtNum(d.upcomingCount ?? upcoming.length)} icon={CalendarDays} color="bg-blue-500" />
          <StatCard title="Recorrências Futuras" value={fmtNum(d.recurringCount ?? recurring.length)} icon={TrendingUp} color="bg-purple-500" />
          <StatCard title="Atrasos Acumulados" value={fmtNum(d.accumulatedCount ?? accumulated.length)} icon={AlertTriangle} color="bg-red-500" />
        </div>
        <Card><CardHeader><CardTitle className="text-base">Atrasos Acumulados</CardTitle></CardHeader><CardContent>
          {accumulated.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-6">Sem atrasos acumulados</p>) : (
            <Table><TableHeader><TableRow><TableHead>Tarefa</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Dias em Atraso</TableHead></TableRow></TableHeader>
              <TableBody>{accumulated.map((a, i) => (<TableRow key={i}><TableCell className="font-medium">{a.title}</TableCell><TableCell className="text-muted-foreground">{a.client}</TableCell><TableCell className="text-right"><Badge variant="destructive">{a.days}d</Badge></TableCell></TableRow>))}</TableBody></Table>
          )}
        </CardContent></Card>
      </div>
    )
  }

  // ── Documentos Tab ───────────────────────────────────────
  function Documentos() {
    const d = data as Record<string, number | Array<{ name: string; status: string; daysToExpire: number }>>
    const expiring = (d.expiring || []) as Array<{ name: string; status: string; daysToExpire: number }>
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Solicitados" value={fmtNum(d.requested ?? 0)} icon={FileText} color="bg-amber-500" />
          <StatCard title="Recebidos" value={fmtNum(d.received ?? 0)} icon={CheckCircle2} color="bg-blue-500" />
          <StatCard title="Rejeitados" value={fmtNum(d.rejected ?? 0)} icon={AlertTriangle} color="bg-red-500" />
          <StatCard title="Pendentes" value={fmtNum(d.pending ?? 0)} icon={Clock} color="bg-orange-500" />
          <StatCard title="Expirando" value={fmtNum(d.expiringCount ?? expiring.length)} icon={AlertTriangle} color="bg-rose-500" />
        </div>
        <Card><CardHeader><CardTitle className="text-base">Documentos Expirando</CardTitle></CardHeader><CardContent>
          {expiring.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-6">Nenhum documento expirando em breve</p>) : (
            <Table><TableHeader><TableRow><TableHead>Documento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Dias para Expirar</TableHead></TableRow></TableHeader>
              <TableBody>{expiring.map((e, i) => (<TableRow key={i}><TableCell className="font-medium">{e.name}</TableCell><TableCell><Badge variant="outline">{e.status}</Badge></TableCell><TableCell className="text-right"><Badge variant={e.daysToExpire <= 7 ? 'destructive' : 'secondary'}>{e.daysToExpire}d</Badge></TableCell></TableRow>))}</TableBody></Table>
          )}
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Relatórios</h1><p className="text-sm text-muted-foreground">Análise detalhada da produtividade e carteira</p></div>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
      </div>

      <Card><CardContent className="flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-[160px]"><Label className="text-xs text-muted-foreground mb-1 block">De</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" /></div>
        <div className="min-w-[160px]"><Label className="text-xs text-muted-foreground mb-1 block">Até</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" /></div>
        <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo('') }}>Limpar</Button>
      </CardContent></Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="produtividade">Produtividade</TabsTrigger><TabsTrigger value="carteira">Carteira</TabsTrigger><TabsTrigger value="prazos">Prazos</TabsTrigger><TabsTrigger value="documentos">Documentos</TabsTrigger></TabsList>
        <TabsContent value="produtividade" className="mt-4">{loading ? <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-28" />))}</div> : <Produtividade />}</TabsContent>
        <TabsContent value="carteira" className="mt-4">{loading ? <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-28" />))}</div> : <Carteira />}</TabsContent>
        <TabsContent value="prazos" className="mt-4">{loading ? <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-28" />))}</div> : <Prazos />}</TabsContent>
        <TabsContent value="documentos" className="mt-4">{loading ? <div className="grid gap-4 sm:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-28" />))}</div> : <Documentos />}</TabsContent>
      </Tabs>
    </div>
  )
}
