'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, BellOff, Check, CheckCheck, Clock, AlertTriangle,
  FileText, Users, CreditCard, CalendarDays, Info, Loader2,
  Filter, X, MessageSquare, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

type Notification = {
  id: string; title: string; message: string; type: string
  priority: string; link: string | null; read: boolean; readAt: string | null; createdAt: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: Info, success: Check, warning: AlertTriangle, error: X,
  task_assigned: CalendarDays, task_due_soon: Clock,
  document_requested: FileText, document_approved: Check,
  team_invite: Users, payment: CreditCard, mention: MessageSquare,
}

const TYPE_COLORS: Record<string, string> = {
  info: 'text-blue-500', success: 'text-green-500', warning: 'text-amber-500', error: 'text-red-500',
  task_assigned: 'text-purple-500', task_due_soon: 'text-orange-500',
  document_requested: 'text-cyan-500', document_approved: 'text-green-500',
  team_invite: 'text-indigo-500', payment: 'text-emerald-500', mention: 'text-pink-500',
}

const TYPE_LABELS: Record<string, string> = {
  all: 'Todas', info: 'Info', success: 'Sucesso', warning: 'Aviso', error: 'Erro',
  task_assigned: 'Tarefa', task_due_soon: 'Prazo', document_requested: 'Documento',
  document_approved: 'Documento', team_invite: 'Equipe', payment: 'Pagamento', mention: 'Menção',
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'agora mesmo'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d atrás`
  return `${Math.floor(days / 7)} semanas atrás`
}

export default function NotificacoesPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')

  const fetchNotifs = useCallback(async () => {
    try {
      const session = JSON.parse(localStorage.getItem('cr_session') || '{}')
      const params = new URLSearchParams()
      params.set('userId', session.userId || '')
      if (filterType !== 'all') params.set('type', filterType)
      const res = await fetch(`/api/notifications?${params}`)
      if (res.ok) { const d = await res.json(); setNotifications(Array.isArray(d.notifications) ? d.notifications : (Array.isArray(d) ? d : [])) }
    } catch {} finally { setLoading(false) }
  }, [filterType])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }) })
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
    } catch {}
  }

  async function markAllAsRead() {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
      if (unreadIds.length === 0) return
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: unreadIds }) })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })))
      toast.success('Todas as notificações marcadas como lidas')
    } catch {}
  }

  function handleClick(n: Notification) {
    if (!n.read) markAsRead(n.id)
    if (n.link) router.push(n.link)
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const filtered = filterType === 'all' ? notifications : notifications.filter((n) => n.type === filterType)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas as notificações foram lidas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        {loading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>))}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium">Nenhuma notificação</h3>
            <p className="text-sm text-muted-foreground mt-1">{filterType !== 'all' ? 'Nenhuma notificação deste tipo.' : 'Você está em dia!'}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <div className="divide-y">
              {filtered.map((n) => {
                const Icon = TYPE_ICONS[n.type] || Bell
                const colorClass = TYPE_COLORS[n.type] || 'text-gray-500'
                return (
                  <button
                    key={n.id}
                    className={`flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/50 ${!n.read ? 'bg-primary/[0.02]' : ''}`}
                    onClick={() => handleClick(n)}
                  >
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
