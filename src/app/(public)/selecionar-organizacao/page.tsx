"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Radar, Loader2, Building2, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface OrgMember {
  organizationId: string
  organizationName: string
  role: string
  planName: string
  lastAccess: string | null
}

interface SessionData {
  userId: string
  email: string
  name: string
  orgId: string
  role: string
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
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr))
  } catch {
    return "—"
  }
}

export default function SelecionarOrganizacaoPage() {
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [organizations, setOrganizations] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const raw = localStorage.getItem("cr_session")
        if (!raw) {
          router.replace("/login")
          return
        }
        const parsed: SessionData = JSON.parse(raw)
        if (!parsed.userId) {
          router.replace("/login")
          return
        }

        setLoading(true)
        const res = await fetch("/api/v1/organizations/mine", {
          headers: {
            ...(parsed.token ? { Authorization: `Bearer ${parsed.token}` } : {}),
          },
        })

        if (!res.ok) {
          toast.error("Erro ao carregar organizações.")
          setLoading(false)
          return
        }

        const data = await res.json()
        const orgs: OrgMember[] = data.organizations || data || []

        if (orgs.length === 0) {
          router.replace("/app/onboarding")
          return
        }

        if (orgs.length === 1) {
          const updated = { ...parsed, orgId: orgs[0].organizationId, role: orgs[0].role }
          localStorage.setItem("cr_session", JSON.stringify(updated))
          router.replace("/app")
          return
        }

        setSession(parsed)
        setOrganizations(orgs)
        setLoading(false)
      } catch {
        router.replace("/login")
      }
    }

    load()
  }, [router])

  function handleSelectOrg(org: OrgMember) {
    if (!session || selecting) return
    setSelecting(org.organizationId)

    const updated = { ...session, orgId: org.organizationId, role: org.role }
    localStorage.setItem("cr_session", JSON.stringify(updated))

    // Brief visual feedback before redirect
    setTimeout(() => {
      router.push("/app")
    }, 300)
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
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
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Selecione a organização</h1>
          <p className="mt-2 text-sm text-gray-500">
            Você pertence a múltiplas organizações. Escolha qual acessar.
          </p>
        </div>

        {/* User info */}
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold text-white">
            {session.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{session.name || "Usuário"}</p>
            <p className="text-xs text-gray-500">{session.email}</p>
          </div>
        </div>

        {/* Organization list */}
        <div className="space-y-3">
          {organizations.map((org) => {
            const isActive = selecting === org.organizationId
            return (
              <button
                key={org.organizationId}
                onClick={() => handleSelectOrg(org)}
                disabled={!!selecting}
                className={`w-full rounded-2xl border bg-white p-5 shadow-sm text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2 ${
                  isActive
                    ? "border-[#2563eb] ring-2 ring-[#2563eb] ring-offset-1"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                      <Building2 className="h-5 w-5 text-[#2563eb]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {org.organizationName}
                        </p>
                        {isActive && (
                          <CheckCircle2 className="h-4 w-4 text-[#2563eb]" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
                          {ROLE_LABELS[org.role] || org.role}
                        </span>
                        {org.planName && (
                          <span>{org.planName}</span>
                        )}
                        {org.lastAccess && (
                          <span>Último acesso: {formatDate(org.lastAccess)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                </div>
                {isActive && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#2563eb]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Acessando...
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              localStorage.removeItem("cr_session")
              router.push("/login")
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Trocar conta
          </button>
        </div>
      </div>
    </div>
  )
}
