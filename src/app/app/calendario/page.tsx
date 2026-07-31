'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2,
  Users, PartyPopper, Filter, Loader2, X, Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

type CalEvent = {
  id: string; title: string; description?: string | null
  startDate: string; endDate?: string | null; allDay?: boolean
  color?: string | null; type: string; relatedId?: string | null
  clientName?: string; status?: string; priority?: string
}

const TYPE_COLORS: Record<string, string> = { task: '#f97316', deadline: '#ef4444', meeting: '#8b5cf6', holiday: '#22c55e' }
const TYPE_LABELS: Record<string, string> = { task: 'Tarefa', deadline: 'Prazo', meeting: 'Reunião', holiday: 'Feriado' }
const TYPE_ICONS: Record<string, React.ElementType> = { task: Clock, deadline: CheckCircle2, meeting: Users, holiday: PartyPopper }
const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
type View = 'month' | 'week' | 'day' | 'agenda'

function fmt(d: Date) { return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` }
function timeStr(d: string) { const dt = new Date(d); return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

export default function CalendarioPage() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterType, setFilterType] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const start = new Date(year, month - 1, 15).toISOString()
      const end = new Date(year, month + 1, 15).toISOString()
      const params = new URLSearchParams({ start, end })
      if (filterType !== 'all') params.set('type', filterType)
      const res = await fetch(`/api/calendar?${params}`)
      if (res.ok) { const data = await res.json(); setEvents(data.events || []) }
    } catch { toast.error('Erro ao carregar eventos') } finally { setLoading(false) }
  }, [year, month, filterType])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  function navigate(dir: number) {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setCurrentDate(d)
  }

  function goToday() { setCurrentDate(new Date()) }

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events
    return events.filter((e) => e.type === filterType)
  }, [events, filterType])

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
        <div className="grid grid-cols-7 border-b">
          {DAYS_PT.map((d) => (<div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0">{d}</div>))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === month
            const isToday = isSameDay(day, new Date())
            const dayEvents = filteredEvents.filter((e) => isSameDay(new Date(e.startDate), day))
            return (
              <div key={idx} className={`min-h-[100px] border-b border-r p-1 text-sm transition-colors hover:bg-muted/30 ${!isCurrentMonth ? 'bg-muted/20' : ''}`}>
                <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>{day.getDate()}</div>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const color = ev.color || TYPE_COLORS[ev.type] || '#6b7280'
                    return (<button key={ev.id} className="w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white" style={{ backgroundColor: color }} onClick={() => setSelectedEvent(ev)}>{ev.title}</button>)
                  })}
                  {dayEvents.length > 3 && <p className="px-1.5 text-[10px] text-muted-foreground">+{dayEvents.length - 3} mais</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderWeek() {
    const start = new Date(currentDate); start.setDate(start.getDate() - start.getDay())
    const hours = Array.from({ length: 16 }, (_, i) => i + 7)
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d })

    return (
      <div className="rounded-lg border bg-white overflow-x-auto">
        <div className="grid grid-cols-8 border-b min-w-[700px]">
          <div className="py-2 px-2 text-xs font-semibold text-muted-foreground border-r">Hora</div>
          {days.map((d, i) => (
            <div key={i} className={`py-2 px-2 text-center border-r last:border-r-0 ${isSameDay(d, new Date()) ? 'bg-primary/5' : ''}`}>
              <p className="text-[10px] text-muted-foreground uppercase">{DAYS_PT[d.getDay()]}</p>
              <p className={`text-sm font-semibold ${isSameDay(d, new Date()) ? 'text-primary' : ''}`}>{d.getDate()}</p>
            </div>
          ))}
        </div>
        {hours.map((h) => (
          <div key={h} className="grid grid-cols-8 border-b last:border-b-0 min-w-[700px]">
            <div className="py-3 px-2 text-xs text-muted-foreground border-r text-right pr-3">{String(h).padStart(2, '0')}:00</div>
            {days.map((d, di) => {
              const evts = filteredEvents.filter((e) => { const ed = new Date(e.startDate); return isSameDay(ed, d) && ed.getHours() === h })
              return (<div key={di} className="py-1 px-1 border-r last:border-r-0 min-h-[48px]">
                {evts.map((ev) => { const color = ev.color || TYPE_COLORS[ev.type] || '#6b7280'; return (<button key={ev.id} className="w-full rounded px-1.5 py-0.5 text-left text-[10px] font-medium text-white mb-0.5" style={{ backgroundColor: color }} onClick={() => setSelectedEvent(ev)}>{ev.title}</button>) })}
              </div>)
            })}
          </div>
        ))}
      </div>
    )
  }

  function renderDay() {
    const hours = Array.from({ length: 16 }, (_, i) => i + 7)
    const dayEvts = filteredEvents.filter((e) => isSameDay(new Date(e.startDate), currentDate))
    return (
      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3"><p className="text-lg font-semibold">{DAYS_PT[currentDate.getDay()]}, {currentDate.getDate()} de {MONTHS_PT[currentDate.getMonth()]}</p></div>
        <div className="divide-y">
          {hours.map((h) => {
            const evts = dayEvts.filter((e) => new Date(e.startDate).getHours() === h)
            return (<div key={h} className="flex min-h-[60px]">
              <div className="w-20 shrink-0 py-3 pr-4 text-right text-xs text-muted-foreground">{String(h).padStart(2, '0')}:00</div>
              <div className="flex-1 border-l py-2 px-3">
                {evts.map((ev) => { const color = ev.color || TYPE_COLORS[ev.type] || '#6b7280'; return (
                  <button key={ev.id} className="mb-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-white" style={{ backgroundColor: color }} onClick={() => setSelectedEvent(ev)}>
                    <div className="flex items-center gap-2"><span className="text-xs opacity-80">{timeStr(ev.startDate)}</span>{ev.title}</div>
                    {ev.clientName && <p className="text-xs opacity-80 mt-0.5">{ev.clientName}</p>}
                  </button>)})}
              </div>
            </div>)
          })}
        </div>
      </div>
    )
  }

  function renderAgenda() {
    const sorted = [...filteredEvents].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    let currentDay = ''
    return (
      <div className="rounded-lg border bg-white">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">Nenhum evento encontrado</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            {sorted.map((ev) => {
              const evDate = fmt(new Date(ev.startDate)); const showDay = evDate !== currentDay; currentDay = evDate
              const color = ev.color || TYPE_COLORS[ev.type] || '#6b7280'; const TypeIcon = TYPE_ICONS[ev.type] || CalendarDays
              return (<div key={ev.id}>
                {showDay && <div className="sticky top-0 z-10 border-b bg-muted/80 px-4 py-2 text-sm font-semibold text-muted-foreground backdrop-blur-sm">{evDate}</div>}
                <button className="flex w-full items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left" onClick={() => setSelectedEvent(ev)}>
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20`, color }}><TypeIcon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{!ev.allDay && <span>{timeStr(ev.startDate)} · </span>}{TYPE_LABELS[ev.type] || ev.type}{ev.clientName && <span> · {ev.clientName}</span>}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{TYPE_LABELS[ev.type] || ev.type}</Badge>
                </button>
              </div>)
            })}
          </ScrollArea>
        )}
      </div>
    )
  }

  const viewLabels: Record<View, string> = { month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Agenda' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Calendário</h1><p className="text-sm text-muted-foreground">Visualize prazos, tarefas e eventos da organização</p></div>
        <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
          {(Object.keys(viewLabels) as View[]).map((v) => (<Button key={v} variant={view === v ? 'secondary' : 'ghost'} size="sm" className="text-xs" onClick={() => setView(v)}>{viewLabels[v]}</Button>))}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold">{view === 'day' ? `${DAYS_PT[currentDate.getDay()]}, ${currentDate.getDate()} de ${MONTHS_PT[month]}` : `${MONTHS_PT[month]} ${year}`}</h2>
        </div>
        <Button variant={showFilters ? 'secondary' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)}><Filter className="mr-2 h-4 w-4" /> Filtros</Button>
      </div>
      {showFilters && (
        <Card><CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="min-w-[160px]">
            <p className="text-xs text-muted-foreground mb-1">Tipo</p>
            <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{Object.entries(TYPE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFilterType('all')}><X className="mr-1 h-3 w-3" /> Limpar</Button>
        </CardContent></Card>
      )}
      {loading ? (<div className="space-y-3"><Skeleton className="h-10 w-full" />{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full" />))}</div>) : (<>{view === 'month' && renderMonth()}{view === 'week' && renderWeek()}{view === 'day' && renderDay()}{view === 'agenda' && renderAgenda()}</>)}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">{selectedEvent && (<>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedEvent.color || TYPE_COLORS[selectedEvent.type] || '#6b7280' }} />{selectedEvent.title}</DialogTitle><DialogDescription>{TYPE_LABELS[selectedEvent.type] || selectedEvent.type}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {selectedEvent.description && <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>}
            <div className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-muted-foreground" />{fmt(new Date(selectedEvent.startDate))}{!selectedEvent.allDay && <span>· {timeStr(selectedEvent.startDate)}</span>}</div>
            {selectedEvent.clientName && <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" />{selectedEvent.clientName}</div>}
            {selectedEvent.status && <Badge variant="outline">{selectedEvent.status}</Badge>}
          </div>
        </>)}</DialogContent>
      </Dialog>
    </div>
  )
}
