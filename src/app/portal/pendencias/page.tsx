'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Clock, CheckCircle2, Upload, MessageSquare, Loader2,
  Send, AlertTriangle, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { PageTour, TourRestartButton, usePageTour, type TourStep } from '@/components/page-tour'

const PENDENCIAS_TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="pend-header"]', title: 'Pendências', description: 'Tarefas que precisam da sua atenção — enviadas pelo seu escritório de contabilidade.' },
  { selector: '[data-tour="pend-list"]', title: 'Suas tarefas', description: 'Clique em qualquer item para ver instruções detalhadas e o prazo.' },
]

type PortalTask = {
  id: string; title: string; description: string | null; status: string
  dueDate: string | null; portalInstructions: string | null;
  clientName: string; priority: string;
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

const PRIORITY_LABELS: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }

export default function PendenciasPage() {
  const { active: tourActive, start: startTour, finish: finishTour } = usePageTour('portal-pendencias')
  const [tasks, setTasks] = useState<PortalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<PortalTask | null>(null)
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [commenting, setCommenting] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/portal/tasks')
      if (res.ok) { const d = await res.json(); setTasks(Array.isArray(d) ? d : []) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function handleMarkDone(taskId: string) {
    try {
      const res = await fetch(`/api/v1/portal/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'concluído' }) })
      if (res.ok) { toast.success('Ação marcada como concluída!'); fetchTasks(); setSelectedTask(null) }
      else { const err = await res.json().catch(() => ({})); toast.error(err.error || 'Erro ao atualizar') }
    } catch { toast.error('Erro ao atualizar') }
  }

  async function handleComment() {
    if (!selectedTask || !comment.trim()) return
    setCommenting(true)
    try {
      const res = await fetch(`/api/v1/portal/tasks/${selectedTask.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment }),
      })
      if (res.ok) { toast.success('Comentário adicionado!'); setComment('') }
      else toast.error('Erro ao comentar')
    } catch { toast.error('Erro ao comentar') } finally { setCommenting(false) }
  }

  async function handleUpload(taskId: string) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.png'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file || !selectedTask) return
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('name', file.name)
        fd.append('taskId', taskId)
        const res = await fetch('/api/v1/portal/documents', { method: 'POST', body: fd })
        if (res.ok) toast.success('Documento enviado!')
        else toast.error('Erro ao enviar')
      } catch { toast.error('Erro ao enviar') } finally { setUploading(false) }
    }
    input.click()
  }

  const pending = tasks.filter((t) => t.status !== 'concluida')
  const done = tasks.filter((t) => t.status === 'concluida')

  return (
    <div className="space-y-6">
      <PageTour steps={PENDENCIAS_TOUR_STEPS} active={tourActive} onFinish={finishTour} />
      <div className="flex items-center gap-2" data-tour="pend-header">
        <div><h1 className="text-2xl font-bold tracking-tight">Pendências</h1><p className="text-sm text-muted-foreground">Ações que precisam da sua atenção</p></div>
        <TourRestartButton onClick={startTour} />
      </div>

      <div data-tour="pend-list">
      {loading ? (<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-20 w-full" />))}</div>) : pending.length === 0 && done.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center"><CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-4" /><h3 className="text-sm font-medium">Nenhuma pendência</h3><p className="text-sm text-muted-foreground mt-1">Tudo em dia!</p></div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (<div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Pendentes ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map((t) => (
                <Card key={t.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedTask(t)}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50"><Clock className="h-5 w-5 text-amber-500" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{t.title}</p><p className="text-xs text-muted-foreground mt-0.5">{t.portalInstructions || t.description || 'Clique para ver detalhes'}</p></div>
                    <div className="flex items-center gap-2 shrink-0"><Badge variant={t.priority === 'urgent' ? 'destructive' : 'outline'} className="text-[10px]">{PRIORITY_LABELS[t.priority] || t.priority}</Badge><Badge variant="outline" className="text-[10px]">{formatDate(t.dueDate)}</Badge></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>)}

          {done.length > 0 && (<div><h2 className="text-sm font-semibold text-muted-foreground mb-3">Concluídas ({done.length})</h2><div className="space-y-3">{done.map((t) => (
            <Card key={t.id} className="opacity-60"><CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate line-through">{t.title}</p></div>
              <Badge variant="secondary" className="text-[10px]">Concluída</Badge>
            </CardContent></Card>
          ))}</div></div>)}
        </div>
      )}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}><DialogContent className="sm:max-w-lg">{selectedTask && (<>
        <DialogHeader><DialogTitle>{selectedTask.title}</DialogTitle><DialogDescription>Prazo: {formatDate(selectedTask.dueDate)}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          {selectedTask.portalInstructions && (<div className="rounded-lg bg-muted p-4"><p className="text-sm font-medium mb-1">Instruções</p><p className="text-sm text-muted-foreground">{selectedTask.portalInstructions}</p></div>)}
          {selectedTask.description && <p className="text-sm text-muted-foreground">{selectedTask.description}</p>}
          <div className="flex gap-2"><Button size="sm" onClick={() => handleUpload(selectedTask.id)} disabled={uploading}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Enviar Documento</Button>
            <Button size="sm" variant="outline" onClick={() => handleMarkDone(selectedTask.id)}><CheckCircle2 className="mr-2 h-4 w-4" /> Marcar como Feito</Button>
          </div>
          <Separator />
          <div className="space-y-2"><Label>Comentário</Label><div className="flex gap-2"><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Adicione um comentário..." rows={2} className="flex-1" /><Button size="sm" onClick={handleComment} disabled={commenting || !comment.trim()}>{commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button></div></div>
        </div>
      </>)}</DialogContent></Dialog>
    </div>
  )
}
