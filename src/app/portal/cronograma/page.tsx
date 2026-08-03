'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2, Users, PartyPopper, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PageTour, TourRestartButton, usePageTour, type TourStep } from '@/components/page-tour'

const CRONOGRAMA_TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="pcr-header"]', title: 'Cronograma', description: 'Prazos e eventos relevantes vindos do seu escritório de contabilidade.' },
  { selector: '[data-tour="pcr-nav"]', title: 'Navegar', description: 'Mude de mês ou volte para "Hoje" a qualquer momento.' },
  { selector: '[data-tour="pcr-calendar"]', title: 'Calendário', description: 'Clique em qualquer evento para ver mais detalhes.' },
]

type CalEvent = { id: string; title: string; description?: string | null; startDate: string; endDate?: string | null; allDay?: boolean; color?: string | null; type: string; clientName?: string }

const TYPE_COLORS: Record<string, string> = { task: '#f97316', deadline: '#ef4444', meeting: '#8b5cf6', holiday: '#22c55e' }
const TYPE_LABELS: Record<string, string> = { task: 'Tarefa', deadline: 'Prazo', meeting: 'Reunião', holiday: 'Feriado' }
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

export default function PortalCronogramaPage() {
  const { active: tourActive, start: startTour, finish: finishTour } = usePageTour('portal-cronograma')
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const start = new Date(year, month - 1, 15).toISOString()
      const end = new Date(year, month + 1, 15).toISOString()
      const res = await fetch(`/api/v1/portal/calendar?start=${start}&end=${end}`)
      if (res.ok) { const d = await res.json(); setEvents((d.events || []).filter((e: CalEvent) => e.type !== 'meeting')) }
    } catch {} finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  function navigate(dir: number) { const d = new Date(currentDate); d.setMonth(d.getMonth() + dir); setCurrentDate(d) }
  function goToday() { setCurrentDate(new Date()) }

  function renderMonth() {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()
    const days: Date[] = []
    for (let i = startPad - 1; i >= 0; i--) days.push(new Date(year, month, -i))
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) days.push(new Date(year, month + 1, i))

    return (
      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-7 border-b">{DAYS_PT.map((d) => (<div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0">{d}</div>))}</div>
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === month
            const isToday = isSameDay(day, new Date())
            const dayEvents = events.filter((e) => isSameDay(new Date(e.startDate), day))
            return (
              <div key={idx} className={`min-h-[80px] border-b border-r p-1 text-sm ${!isCurrentMonth ? 'bg-muted/20' : ''}`}>
                <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>{day.getDate()}</div>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const color = ev.color || TYPE_COLORS[ev.type] || '#6b7280'
                    return (<button key={ev.id} className="w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white" style={{ backgroundColor: color }} onClick={() => setSelectedEvent(ev)}>{ev.title}</button>)
                  })}
                  {dayEvents.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 2}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageTour steps={CRONOGRAMA_TOUR_STEPS} active={tourActive} onFinish={finishTour} />
      <div className="flex items-center gap-2" data-tour="pcr-header">
        <div><h1 className="text-2xl font-bold tracking-tight">Cronograma</h1><p className="text-sm text-muted-foreground">Prazos e eventos relevantes</p></div>
        <TourRestartButton onClick={startTour} />
      </div>
      <div className="flex items-center gap-2" data-tour="pcr-nav">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
        <h2 className="text-lg font-semibold">{MONTHS_PT[month]} {year}</h2>
      </div>
      <div data-tour="pcr-calendar">
        {loading ? (<div className="space-y-3"><Skeleton className="h-10 w-full" />{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-20 w-full" />))}</div>) : renderMonth()}
      </div>
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}><DialogContent className="sm:max-w-md">{selectedEvent && (<>
        <DialogHeader><DialogTitle>{selectedEvent.title}</DialogTitle><DialogDescription>{TYPE_LABELS[selectedEvent.type] || selectedEvent.type}</DialogDescription></DialogHeader>
        <div className="space-y-2">
          {selectedEvent.description && <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>}
          <p className="text-sm">{new Date(selectedEvent.startDate).toLocaleDateString('pt-BR')}</p>
        </div>
      </>)}</DialogContent></Dialog>
    </div>
  )
}