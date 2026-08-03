'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Upload, Download, CheckCircle2, XCircle,
  Clock, Loader2, Eye, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { PageTour, TourRestartButton, usePageTour, type TourStep } from '@/components/page-tour'

const PORTAL_DOC_TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="pdoc-header"]', title: 'Documentos', description: 'Envie documentos ao seu escritório de contabilidade ou acompanhe os que já enviou.' },
  { selector: '[data-tour="pdoc-upload"]', title: 'Enviar um documento', description: 'Use este botão para enviar qualquer arquivo, mesmo sem uma solicitação prévia.' },
  { selector: '[data-tour="pdoc-tabs"]', title: 'Documentos e Solicitações', description: '"Meus Documentos" mostra o que você já enviou; "Solicitações" mostra o que o escritório está pedindo.' },
  { selector: '[data-tour="pdoc-content"]', title: 'Lista', description: 'Acompanhe a situação de cada documento ou envie o que foi solicitado.' },
]

type PortalDoc = { id: string; name: string; status: string; updatedAt: string; documentType?: { name: string } }
type PortalDocReq = { id: string; title: string; status: string; dueDate: string | null; acceptedFormats: string }

function formatDate(d?: string | null) { if (!d) return '—'; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}` }

const statusMap: Record<string, { label: string; color: string }> = {
  aprovado: { label: 'Aprovado', color: 'text-green-700 bg-green-50 border-green-200' },
  'em_análise': { label: 'Em Análise', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  rejeitado: { label: 'Rejeitado', color: 'text-red-600 bg-red-50 border-red-200' },
  recebido: { label: 'Recebido', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  solicitado: { label: 'Solicitado', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  pending: { label: 'Pendente', color: 'text-gray-600 bg-gray-50 border-gray-200' },
}

export default function PortalDocumentosPage() {
  const { active: tourActive, start: startTour, finish: finishTour } = usePageTour('portal-documentos')
  const [docs, setDocs] = useState<PortalDoc[]>([])
  const [requests, setRequests] = useState<PortalDocReq[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('documentos')

  const fetchData = useCallback(async () => {
    try {
      const [docRes, reqRes] = await Promise.all([
        fetch('/api/v1/portal/documents'),
        fetch('/api/v1/portal/document-requests'),
      ])
      if (docRes.ok) { const d = await docRes.json(); setDocs(Array.isArray(d.documents) ? d.documents : (Array.isArray(d) ? d : [])) }
      if (reqRes.ok) { const d = await reqRes.json(); setRequests(Array.isArray(d.requests) ? d.requests : (Array.isArray(d) ? d : [])) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleUpload(req?: PortalDocReq) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = req?.acceptedFormats || '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.png'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('name', file.name)
        if (req?.id) fd.append('requestId', req.id)
        const res = await fetch('/api/v1/portal/documents', { method: 'POST', body: fd })
        if (res.ok) { toast.success('Documento enviado!'); fetchData() }
        else toast.error('Erro ao enviar')
      } catch { toast.error('Erro ao enviar') }
    }
    input.click()
  }

  return (
    <div className="space-y-6">
      <PageTour steps={PORTAL_DOC_TOUR_STEPS} active={tourActive} onFinish={finishTour} />
      <div className="flex items-center justify-between" data-tour="pdoc-header">
        <div className="flex items-center gap-2">
          <div><h1 className="text-2xl font-bold tracking-tight">Documentos</h1><p className="text-sm text-muted-foreground">Gerencie seus documentos</p></div>
          <TourRestartButton onClick={startTour} />
        </div>
        <Button size="sm" onClick={() => handleUpload()} data-tour="pdoc-upload"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
      </div>

      <div className="flex gap-2 rounded-lg border bg-white p-1 w-fit" data-tour="pdoc-tabs">
        <Button variant={tab === 'documentos' ? 'secondary' : 'ghost'} size="sm" className="text-xs" onClick={() => setTab('documentos')}>Meus Documentos</Button>
        <Button variant={tab === 'solicitacoes' ? 'secondary' : 'ghost'} size="sm" className="text-xs" onClick={() => setTab('solicitacoes')}>Solicitações</Button>
      </div>

      <div data-tour="pdoc-content">
      {loading ? (<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-16 w-full" />))}</div>) : tab === 'documentos' ? (
        <div className="rounded-lg border bg-white">{docs.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 text-center"><FileText className="h-12 w-12 text-muted-foreground/40 mb-4" /><h3 className="text-sm font-medium">Nenhum documento</h3></div>) : (
          <Table><TableHeader><TableRow><TableHead>Documento</TableHead><TableHead>Tipo</TableHead><TableHead>Situação</TableHead><TableHead>Atualização</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader><TableBody>
            {docs.map((d) => { const st = statusMap[d.status] || statusMap.pending; return (<TableRow key={d.id}><TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{d.name}</span></div></TableCell><TableCell className="text-sm text-muted-foreground">{d.documentType?.name || '—'}</TableCell><TableCell><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span></TableCell><TableCell className="text-sm text-muted-foreground">{formatDate(d.updatedAt)}</TableCell><TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info('Download disponível em breve.')}><Download className="h-3.5 w-3.5" /></Button></TableCell></TableRow>)})}
          </TableBody></Table>
        )}</div>
      ) : (
        <div className="rounded-lg border bg-white">{requests.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 text-center"><AlertTriangle className="h-12 w-12 text-muted-foreground/40 mb-4" /><h3 className="text-sm font-medium">Nenhuma solicitação</h3></div>) : (
          <Table><TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Situação</TableHead><TableHead>Prazo</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader><TableBody>
            {requests.map((r) => { const st = statusMap[r.status] || statusMap.solicitado; return (<TableRow key={r.id}><TableCell className="font-medium text-sm">{r.title}</TableCell><TableCell><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span></TableCell><TableCell className="text-sm text-muted-foreground">{formatDate(r.dueDate)}</TableCell><TableCell>{r.status === 'solicitado' && <Button size="sm" variant="outline" onClick={() => handleUpload(r)}><Upload className="mr-1.5 h-3 w-3" /> Enviar</Button>}</TableCell></TableRow>)})}
          </TableBody></Table>
        )}</div>
      )}
      </div>
    </div>
  )
}
