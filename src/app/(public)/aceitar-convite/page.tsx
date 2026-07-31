"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Radar,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Shield,
  Clock,
  UserPlus,
  Mail,
  LogIn,
  UserCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type InviteState =
  | "loading"
  | "invite_found"
  | "expired"
  | "already_accepted"
  | "not_found"
  | "accepting"
  | "success"
  | "error"

interface InvitePreview {
  organizationName: string
  organizationId: string
  role: string
  inviterName: string
  inviterEmail: string
  expiresAt: string
  email: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  collaborator: "Colaborador",
  viewer: "Visualizador",
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function AceitarConviteForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteId = searchParams.get("invite_id") || ""

  const [state, setState] = useState<InviteState>("loading")
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in + fetch invite
  useEffect(() => {
    async function load() {
      // Read session and login status together
      let loggedIn = false
      try {
        const session = localStorage.getItem("cr_session")
        if (session) {
          const parsed = JSON.parse(session)
          if (parsed.userId) {
            loggedIn = true
          }
        }
      } catch {
        // not logged in
      }

      if (!inviteId) {
        setIsLoggedIn(loggedIn)
        setState("not_found")
        setErrorMessage("ID do convite não encontrado.")
        return
      }

      setState("loading")
      try {
        const res = await fetch(
          `/api/v1/radar/invitations/${encodeURIComponent(inviteId)}/preview`
        )
        const data = await res.json().catch(() => ({}))

        setIsLoggedIn(loggedIn)

        if (res.ok) {
          setInvite(data)
          setState("invite_found")
        } else if (res.status === 410) {
          setInvite(data)
          setState("expired")
        } else if (res.status === 409) {
          setInvite(data)
          setState("already_accepted")
        } else if (res.status === 404) {
          setState("not_found")
          setErrorMessage(data.error || "Convite não encontrado.")
        } else {
          setState("error")
          setErrorMessage(data.error || "Erro ao carregar convite.")
        }
      } catch {
        setIsLoggedIn(loggedIn)
        setState("error")
        setErrorMessage("Erro de conexão. Tente novamente.")
      }
    }

    load()
  }, [inviteId])

  async function handleRetry() {
    setState("loading")
    try {
      const res = await fetch(
        `/api/v1/radar/invitations/${encodeURIComponent(inviteId)}/preview`
      )
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setInvite(data)
        setState("invite_found")
      } else if (res.status === 410) {
        setInvite(data)
        setState("expired")
      } else if (res.status === 409) {
        setInvite(data)
        setState("already_accepted")
      } else if (res.status === 404) {
        setState("not_found")
        setErrorMessage(data.error || "Convite não encontrado.")
      } else {
        setState("error")
        setErrorMessage(data.error || "Erro ao carregar convite.")
      }
    } catch {
      setState("error")
      setErrorMessage("Erro de conexão. Tente novamente.")
    }
  }

  async function handleAccept() {
    if (!inviteId) return

    setState("accepting")
    try {
      const session = localStorage.getItem("cr_session")
      const parsed = session ? JSON.parse(session) : {}

      const res = await fetch(
        `/api/v1/radar/invitations/${encodeURIComponent(inviteId)}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(parsed.token ? { Authorization: `Bearer ${parsed.token}` } : {}),
          },
        }
      )

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setState("success")
        // Update localStorage with new org
        if (data.orgId) {
          parsed.orgId = data.orgId
          localStorage.setItem("cr_session", JSON.stringify(parsed))
        }
        // Redirect after 3s
        setTimeout(() => {
          router.push("/app")
        }, 3000)
      } else if (res.status === 410) {
        setState("expired")
      } else if (res.status === 409) {
        setState("already_accepted")
      } else {
        setState("error")
        setErrorMessage(data.error || "Erro ao aceitar convite.")
      }
    } catch {
      setState("error")
      setErrorMessage("Erro de conexão. Tente novamente.")
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
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Convite aceito!</h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Você agora faz parte de{" "}
            <span className="font-semibold text-gray-900">
              {invite?.organizationName || "a organização"}
            </span>
            . Redirecionando...
          </p>
          <div className="mt-6">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#2563eb]" />
          </div>
        </div>
      </div>
    )
  }

  // Not found
  if (state === "not_found") {
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
            <h1 className="mt-6 text-xl font-bold text-gray-900">Convite não encontrado</h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {errorMessage || "Este convite não existe ou foi removido."}
            </p>
            <Button
              className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              asChild
            >
              <Link href="/">Ir para a página inicial</Link>
            </Button>
          </div>
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
              <Clock className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-gray-900">Convite expirado</h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Este convite para{" "}
              <span className="font-medium text-gray-700">
                {invite?.organizationName || "a organização"}
              </span>{" "}
              expirou e não pode mais ser aceito.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Entre em contato com o administrador da organização para solicitar um novo convite.
            </p>
            <Button
              className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              asChild
            >
              <Link href="/">Ir para a página inicial</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Already accepted
  if (state === "already_accepted") {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <CheckCircle2 className="h-8 w-8 text-[#2563eb]" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Convite já aceito</h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            Você já aceitou este convite e faz parte de{" "}
            <span className="font-semibold text-gray-900">
              {invite?.organizationName || "a organização"}
            </span>
            .
          </p>
          <Button
            className="mt-8 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
            asChild
          >
            <Link href="/app">Acessar o painel</Link>
          </Button>
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
            <h1 className="mt-6 text-xl font-bold text-gray-900">Erro ao carregar convite</h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              {errorMessage || "Ocorreu um erro inesperado."}
            </p>
            <Button
              className="mt-6 h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              onClick={handleRetry}
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Loading
  if (state === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    )
  }

  // Invite found — show details
  if (!invite) return null

  const loginNext = `/login?next=${encodeURIComponent(`/aceitar-convite?invite_id=${inviteId}`)}`
  const registerNext = `/register?invite_id=${encodeURIComponent(inviteId)}`

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
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Você recebeu um convite</h1>
          <p className="mt-2 text-sm text-gray-500">
            Um escritório convidou você para participar do Company Radar.
          </p>
        </div>

        {/* Invite details card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-5">
            {/* Organization */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="h-5 w-5 text-[#2563eb]" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Organização
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {invite.organizationName}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Papel
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {ROLE_LABELS[invite.role] || invite.role}
                </p>
              </div>
            </div>

            {/* Inviter */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Convidado por
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {invite.inviterName}
                </p>
                <p className="text-sm text-gray-500">{invite.inviterEmail}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  E-mail do convite
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {invite.email}
                </p>
              </div>
            </div>

            {/* Expiry */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Válido até
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {formatDate(invite.expiresAt)}
                </p>
              </div>
            </div>
          </div>

          <hr className="my-6 border-gray-100" />

          {/* Actions based on login state */}
          {isLoggedIn ? (
            <Button
              className="h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
              onClick={handleAccept}
              disabled={state === "accepting"}
            >
              {state === "accepting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aceitando convite...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aceitar convite
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                className="h-11 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold"
                asChild
              >
                <Link href={loginNext}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Já tenho conta
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                asChild
              >
                <Link href={registerNext}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Criar conta
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AceitarConvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        </div>
      }
    >
      <AceitarConviteForm />
    </Suspense>
  )
}
