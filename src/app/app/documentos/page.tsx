'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Upload, Search, Filter, Download, FileText, MoreHorizontal,
  Eye, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, Archive,
  Loader2, X, ChevronDown, Send, FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

function formatDate(d?: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

const statusMap: Record<string, { label: string; color: string }> = {
  solicitado: { label: 'Solicitado', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  recebido: { label: 'Recebido', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'em_análise': { label: 'Em Análise', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  aprovado: { label: 'Aprovado', color: 'text-green-700 bg-green-50 border-green-200' },
  rejeitado: { label: 'Rejeitado', color: 'text-red-600 bg-red-50 border-red-200' },
  arquivado: { label: 'Arquivado', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  pending: { label: 'Pendente', color: 'text-amber-600 bg-amber-50 border-amber-200' },
}

const statusIcon: Record<string, React.ElementType> = {
  solicitado: Clock, recebido: FileText, 'em_análise': AlertCircle,
  aprovado: CheckCircle2, rejeitado: XCircle, arquivado: Archive, pending: Clock,
}

type Document = { id: string; name: string; clientId: string; status: string; validityDate: string | null; updatedAt: string; client?: { id: string; name: string }; documentType?: { id: string; name: string } }
type Client = { id: string; name: string }
type DocType = { id: string; name: string }

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', clientId: '', typeId: '', file: null as File | null, notes: '' })

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterClient !== 'all') params.set('clientId', filterClient)
      if (filterType !== 'all') params.set('typeId', filterType)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      const [docRes, clientRes, typeRes] = await Promise.all([
        fetch(`/api/documents?${params.toString()}`),
        fetch('/api/clients'),
        fetch('/api/clients'),
      ])
      if (docRes.ok) { const d = await docRes.json(); setDocuments(Array.isArray(d) ? d : []) }
      if (clientRes.ok) { const d = await clientRes.json(); setClients(Array.isArray(d) ? d : []) }
      if (typeRes.ok) { const d = await typeRes.json(); setDocTypes(Array.isArray(d) ? d : []) }
    } catch { toast.error('Erro ao carregar documentos') } finally { setLoading(false) }
  }, [filterClient, filterType, filterStatus])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = documents.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || d.client?.name.toLowerCase().includes(q) || d.documentType?.name.toLowerCase().includes(q)
  })

  async function handleUpload() {
    if (!uploadForm.name || !uploadForm.clientId) { toast.error('Nome e cliente são obrigatórios'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file || new Blob())
      formData.append('name', uploadForm.name)
      formData.append('clientId', uploadForm.clientId)
      formData.append('typeId', uploadForm.typeId)
      formData.append('notes', uploadForm.notes)
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      if (res.ok) {
        toast.success('Documento enviado com sucesso!')
        setUploadOpen(false)
        setUploadForm({ name: '', clientId: '', typeId: '', file: null, notes: '' })
        fetchData()
      } else { const err = await res.json(); toast.error(err.error || 'Erro ao enviar') }
    } catch { toast.error('Erro ao enviar documento') } finally { setUploading(false) }
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'documents', format: 'csv', filters: { clientId: filterClient, typeId: filterType, status: filterStatus } }),
      })
      if (res.ok) toast.success('Exportação iniciada. Você será notificado quando estiver pronta.')
    } catch { toast.error('Erro ao iniciar exportação') }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie todos os documentos da organização</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exportar</Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/documentos/solicitar"><Send className="mr-2 h-4 w-4" /> Solicitar Documento</Link>
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar documentos..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant={showFilters ? 'secondary' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-2 h-4 w-4" /> Filtros <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-4">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Cliente</Label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {docTypes.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Situação</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusMap).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFilterClient('all'); setFilterType('all'); setFilterStatus('all') }}>
              <X className="mr-1 h-3 w-3" /> Limpar
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border bg-white">
        {loading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium">Nenhum documento encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || filterClient !== 'all' || filterType !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Faça upload ou solicite um documento para começar.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Documento</TableHead>
                  <TableHead className="min-w-[150px]">Cliente</TableHead>
                  <TableHead className="min-w-[130px]">Categoria</TableHead>
                  <TableHead className="min-w-[110px]">Validade</TableHead>
                  <TableHead className="min-w-[130px]">Situação</TableHead>
                  <TableHead className="min-w-[110px]">Atualização</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => {
                  const st = statusMap[doc.status] || statusMap.pending
                  const Icon = statusIcon[doc.status] || Clock
                  return (
                    <TableRow key={doc.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-sm truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.client?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{doc.documentType?.name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.validityDate)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${st.color}`}>
                          <Icon className="h-3 w-3" /> {st.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.updatedAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Visualizar</DropdownMenuItem>
                            <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Baixar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
            <DialogDescription>Envie um novo documento para a organização.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome do documento *</Label>
              <Input value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} placeholder="Ex: Contrato Social" />
            </div>
            <div className="grid gap-2">
              <Label>Cliente *</Label>
              <Select value={uploadForm.clientId} onValueChange={(v) => setUploadForm({ ...uploadForm, clientId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tipo de documento</Label>
              <Select value={uploadForm.typeId} onValueChange={(v) => setUploadForm({ ...uploadForm, typeId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>{docTypes.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Arquivo</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} />
              <p className="text-xs text-muted-foreground">Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={uploadForm.notes} onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })} placeholder="Observações opcionais..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading}>{uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
