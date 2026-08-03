'use client'

import { useState, useEffect, useCallback } from 'react'
import { Megaphone, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTour, TourRestartButton, usePageTour, type TourStep } from '@/components/page-tour'

const COMUNICADOS_TOUR_STEPS: TourStep[] = [
  { selector: '[data-tour="pcm-header"]', title: 'Comunicados', description: 'Avisos e informes publicados pelo seu escritório de contabilidade aparecem aqui.' },
]

type Announcement = {
  id: string
  title: string
  body: string
  author: string
  publishedAt: string
}

function formatDate(d: string) {
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

function getPortalSession() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('cr_portal') || 'null')
  } catch {
    return null
  }
}

export default function ComunicadosPage() {
  const { active: tourActive, start: startTour, finish: finishTour } = usePageTour('portal-comunicados')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 10

  const fetchAnnouncements = useCallback(async (pageNum: number, append = false) => {
    const session = getPortalSession()
    if (!session?.clientId) return

    const isInitial = !append
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    try {
      const skip = (pageNum - 1) * PAGE_SIZE
      const res = await fetch(`/api/v1/announcements?clientId=${session.clientId}&skip=${skip}&take=${PAGE_SIZE}`)
      if (res.ok) {
        const data = await res.json()
        const items: Announcement[] = Array.isArray(data) ? data : data.items || []
        if (isInitial) {
          setAnnouncements(items)
        } else {
          setAnnouncements((prev) => [...prev, ...items])
        }
        setHasMore(items.length === PAGE_SIZE)
      }
    } catch {
      // ignore
    } finally {
      if (isInitial) setLoading(false)
      else setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements(1)
  }, [fetchAnnouncements])

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchAnnouncements(nextPage, true)
  }

  return (
    <div className="space-y-6">
      <PageTour steps={COMUNICADOS_TOUR_STEPS} active={tourActive} onFinish={finishTour} />
      <div className="flex items-center gap-2" data-tour="pcm-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comunicados</h1>
          <p className="text-sm text-muted-foreground">Avisos e informes do seu escritório</p>
        </div>
        <TourRestartButton onClick={startTour} />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium">Nenhum comunicado no momento</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Seu escritório ainda não publicou comunicados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className="rounded-2xl border-gray-200 bg-white p-6 shadow-sm">
              <CardHeader className="p-0 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">{a.title}</h3>
                  <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(a.publishedAt)}
                  </Badge>
                </div>
                {a.author && (
                  <p className="text-xs text-muted-foreground mt-1">Por {a.author}</p>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{a.body}</p>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Carregar mais'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
