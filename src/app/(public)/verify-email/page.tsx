"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Radar, Loader2, CheckCircle2, AlertCircle, Info, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type VerifyState =
  | "idle"
  | "verifying"
  | "success"
  | "already_verified"
  | "expired"
  | "error"

const MAX_RESENDS = 3
const COOLDOWN_SECONDS = 60

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const key = searchParams.get("key") || ""
  const token = searchParams.get("token") || ""

  const [state, setState] = useState<VerifyState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [resendCount, setResendCount] = useState(0)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)

  // Cooldown timer
  useEffect(() => {
    if (cooldownLeft <= 0) return

    cooldownRef.current = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [cooldownLeft])

  // Verify email on mount if params present
  useEffect(() => {
    if (!key || !token) return

    let cancelled = false

    async function verify() {
      setState("verifying")
      try {
        const res = await fetch("/api/account/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, token }),
        })

        const data = await res.json().catch(() => ({}))
        if (cancelled) return

        if (res.ok) {
          setState("success")
        } else if (res.status === 409) {
          setState("already_verified")
        } else if (res.status === 410 || res.status === 400) {
          setState("expired")
        } else {
          setState("error")
          setErrorMessage(data.error || "Erro ao verificar e-mail.")
        }
      } catch {
        if (cancelled) return
        setState("error")
        setErrorMessage("Erro de conexão. Tente novamente.")
      }
    }

    verify()
    return () => { cancelled = true }
  }, [key, token])

  async function handleRetry() {
    if (!key || !token) return
    setState("verifying")
    try {
      const res = await fetch("/api/account/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, token }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setState("success")
      } else if (res.status === 409) {
        setState("already_verified")
      } else if (res.status === 410 || res.status === 400) {
        setState("expired")
      } else {
        setState("error")
        setErrorMessage(data.error || "Erro ao verificar e-mail.")
      }
    } catch {
      setState("error")
      setErrorMessage("Erro de conexão. Tente novamente.")
    }
  }

  async function handleResend() {
    if (resendCount >= MAX_RESENDS || cooldownLeft > 0) return

    try {
      const res = await fetch("/api/account/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Erro ao reenviar e-mail de verificação.")
        return
      }

      const newCount = resendCount + 1
      setResendCount(newCount)
      setCooldownLeft(COOLDOWN_SECONDS)
      toast.success("Novo e-mail de verificação enviado!")
    } catch {
      toast.error("Erro de conexão. Tente novamente.")
    }
  }

  // Success
  if (state === "success") {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">E-mail verificado com sucesso!</h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Seu e-mail foi confirmado. Agora você pode fazer login e começar a usar o Company Radar.
          </p>
          <Button
            className="mt-8 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
            asChild
          >
            <Link href="/login">Ir para o login</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Already verified
  if (state === "already_verified") {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Info className="h-8 w-8 text-[#2563eb]" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">E-mail já verificado</h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Este e-mail já foi verificado anteriormente. Você pode fazer login normalmente.
          </p>
          <Button
            className="mt-8 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
            asChild
          >
            <Link href="/login">Ir para o login</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Expired
  if (state === "expired") {
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
              Link de verificação expirado
            </h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Este link de verificação expirou ou é inválido. Solicite um novo link de verificação abaixo.
            </p>

            {resendCount < MAX_RESENDS ? (
              <>
                <Button
                  className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
                  onClick={handleResend}
                  disabled={cooldownLeft > 0}
                >
                  {cooldownLeft > 0 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aguardar {cooldownLeft}s
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Reenviar e-mail de verificação
                    </>
                  )}
                </Button>
                {resendCount > 0 && (
                  <p className="mt-3 text-xs text-gray-400">
                    {MAX_RESENDS - resendCount} envio(s) restante(s).
                  </p>
                )}
              </>
            ) : (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">
                  Limite de reenvios atingido. Entre em contato com o suporte ou tente fazer login para solicitar um novo link.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            >
              <ArrowLeft className="mr-1 h-4 w-4 inline" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error
  if (state === "error") {
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
              Erro ao verificar e-mail
            </h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {errorMessage || "Ocorreu um erro inesperado. Tente novamente."}
            </p>
            <Button
              className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              onClick={handleRetry}
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
            >
              <ArrowLeft className="mr-1 h-4 w-4 inline" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Verifying / Idle (no params)
  if (state === "verifying") {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    )
  }

  // Idle — no key/token params, show general verification instructions
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563eb]">
              <Radar className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              Company <span className="text-[#2563eb]">Radar</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Verifique seu e-mail</h1>
          <p className="mt-2 text-sm text-gray-500">
            Para ativar sua conta, confirme seu endereço de e-mail.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Mail className="h-7 w-7 text-[#2563eb]" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-gray-900">Acesse sua caixa de entrada</h2>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Enviamos um e-mail com um link de verificação para o endereço cadastrado.
            Clique no link para confirmar sua conta.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Não encontrou? Verifique também a pasta de spam.
          </p>

          {resendCount < MAX_RESENDS ? (
            <>
              <Button
                className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
                onClick={handleResend}
                disabled={cooldownLeft > 0}
              >
                {cooldownLeft > 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguardar {cooldownLeft}s
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Reenviar e-mail de verificação
                  </>
                )}
              </Button>
              {resendCount > 0 && (
                <p className="mt-3 text-xs text-gray-400">
                  {MAX_RESENDS - resendCount} envio(s) restante(s).
                </p>
              )}
            </>
          ) : (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">
                Limite de reenvios atingido. Entre em contato com o suporte.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
          >
            <ArrowLeft className="mr-1 h-4 w-4 inline" />
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  )
}
