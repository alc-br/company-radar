'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2, CalendarDays, FileText, Bell, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

type Client = { id: string; name: string }

const FORMATOS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'doc', label: 'DOC' },
  { value: 'docx', label: 'DOCX' },
  { value: 'xls', label: 'XLS' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'jpg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
]

export default function SolicitarDocumentoPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    instructions: '',
    clientId: '',
    dueDate: '',
    acceptedFormats: 'pdf,doc,docx,xls,xlsx,jpg,png',
    reminder1d: true,
    reminder3d: true,
    reminder7d: false,
  })

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setClients(Array.isArray(d) ? d : (d.clients || [])))
      .catch(() => {})
  }, [])

  function toggleFormat(fmt: string) {
    const current = form.acceptedFormats.split(',').map(f => f.trim()).filter(Boolean)
    const idx = current.indexOf(fmt)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(fmt)
    setForm({ ...form, acceptedFormats: current.join(',') || 'pdf' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.clientId) {
      toast.error('Título e cliente são obrigatórios')
      return
    }
    setSubmitting(true)
    try {
      const session = JSON.parse(localStorage.getItem('cr_session') || '{}')
      const res = await fetch('/api/document-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          organizationId: session.orgId,
          requestedBy: session.userId,
        }),
      })
      if (res.ok) {
        toast.success('Solicitação de documento criada com sucesso!')
        router.push('/app/documentos')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao criar solicitação')
      }
    } catch {
      toast.error('Erro ao criar solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/app/documentos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Solicitar Documento</h1>
          <p className="text-sm text-muted-foreground">Envie uma solicitação de documento para o cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Informações da Solicitação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Contrato Social atualizado" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instructions">Instruções</Label>
              <Textarea id="instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Descreva o que é necessário, observações especiais..." rows={4} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                <SelectTrigger id="client"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Prazo</Label>
              <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Formatos Aceitos</CardTitle>
            <CardDescription>Selecione os formatos de arquivo aceitos para esta solicitação.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {FORMATOS.map((fmt) => {
                const active = form.acceptedFormats.split(',').map(f => f.trim()).includes(fmt.value)
                return (
                  <Badge
                    key={fmt.value}
                    variant={active ? 'default' : 'outline'}
                    className="cursor-pointer select-none"
                    onClick={() => toggleFormat(fmt.value)}
                  >
                    {fmt.label}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Lembretes</CardTitle>
            <CardDescription>Configure lembretes automáticos para o cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>1 dia antes</Label>
                <p className="text-xs text-muted-foreground">Lembrete enviado 1 dia antes do prazo</p>
              </div>
              <Switch checked={form.reminder1d} onCheckedChange={(v) => setForm({ ...form, reminder1d: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>3 dias antes</Label>
                <p className="text-xs text-muted-foreground">Lembrete enviado 3 dias antes do prazo</p>
              </div>
              <Switch checked={form.reminder3d} onCheckedChange={(v) => setForm({ ...form, reminder3d: v })} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>7 dias antes</Label>
                <p className="text-xs text-muted-foreground">Lembrete enviado 7 dias antes do prazo</p>
              </div>
              <Switch checked={form.reminder7d} onCheckedChange={(v) => setForm({ ...form, reminder7d: v })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push('/app/documentos')}>Cancelar</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar Solicitação
          </Button>
        </div>
      </form>
    </div>
  )
}
