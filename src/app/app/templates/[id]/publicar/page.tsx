'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ListChecks,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────
interface Stage {
  id: string
  name: string
  tasks: Array<{ id: string; title: string; department?: string }>
}
interface TemplateData {
  id: string
  name: string
  category: string | null
  color: string
  status: string
  currentVersion: number
  stages: Stage[]
}

// ── Helpers ────────────────────────────────────────────────
function getSession() {
  try { return JSON.parse(localStorage.getItem('cr_session') || '') } catch { return null }
}

function parseStages(raw: unknown): Stage[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as Stage[]
  try { return JSON.parse(raw as string) } catch { return [] }
}

// ── Page ───────────────────────────────────────────────────
export default function PublicarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const session = getSession()

  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [published, setPublished] = useState(false)
  const [newVersion, setNewVersion] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const r = await fetch(`/api/templates/${id}`)
        if (r.ok) {
          const d: TemplateData = await r.json()
          if (!cancelled) setTemplate({ ...d, stages: parseStages(d.stages) })
        } else {
          toast.error('Template não encontrado')
          router.push('/app/templates')
        }
      } catch {
        toast.error('Erro ao carregar template')
      }
      if (!cancelled) setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [id, router])

  async function handlePublish() {
    if (!template) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/templates/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishedBy: session?.userId || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setNewVersion(data.version?.versionNumber || template.currentVersion + 1)
        setPublished(true)
        toast.success(`Template publicado como v${data.version?.versionNumber || template.currentVersion + 1}!`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao publicar')
      }
    } catch {
      toast.error('Erro de conexão')
    }
    setPublishing(false)
  }

  // Computed
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!template) return null

  const stagesCount = template.stages.length
  const tasksCount = template.stages.reduce((acc, s) => acc + (s.tasks?.length || 0), 0)
  const nextVersion = template.currentVersion + 1

  // Validation warnings
  const warnings: string[] = []
  const errors: string[] = []

  if (stagesCount === 0) errors.push('Template não possui nenhuma etapa')
  if (tasksCount === 0) errors.push('Template não possui nenhuma tarefa')

  template.stages.forEach(stage => {
    if (!stage.name?.trim()) errors.push('Uma etapa não possui nome')
    ;(stage.tasks || []).forEach(task => {
      if (!task.title?.trim()) errors.push(`Tarefa sem título na etapa "${stage.name || 'Sem nome'}"`)
      if (!task.department) warnings.push(`Tarefa "${task.title || 'Sem título'}" sem departamento atribuído`)
    })
  })

  const canPublish = errors.length === 0

  // Published success state
  if (published) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app/templates')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Publicação Concluída</h1>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex flex-col items-center py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-green-800">Template Publicado!</h2>
            <p className="mt-1 text-sm text-green-700">
              <strong>{template.name}</strong> foi publicado como <strong>v{newVersion}</strong>
            </p>
            <p className="mt-2 text-sm text-green-600">
              {stagesCount} etapa{stagesCount !== 1 ? 's' : ''} · {tasksCount} tarefa{tasksCount !== 1 ? 's' : ''}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => router.push('/app/templates')}>
                Voltar para Templates
              </Button>
              <Button asChild>
                <Link href={`/app/templates/${id}`}>Visualizar Template</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/app/templates/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Publicar Template</h1>
          <p className="text-sm text-muted-foreground">
            Revise e confirme a publicação
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: template.color }} />
            <CardTitle>{template.name}</CardTitle>
            <Badge variant="secondary">v{nextVersion}</Badge>
            {template.category && <Badge variant="outline">{template.category}</Badge>}
          </div>
          <CardDescription>
            Versão atual: v{template.currentVersion || 0} → v{nextVersion}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stagesCount}</p>
              <p className="text-xs text-muted-foreground">Etapa{stagesCount !== 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasksCount}</p>
              <p className="text-xs text-muted-foreground">Tarefa{tasksCount !== 1 ? 's' : ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estrutura do Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.stages.map((stage, idx) => (
            <div key={stage.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {idx + 1}
                </span>
                <p className="text-sm font-medium">{stage.name || 'Sem nome'}</p>
                <Badge variant="outline" className="text-[10px]">
                  {(stage.tasks || []).length} tarefa{(stage.tasks || []).length !== 1 ? 's' : ''}
                </Badge>
              </div>
              {(stage.tasks || []).length > 0 && (
                <div className="ml-8 space-y-1">
                  {(stage.tasks || []).map((task) => (
                    <p key={task.id} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      {task.title || 'Sem título'}
                    </p>
                  ))}
                </div>
              )}
              {idx < template.stages.length - 1 && <Separator className="mt-2" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Erros encontrados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {errors.map((e, i) => (
              <p key={i} className="text-sm text-red-700">• {e}</p>
            ))}
            <p className="text-sm text-red-600 font-medium mt-2">
              Corrija os erros antes de publicar.
            </p>
          </CardContent>
        </Card>
      )}

      {warnings.length > 0 && errors.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Avisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-700">• {w}</p>
            ))}
            <p className="text-sm text-amber-600 mt-2">
              Você pode publicar mesmo assim, mas revise os avisos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 pb-6">
        <Button variant="outline" onClick={() => router.push(`/app/templates/${id}`)}>
          Voltar ao Template
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={`/app/templates/${id}?tab=editor`}>
              <Eye className="mr-2 h-4 w-4" />Revisar no Editor
            </Link>
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={!canPublish}>
            <Send className="mr-2 h-4 w-4" />
            Publicar v{nextVersion}
          </Button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Publicação</DialogTitle>
            <DialogDescription>
              Você está prestes a publicar a versão <strong>v{nextVersion}</strong> do template &quot;{template.name}&quot;.
              {warnings.length > 0 && ` Existem ${warnings.length} aviso(s) que devem ser revisados.`}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Template</span>
              <span className="font-medium">{template.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Versão</span>
              <span className="font-medium">v{nextVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Etapas</span>
              <span className="font-medium">{stagesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tarefas</span>
              <span className="font-medium">{tasksCount}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Confirmar Publicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
