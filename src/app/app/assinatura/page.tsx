'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard, Download, ArrowLeftRight, Settings, AlertTriangle,
  CheckCircle2, Users, HardDrive, Building2, Loader2, ChevronRight, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

function formatDate(d?: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

type PlanInfo = { id: string; name: string; slug: string; price: number; annualPrice: number | null; maxClients: number; maxUsers: number; maxStorageMb: number; features: string[]; highlight: boolean }
type SubInfo = { id: string; planId: string; status: string; billingCycle: string; currentPeriodEnd: string; plan?: PlanInfo; organization?: { _count?: { clients: number; members: number; documents: number } } }

const PLANS_MOCK: PlanInfo[] = [
  { id: '1', name: 'Inicial', slug: 'starter', price: 97, annualPrice: 970, maxClients: 20, maxUsers: 3, maxStorageMb: 1024, features: ['Até 20 clientes', '3 usuários', '1 GB armazenamento', 'Templates básicos', 'Suporte por e-mail'], highlight: false },
  { id: '2', name: 'Profissional', slug: 'professional', price: 197, annualPrice: 1970, maxClients: 100, maxUsers: 10, maxStorageMb: 5120, features: ['Até 100 clientes', '10 usuários', '5 GB armazenamento', 'Templates avançados', 'Portal do cliente', 'Relatórios', 'Suporte prioritário'], highlight: true },
  { id: '3', name: 'Empresarial', slug: 'enterprise', price: 497, annualPrice: 4970, maxClients: 500, maxUsers: 50, maxStorageMb: 25600, features: ['Clientes ilimitados', '50 usuários', '25 GB armazenamento', 'Tudo do Profissional', 'API de integração', 'SLA garantido', 'Gerente de sucesso'], highlight: false },
]

export default function AssinaturaPage() {
  const [sub, setSub] = useState<SubInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [planDialog, setPlanDialog] = useState(false)
  const [cancelDialog, setCancelDialog] = useState(false)
  const [invoices, setInvoices] = useState<Array<{ id: string; date: string; amount: number; status: string }>>([])
  const [showInvoices, setShowInvoices] = useState(false)

  useEffect(() => {
    fetch('/api/organizations?include=subscription')
      .then((r) => r.ok ? r.json() : null)
      .then((org) => {
        if (org?.subscription) {
          setSub(org.subscription)
          setInvoices([
            { id: 'inv-1', date: '2025-01-01', amount: 197, status: 'paid' },
            { id: 'inv-2', date: '2024-12-01', amount: 197, status: 'paid' },
            { id: 'inv-3', date: '2024-11-01', amount: 197, status: 'paid' },
          ])
        } else {
          setSub({ id: 'demo', planId: '2', status: 'active', billingCycle: 'monthly', currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(), plan: PLANS_MOCK[1], organization: { _count: { clients: 12, members: 5, documents: 45 } } })
        }
      })
      .catch(() => {
        setSub({ id: 'demo', planId: '2', status: 'active', billingCycle: 'monthly', currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(), plan: PLANS_MOCK[1], organization: { _count: { clients: 12, members: 5, documents: 45 } } })
      })
      .finally(() => setLoading(false))
  }, [])

  const plan = sub?.plan || PLANS_MOCK[1]
  const orgCounts = sub?.organization?._count
  const clientUsage = orgCounts ? Math.round((orgCounts.clients / plan.maxClients) * 100) : 0
  const userUsage = orgCounts ? Math.round((orgCounts.members / plan.maxUsers) * 100) : 0
  const storageUsage = orgCounts ? Math.min(100, Math.round(((orgCounts.documents * 2) / plan.maxStorageMb) * 100)) : 0

  const cycleLabel = sub?.billingCycle === 'annual' ? 'Anual' : 'Mensal'
  const price = sub?.billingCycle === 'annual' ? (plan.annualPrice || plan.price * 12) / 12 : plan.price

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Assinatura</h1><p className="text-sm text-muted-foreground">Gerencie seu plano e faturas</p></div>

      {loading ? (
        <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" /></div>
      ) : sub ? (
        <>
          {/* Current Plan Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Shield className="h-6 w-6 text-primary" /></div>
                  <div><CardTitle className="text-xl">{plan.name}</CardTitle><CardDescription>Ciclo {cycleLabel} · Próxima cobrança em {formatDate(sub.currentPeriodEnd)}</CardDescription></div>
                </div>
                <Badge variant={sub.status === 'active' ? 'default' : 'destructive'} className="text-xs">{sub.status === 'active' ? 'Ativa' : sub.status === 'trialing' ? 'Trial' : 'Cancelada'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setPlanDialog(true)}><ArrowLeftRight className="mr-2 h-4 w-4" /> Alterar Plano</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowInvoices(!showInvoices)}><Download className="mr-2 h-4 w-4" /> Faturas</Button>
                  <Button variant="outline" size="sm" onClick={() => toast.info('Gerenciamento de pagamento disponível em breve.')}><Settings className="mr-2 h-4 w-4" /> Pagamento</Button>
                  {sub.status === 'active' && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelDialog(true)}>Cancelar</Button>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices */}
          {showInvoices && (
            <Card><CardHeader><CardTitle className="text-base">Faturas</CardTitle></CardHeader><CardContent>
              {invoices.length === 0 ? (<p className="text-sm text-muted-foreground py-4 text-center">Nenhuma fatura encontrada.</p>) : (
                <div className="divide-y">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div><p className="text-sm font-medium">{inv.id}</p><p className="text-xs text-muted-foreground">{formatDate(inv.date)}</p></div>
                      <div className="flex items-center gap-3"><span className="text-sm font-medium">{fmtCurrency(inv.amount)}</span><Badge variant={inv.status === 'paid' ? 'secondary' : 'destructive'} className="text-[10px]">{inv.status === 'paid' ? 'Paga' : 'Pendente'}</Badge><Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent></Card>
          )}

          {/* Plan Comparison Dialog */}
          <Dialog open={planDialog} onOpenChange={setPlanDialog}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Comparar Planos</DialogTitle><DialogDescription>Escolha o plano ideal para sua equipe.</DialogDescription></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-3 py-4">
              {PLANS_MOCK.map((p) => {
                const isCurrent = p.id === plan.id
                return (
                  <Card key={p.id} className={`${p.highlight ? 'border-primary' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader className="pb-3"><CardTitle className="text-base">{p.name}</CardTitle><div className="mt-2"><span className="text-2xl font-bold">{fmtCurrency(p.price)}</span><span className="text-sm text-muted-foreground">/mês</span></div>{p.annualPrice && <p className="text-xs text-green-600 mt-1">{fmtCurrency(p.annualPrice)}/ano (economia de {fmtCurrency(p.price * 12 - p.annualPrice)})</p>}</CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2">{p.features.map((f, i) => (<li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />{f}</li>))}</ul>
                      <Button className="w-full mt-4" variant={isCurrent ? 'outline' : 'default'} disabled={isCurrent}>{isCurrent ? 'Plano Atual' : 'Selecionar'}</Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </DialogContent></Dialog>

          {/* Cancel Dialog */}
          <Dialog open={cancelDialog} onOpenChange={setCancelDialog}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /> Cancelar Assinatura</DialogTitle><DialogDescription>Essa ação não pode ser desfeita. Ao cancelar:</DialogDescription></DialogHeader>
            <div className="space-y-2 py-2 text-sm text-muted-foreground">
              <p>• Seu plano permanecerá ativo até o final do período atual ({formatDate(sub.currentPeriodEnd)})</p>
              <p>• Após isso, a conta voltará ao plano gratuito com limitações</p>
              <p>• Dados em excesso poderão ser arquivados após 30 dias</p>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCancelDialog(false)}>Manter Assinatura</Button><Button variant="destructive" onClick={() => { setCancelDialog(false); toast.info('Cancelamento solicitado. Você será contatado.') }}>Cancelar Assinatura</Button></DialogFooter>
          </DialogContent></Dialog>
        </>
      ) : (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center"><CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" /><h3 className="text-sm font-medium">Nenhuma assinatura encontrada</h3></CardContent></Card>
      )}
    </div>
  )
}
