'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

type Pref = { eventType: string; inApp: boolean; email: boolean; dailyDigest: boolean }

const EVENT_TYPES = [
  { key: 'task_assigned', label: 'Tarefa atribuída', desc: 'Quando uma tarefa é atribuída a você' },
  { key: 'task_due_soon', label: 'Prazo próximo', desc: 'Quando o prazo de uma tarefa está próximo' },
  { key: 'task_overdue', label: 'Tarefa atrasada', desc: 'Quando o prazo de uma tarefa foi ultrapassado' },
  { key: 'task_completed', label: 'Tarefa concluída', desc: 'Quando uma tarefa é marcada como concluída' },
  { key: 'task_comment', label: 'Comentário em tarefa', desc: 'Alguém comenta em uma tarefa sua' },
  { key: 'document_requested', label: 'Documento solicitado', desc: 'Um documento é solicitado ao cliente' },
  { key: 'document_approved', label: 'Documento aprovado', desc: 'Um documento é aprovado' },
  { key: 'document_rejected', label: 'Documento rejeitado', desc: 'Um documento é rejeitado' },
  { key: 'team_invite', label: 'Convite de equipe', desc: 'Você recebe um convite para a equipe' },
  { key: 'client_created', label: 'Novo cliente', desc: 'Um novo cliente é cadastrado' },
  { key: 'payment_received', label: 'Pagamento recebido', desc: 'Um pagamento é confirmado' },
  { key: 'subscription_expiring', label: 'Assinatura expirando', desc: 'Sua assinatura está próxima do vencimento' },
]

export default function PreferenciasNotificacoesPage() {
  const router = useRouter()
  const [prefs, setPrefs] = useState<Pref[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('cr_session') || '{}')
    fetch(`/api/notifications/prefs?userId=${session.userId || ''}`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => {
        const existing = Array.isArray(d) ? d : []
        const full = EVENT_TYPES.map((et) => {
          const found = existing.find((p: Pref) => p.eventType === et.key)
          return { eventType: et.key, inApp: found?.inApp ?? true, email: found?.email ?? false, dailyDigest: found?.dailyDigest ?? false }
        })
        setPrefs(full)
      })
      .catch(() => {
        setPrefs(EVENT_TYPES.map((et) => ({ eventType: et.key, inApp: true, email: false, dailyDigest: false })))
      })
      .finally(() => setLoading(false))
  }, [])

  function toggle(eventType: string, field: 'inApp' | 'email' | 'dailyDigest') {
    setPrefs((prev) => prev.map((p) => p.eventType === eventType ? { ...p, [field]: !p[field] } : p))
  }

  async function save() {
    setSaving(true)
    try {
      const session = JSON.parse(localStorage.getItem('cr_session') || '{}')
      const res = await fetch('/api/notifications/prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId || '', prefs }),
      })
      if (res.ok) toast.success('Preferências salvas com sucesso!')
      else toast.error('Erro ao salvar preferências')
    } catch { toast.error('Erro ao salvar preferências') } finally { setSaving(false) }
  }

  function getLabel(key: string) { return EVENT_TYPES.find((e) => e.key === key)?.label || key }
  function getDesc(key: string) { return EVENT_TYPES.find((e) => e.key === key)?.desc || '' }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/app/notificacoes')}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h1 className="text-2xl font-bold tracking-tight">Preferências de Notificação</h1><p className="text-sm text-muted-foreground">Escolha como e quando deseja ser notificado</p></div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Canais de notificação</CardTitle><CardDescription>Configure os canais para cada tipo de evento.</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full" />))}</div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead className="min-w-[200px]">Evento</TableHead><TableHead className="text-center w-[100px]">In-App</TableHead><TableHead className="text-center w-[100px]">E-mail</TableHead><TableHead className="text-center w-[120px]">Resumo Diário</TableHead></TableRow></TableHeader>
              <TableBody>
                {prefs.map((p) => (
                  <TableRow key={p.eventType}>
                    <TableCell><div><p className="text-sm font-medium">{getLabel(p.eventType)}</p><p className="text-xs text-muted-foreground">{getDesc(p.eventType)}</p></div></TableCell>
                    <TableCell className="text-center"><Switch checked={p.inApp} onCheckedChange={() => toggle(p.eventType, 'inApp')} /></TableCell>
                    <TableCell className="text-center"><Switch checked={p.email} onCheckedChange={() => toggle(p.eventType, 'email')} /></TableCell>
                    <TableCell className="text-center"><Switch checked={p.dailyDigest} onCheckedChange={() => toggle(p.eventType, 'dailyDigest')} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}<Save className="mr-2 h-4 w-4" /> Salvar Preferências</Button></div>
    </div>
  )
}
