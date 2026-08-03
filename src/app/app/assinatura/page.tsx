'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard, Download, ArrowLeftRight, Settings, AlertTriangle,
  CheckCircle2, Users, HardDrive, Building2, Loader2, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PageTour, TourRestartButton, usePageTour, type TourStep } from '@/components/page-tour'

const ASSINATURA_TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="ass-header"]', title: 'Assinatura', description: 'Acompanhe seu plano atual, uso de recursos e faturas.' },
  { selector: '[data-tour="ass-plan"]', title: 'Seu plano', description: 'Veja quanto você já usou de clientes, usuários e armazenamento em relação ao limite do plano.' },
  { selector: '[data-tour="ass-actions"]', title: 'Gerenciar', description: 'Troque de plano, veja as faturas ou cancele a assinatura por aqui.' },
]

function formatDate(d?: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

type PlanInfo = {
  id: number; name: string; slug: string; price: number; annualPrice: number | null
  maxClients: number; maxUsers: number; maxStorageMb: number; features: string[]
  highlight: boolean; isCurrent: boolean
}
type SubInfo = {
  id: number; planId: number; status: string; billingCycle: string
  currentPeriodEnd: string; cancelAtPeriodEnd: boolean; plan: PlanInfo
  organization?: { count?: { clients: number; members: number; documents: number } }
}
type Invoice = { id: number; date: string; amount: number; status: string }

export default function AssinaturaPage() {
  const { active: tourActive, start: startTour, finish: finishTour } = usePageTour('assinatura')
  const [sub, setSub] = useState<SubInfo | null>(null)
  const [plans, setPlans] = useState<PlanInfo[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [changingPlanId, setChangingPlanId] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [planDialog, setPlanDialog] = useState(false)
  const [cancelDialog, setCancelDialog] = useState(false)
  const [showInvoices, setShowInvoices] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [orgRes, plansRes] = await Promise.all([
        fetch('/api/organizations?include=subscription'),
        fetch('/api/plans'),
      ])
      if (orgRes.ok) { const org = await orgRes.json(); setSub(org.subscription || null) }
      if (plansRes.ok) { const p = await plansRes.json(); setPlans(Array.isArray(p) ? p : []) }
    } catch {
      toast.error('Erro ao carregar dados da assinatura')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!showInvoices) return
    fetch('/api/invoices').then((r) => r.ok ? r.json() : []).then((d) => setInvoices(Array.isArray(d) ? d : [])).catch(() => {})
  }, [showInvoices])

  async function handleChangePlan(planId: number) {
    setChangingPlanId(planId)
    try {
      const res = await fetch('/api/organizations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId }) })
      if (res.ok) { const updated = await res.json(); setSub(updated); toast.success('Plano alterado com sucesso!'); setPlanDialog(false) }
      else { const err = await res.json(); toast.error(err.error || 'Erro ao alterar plano') }
    } catch { toast.error('Erro ao alterar plano') } finally { setChangingPlanId(null) }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const res = await fetch('/api/organizations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cancel: true }) })
      if (res.ok) { const updated = await res.json(); setSub(updated); setCancelDialog(false); toast.success('Cancelamento agendado para o fim do período atual.') }
      else { toast.error('Erro ao cancelar assinatura') }
    } catch { toast.error('Erro ao cancelar assinatura') } finally { setCancelling(false) }
  }

  async function handleReactivate() {
    try {
      const res = await fetch('/api/organizations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cancel: false }) })
      if (res.ok) { const updated = await res.json(); setSub(updated); toast.success('Assinatura reativada.') }
    } catch { toast.error('Erro ao reativar assinatura') }
  }

  const plan = sub?.plan
  const orgCounts = sub?.organization?.count
  const clientUsage = orgCounts && plan ? Math.round((orgCounts.clients / plan.maxClients) * 100) : 0
  const userUsage = orgCounts && plan ? Math.round((orgCounts.members / plan.maxUsers) * 100) : 0
  const storageUsage = orgCounts && plan ? Math.min(100, Math.round(((orgCounts.documents * 2) / plan.maxStorageMb) * 100)) : 0

  const cycleLabel = sub?.billingCycle === 'annual' ? 'Anual' : 'Mensal'
  const price = plan ? (sub?.billingCycle === 'annual' ? (plan.annualPrice || plan.price * 12) / 12 : plan.price) : 0

  const statusLabel: Record<string, string> = { active: 'Ativa', trialing: 'Em teste', past_due: 'Atrasada', canceled: 'Cancelada', paused: 'Pausada', unpaid: 'Não paga' }
  const statusVariant = sub?.status === 'active' || sub?.status === 'trialing' ? 'default' : 'destructive'

  return (
    <div className="space-y-6 max-w-4xl">
      <PageTour steps={ASSINATURA_TOUR_STEPS} active={tourActive} onFinish={finishTour} />
      <div className="flex items-center gap-2" data-tour="ass-header">
        <div><h1 className="text-2xl font-bold tracking-tight">Assinatura</h1><p className="text-sm text-muted-foreground">Gerencie seu plano e faturas</p></div>
        <TourRestartButton onClick={startTour} />
      </div>

      {loading ? (
        <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" /></div>
      ) : sub && plan ? (
        <>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" data-tour="ass-plan">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Shield className="h-6 w-6 text-primary" /></div>
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      Ciclo {cycleLabel} · {sub.cancelAtPeriodEnd ? 'Cancela em' : 'Próxima cobrança em'} {formatDate(sub.currentPeriodEnd)}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={statusVariant} className="text-xs">{statusLabel[sub.status] || sub.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {sub.cancelAtPeriodEnd && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center justify-between">
                  <span>Cancelamento agendado para {formatDate(sub.currentPeriodEnd)}.</span>
                  <Button variant="link" size="sm" className="h-auto p-0 text-amber-900 underline" onClick={handleReactivate}>Reativar</Button>
                </div>
              )}
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> Clientes</span><span className="font-medium">{orgCounts?.clients || 0}/{plan.maxClients}</span></div>
                  <Progress value={clientUsage} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" /> Usuários</span><span className="font-medium">{orgCounts?.members || 0}/{plan.maxUsers}</span></div>
                  <Progress value={userUsage} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1.5 text-muted-foreground"><HardDrive className="h-3.5 w-3.5" /> Armazenamento</span><span className="font-medium">{(orgCounts?.documents || 0) * 2} MB/{plan.maxStorageMb} MB</span></div>
                  <Progress value={storageUsage} className="h-2" />
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div><p className="text-xs text-muted-foreground">Valor mensal</p><p className="text-2xl font-bold">{fmtCurrency(price)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p></div>
                <div className="flex gap-2 flex-wrap" data-tour="ass-actions">
                  <Button variant="outline" size="sm" onClick={() => setPlanDialog(true)}><ArrowLeftRight className="mr-2 h-4 w-4" /> Alterar Plano</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowInvoices(!showInvoices)}><Download className="mr-2 h-4 w-4" /> Faturas</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Gerenciamento de pagamento disponível em breve.')}><Settings className="mr-2 h-4 w-4" /> Pagamento</Button>
                  {!sub.cancelAtPeriodEnd && sub.status !== 'canceled' && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelDialog(true)}>Cancelar</Button>}
                </div>
              </div>
            </CardContent>
          </Card>

          {showInvoices && (
            <Card><CardHeader><CardTitle className="text-base">Faturas</CardTitle></CardHeader><CardContent>
              {invoices.length === 0 ? (<p className="text-sm text-muted-foreground py-4 text-center">Nenhuma fatura encontrada.</p>) : (
                <div className="divide-y">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div><p className="text-sm font-medium">Fatura #{inv.id}</p><p className="text-xs text-muted-foreground">{formatDate(inv.date)}</p></div>
                      <div className="flex items-center gap-3"><span className="text-sm font-medium">{fmtCurrency(inv.amount)}</span><Badge variant={inv.status === 'paid' ? 'secondary' : 'destructive'} className="text-[10px]">{inv.status === 'paid' ? 'Paga' : 'Pendente'}</Badge></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent></Card>
          )}

          <Dialog open={planDialog} onOpenChange={setPlanDialog}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Comparar Planos</DialogTitle><DialogDescription>Escolha o plano ideal para sua equipe.</DialogDescription></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-3 py-4">
              {plans.map((p) => {
                const isCurrent = p.id === sub.planId
                return (
                  <Card key={p.id} className={`${p.highlight ? 'border-primary' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader className="pb-3"><CardTitle className="text-base">{p.name}</CardTitle><div className="mt-2"><span className="text-2xl font-bold">{fmtCurrency(p.price)}</span><span className="text-sm text-muted-foreground">/mês</span></div>{p.annualPrice && <p className="text-xs text-green-600 mt-1">{fmtCurrency(p.annualPrice)}/ano (economia de {fmtCurrency(p.price * 12 - p.annualPrice)})</p>}</CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2">{p.features.map((f, i) => (<li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />{f}</li>))}</ul>
                      <Button className="w-full mt-4" variant={isCurrent ? 'outline' : 'default'} disabled={isCurrent || changingPlanId !== null} onClick={() => handleChangePlan(p.id)}>
                        {changingPlanId === p.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isCurrent ? 'Plano Atual' : 'Selecionar'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </DialogContent></Dialog>

          <Dialog open={cancelDialog} onOpenChange={setCancelDialog}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Cancelar Assinatura</DialogTitle><DialogDescription>Essa ação não pode ser desfeita. Ao cancelar:</DialogDescription></DialogHeader>
            <div className="space-y-2 py-2 text-sm text-muted-foreground">
              <p>• Seu plano permanecerá ativo até o final do período atual ({formatDate(sub.currentPeriodEnd)})</p>
              <p>• Após isso, a conta voltará ao plano gratuito com limitações</p>
              <p>• Dados em excesso poderão ser arquivados após 30 dias</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialog(false)}>Manter Assinatura</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>{cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cancelar Assinatura</Button>
            </DialogFooter>
          </DialogContent></Dialog>
        </>
      ) : (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center"><CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" /><h3 className="text-sm font-medium">Nenhuma assinatura encontrada</h3></CardContent></Card>
      )}
    </div>
  )
}
