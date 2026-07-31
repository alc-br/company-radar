"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Radar, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type VerifyStatus = "loading" | "confirming" | "success" | "error" | "timeout"

interface CheckoutData {
  planName: string
  planId: string
  subscriptionId: string
}

function ConfirmacaoForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id") || ""
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  const [status, setStatus] = useState<VerifyStatus>("loading")
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const verifyCheckout = useCallback(async () => {
    if (!sessionId) {
      setStatus("error")
      setErrorMessage("ID da sessão não encontrado. Verifique o link de retorno.")
      return
    }

    try {
      const res = await fetch(
        `/api/v1/billing/subscriptions/verify-checkout?session_id=${encodeURIComponent(sessionId)}`
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 404 || res.status === 409) {
          // 409 = still processing, 404 = not found yet
          setStatus("confirming")
          return
        }
        setStatus("error")
        setErrorMessage(data.error || "Erro ao verificar pagamento.")
        return
      }

      const data = await res.json()
      setCheckoutData(data)
      clearPolling()
      setStatus("success")
    } catch {
      setStatus("error")
      setErrorMessage("Erro de conexão. Tente novamente.")
      clearPolling()
    }
  }, [sessionId, clearPolling])

  useEffect(() => {
    if (!sessionId) {
      setStatus("error")
      setErrorMessage("ID da sessão não encontrado. Verifique o link de retorno.")
      return
    }

    // Initial check
    setStatus("confirming")
    startTimeRef.current = Date.now()
    verifyCheckout()

    // Start polling every 3 seconds
    pollingRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current

      // 60s timeout
      if (elapsed >= 60_000) {
        clearPolling()
        setStatus("timeout")
        return
      }

      verifyCheckout()
    }, 3000)

    return () => clearPolling()
  }, [sessionId, verifyCheckout, clearPolling])

  function handleRetry() {
    setStatus("confirming")
    startTimeRef.current = Date.now()
    setErrorMessage("")
    verifyCheckout()

    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        if (elapsed >= 60_000) {
          clearPolling()
          setStatus("timeout")
          return
        }
        verifyCheckout()
      }, 3000)
    }
  }

  // Success state
  if (status === "success" && checkoutData) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">Pagamento confirmado!</h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Sua assinatura do plano{" "}
            <span className="font-semibold text-gray-900">{checkoutData.planName}</span>{" "}
            foi ativada com sucesso.
          </p>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-left">
            <h2 className="text-sm font-semibold text-gray-900">Próximo passo</h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Configure sua organização para começar a usar o Company Radar.
              Cadastre seu escritório, convide sua equipe e comece a gerenciar suas empresas.
            </p>
            <Button
              className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              asChild
            >
              <Link href="/app/onboarding">
                Criar minha organização
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </div>
    )
  }

  // Timeout state
  if (status === "timeout") {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]">
                <Radar className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Company <span className="text-[#2563eb]">Radar</span>
              </span>
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-gray-900">
              Processamento em andamento
            </h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              O processamento do seu pagamento está demorando mais do que o esperado.
              Não se preocupe — o pagamento foi registrado e você receberá um
              <span className="font-medium text-gray-700"> e-mail de confirmação </span>
              assim que for processado.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              ID da sessão: {sessionId.slice(0, 8)}...
            </p>
            <Button
              className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              asChild
            >
              <Link href="/">Ir para a página inicial</Link>
            </Button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleRetry}
              className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            >
              Tentar verificar novamente
            </button>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (status === "error") {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]">
                <Radar className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Company <span className="text-[#2563eb]">Radar</span>
              </span>
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-gray-900">
              Erro ao confirmar pagamento
            </h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {errorMessage || "Não foi possível verificar o status do pagamento. Tente novamente."}
            </p>
            <Button
              className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              onClick={handleRetry}
            >
              Tentar novamente
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/planos"
              className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            >
              Voltar aos planos
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </div>
    )
  }

  // Loading / Confirming state
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]">
              <Radar className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Company <span className="text-[#2563eb]">Radar</span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
          </div>
          <h1 className="mt-6 text-xl font-bold text-gray-900">
            Confirmando pagamento...
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Aguarde enquanto verificamos o status do seu pagamento com a Stripe.
            Isso pode levar alguns segundos.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#2563eb] animate-bounce [animation-delay:-0.3s]" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#2563eb] animate-bounce [animation-delay:-0.15s]" />
            <div className="h-1.5 w-1.5 rounded-full bg-[#2563eb] animate-bounce" />
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        </div>
      }
    >
      <ConfirmacaoForm />
    </Suspense>
  )
}
