'use client'

import { useEffect, useLayoutEffect, useState, useCallback } from 'react'
import { X, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface TourStep {
  selector: string
  title: string
  description: string
}

function storageKey(pageKey: string) {
  return `cr_tour_seen_${pageKey}`
}

// Hook: decide se o tour deve abrir sozinho (1a visita) e expõe start/finish.
// pageKey identifica a pagina (ex.: 'empresas'); persistido por navegador, nao por conta,
// entao trocar de usuario no mesmo browser pode reexibir — aceitavel para um tutorial opcional.
export function usePageTour(pageKey: string) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const seen = typeof window !== 'undefined' && localStorage.getItem(storageKey(pageKey))
    if (!seen) setActive(true)
  }, [pageKey])

  const start = useCallback(() => setActive(true), [])
  const finish = useCallback(() => {
    try { localStorage.setItem(storageKey(pageKey), '1') } catch {}
    setActive(false)
  }, [pageKey])

  return { active, start, finish }
}

// Botao "?" para reabrir o tour manualmente a qualquer momento.
export function TourRestartButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClick} title="Ver tutorial desta página">
      <HelpCircle className="h-4 w-4" />
    </Button>
  )
}

interface PageTourProps {
  steps: TourStep[]
  active: boolean
  onFinish: () => void
}

const MARGIN = 12

export function PageTour({ steps, active, onFinish }: PageTourProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (active) setStepIdx(0)
  }, [active])

  const measure = useCallback(() => {
    if (!active) return
    const step = steps[stepIdx]
    if (!step) return
    const el = document.querySelector(step.selector)
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      // pequeno atraso para o scroll suave assentar antes de medir a posicao final
      window.setTimeout(() => setRect(el.getBoundingClientRect()), 260)
    } else {
      setRect(null)
    }
  }, [active, stepIdx, steps])

  useLayoutEffect(() => { measure() }, [measure])

  useEffect(() => {
    if (!active) return
    function onResize() { forceTick((n) => n + 1); measure() }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [active, measure])

  if (!active || steps.length === 0) return null
  const step = steps[stepIdx]
  if (!step) return null
  const isFirst = stepIdx === 0
  const isLast = stepIdx === steps.length - 1

  function next() { if (isLast) onFinish(); else setStepIdx((i) => i + 1) }
  function back() { setStepIdx((i) => Math.max(0, i - 1)) }

  // Posiciona o card abaixo do alvo por padrao; se nao couber, tenta acima; sempre grudado nas bordas laterais.
  let tooltipStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  if (rect) {
    const cardWidth = 340
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const spaceBelow = viewportH - rect.bottom
    const placeBelow = spaceBelow > 180 || rect.top < 180
    const top = placeBelow ? rect.bottom + MARGIN : Math.max(MARGIN, rect.top - MARGIN)
    let left = rect.left + rect.width / 2 - cardWidth / 2
    left = Math.min(Math.max(MARGIN, left), viewportW - cardWidth - MARGIN)
    tooltipStyle = placeBelow
      ? { top, left, width: cardWidth }
      : { top, left, width: cardWidth, transform: 'translateY(-100%)' }
  }

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={step.title}>
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-4 ring-primary transition-all duration-200"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/60" />
      )}

      <div className="absolute rounded-xl border bg-white p-4 shadow-2xl" style={tooltipStyle}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold leading-tight">{step.title}</h3>
          <button onClick={onFinish} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Fechar tutorial">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{stepIdx + 1} de {steps.length}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onFinish}>Pular</Button>
            {!isFirst && <Button variant="outline" size="sm" className="h-8 text-xs" onClick={back}>Voltar</Button>}
            <Button size="sm" className="h-8 text-xs" onClick={next}>{isLast ? 'Concluir' : 'Próximo'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
