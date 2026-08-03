'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Clock, FileText, CalendarDays, AlertTriangle,
  CheckCircle2, Upload, ChevronRight, Megaphone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { PageTour, TourRestartButton, usePageTour, type TourStep } from '@/components/page-tour'

const PORTAL_HOME_TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="ph-header"]', title: 'Bem-vindo ao Portal', description: 'Aqui você acompanha tudo o que seu escritório de contabilidade precisa de você: pendências, documentos e prazos.' },
  { selector: '[data-tour="ph-cards"]', title: 'Resumo rápido', description: 'Cada cartão mostra um resumo e leva direto para a tela completa — clique para ver mais detalhes ou enviar algo.' },
]

function getPortalSession() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('cr_portal') || 'null') } catch { return null }
}

export default function PortalHomePage() {
  const { active: tourActive, start: startTour, finish: finishTour } = usePageTour('portal-home')
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; dueDate: string; status: string; clientName: string }>>([])
  const [docRequests, setDocRequests] = useState<Array<{ id: string; title: string; dueDate: string; status: string }>>([])
  const [deadlines, setDeadlines] = useState<Array<{ id: string; title: string; dueDate: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getPortalSession()
    if (!session) return

    Promise.all([
      fetch('/api/v1/portal/tasks').then((r) => r.ok ? r.json() : []),
      fetch('/api/v1/portal/document-requests?status=solicitado').then((r) => r.ok ? r.json() : []),
      fetch('/api/v1/portal/calendar').then((r) => r.ok ? r.json() : { events: [] }),
    ]).then(([t, dr, c]) => {
      setTasks(Array.isArray(t) ? t.filter((task: { status: string }) => task.status !== 'concluida') : [])
      const drData = dr.requests || dr
      setDocRequests(Array.isArray(drData) ? drData : [])
      setDeadlines((c.events || []).slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function formatDate(d: string) { const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}` }

  return (
    <div className="space-y-6">
      <PageTour steps={PORTAL_HOME_TOUR_STEPS} active={tourActive} onFinish={finishTour} />
      <div className="flex items-center gap-2" data-tour="ph-header">
        <div><h1 className="text-2xl font-bold tracking-tight">Bem-vindo ao Portal</h1><p className="text-sm text-muted-foreground">Acompanhe suas pendências e documentos</p></div>
        <TourRestartButton onClick={startTour} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-40" />))}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="ph-cards">
          <Link href="/portal/pendencias">
            <Card className="group hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">Pendências</CardTitle><Clock className="h-5 w-5 text-amber-500" /></div></CardHeader>
              <CardContent>
                {tasks.length === 0 ? (<p className="text-sm text-muted-foreground">Nenhuma pendência</p>) : (
                  <ul className="space-y-2">
                    {tasks.slice(0, 3).map((t) => (<li key={t.id} className="flex items-center gap-2 text-sm"><Badge variant="outline" className="text-[10px] shrink-0">{formatDate(t.dueDate)}</Badge><span className="truncate">{t.title}</span></li>))}
                    {tasks.length > 3 && <p className="text-xs text-muted-foreground">+{tasks.length - 3} mais</p>}
                  </ul>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">Ver todas <ChevronRight className="h-3 w-3" /></div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portal/documentos">
            <Card className="group hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">Documentos</CardTitle><FileText className="h-5 w-5 text-blue-500" /></div></CardHeader>
              <CardContent>
                {docRequests.length === 0 ? (<p className="text-sm text-muted-foreground">Nenhuma solicitação pendente</p>) : (
                  <ul className="space-y-2">
                    {docRequests.slice(0, 3).map((d) => (<li key={d.id} className="flex items-center gap-2 text-sm"><AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" /><span className="truncate">{d.title}</span>{d.dueDate && <Badge variant="outline" className="text-[10px] ml-auto shrink-0">{formatDate(d.dueDate)}</Badge>}</li>))}
                    {docRequests.length > 3 && <p className="text-xs text-muted-foreground">+{docRequests.length - 3} mais</p>}
                  </ul>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">Ver documentos <ChevronRight className="h-3 w-3" /></div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portal/cronograma">
            <Card className="group hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">Cronograma</CardTitle><CalendarDays className="h-5 w-5 text-purple-500" /></div></CardHeader>
              <CardContent>
                {deadlines.length === 0 ? (<p className="text-sm text-muted-foreground">Nenhum prazo próximo</p>) : (
                  <ul className="space-y-2">
                    {deadlines.map((d, i) => (<li key={i} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" /><span className="truncate">{d.title}</span></li>))}
                  </ul>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">Ver cronograma <ChevronRight className="h-3 w-3" /></div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  )
}
