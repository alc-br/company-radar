"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Loader2,
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Plan {
  id: string
  name: string
  slug: string
  price: number
  annualPrice: number | null
  maxClients: number
  maxUsers: number
  features: string
  highlight: boolean
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams.get("planId") || ""
  const cycle = searchParams.get("cycle") || "monthly"

  const [plan, setPlan] = useState<Plan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [razaoSocial, setRazaoSocial] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/public/plans")
        if (res.ok) {
          const plans: Plan[] = await res.json()
          const found = plans.find((p) => p.id === planId)
          if (found) {
            setPlan(found)
          } else {
            toast.error("Plano não encontrado. Selecione um plano válido.")
            router.replace("/planos")
          }
        }
      } catch {
        toast.error("Erro ao carregar plano.")
      } finally {
        setLoadingPlan(false)
      }
    }
    if (planId) fetchPlan()
    else {
      setLoadingPlan(false)
      router.replace("/planos")
    }
  }, [planId, router])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!razaoSocial.trim()) newErrors.razaoSocial = "A razão social é obrigatória."
    if (!cnpj.trim()) {
      newErrors.cnpj = "O CNPJ é obrigatório."
    } else if (cnpj.replace(/\D/g, "").length !== 14) {
      newErrors.cnpj = "CNPJ incompleto."
    }
    if (!email.trim()) {
      newErrors.email = "O e-mail é obrigatório."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Insira um e-mail válido."
    }
    if (!telefone.trim()) {
      newErrors.telefone = "O telefone é obrigatório."
    } else if (telefone.replace(/\D/g, "").length < 10) {
      newErrors.telefone = "Telefone incompleto."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !plan) return

    setSubmitting(true)
    try {
      // In production, this would call Stripe Checkout
      // For now, redirect to login with a message
      toast.success("Em produção, o Stripe Checkout seria aberto aqui.")
      router.push("/login?message=Assinatura simulada com sucesso. Faça login para continuar.")
    } catch {
      toast.error("Erro ao processar pagamento. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingPlan) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    )
  }

  if (!plan) return null

  const price = cycle === "annual" && plan.annualPrice ? plan.annualPrice : plan.price
  const monthlyEquiv = cycle === "annual" && plan.annualPrice ? plan.annualPrice / 12 : plan.price
  const features: string[] = JSON.parse(plan.features || "[]")

  return (
    <div className="bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/planos"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-8"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Voltar aos planos
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Plan Summary - Left */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{plan.name}</h2>
                  <p className="text-xs text-gray-500">
                    {cycle === "annual" ? "Cobrança anual" : "Cobrança mensal"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-3xl font-bold text-gray-900">
                  {formatBRL(monthlyEquiv)}
                  <span className="text-base font-normal text-gray-500">/mês</span>
                </p>
                {cycle === "annual" && plan.annualPrice && (
                  <p className="mt-1 text-sm text-gray-500">
                    Total anual: {formatBRL(plan.annualPrice)}
                  </p>
                )}
              </div>

              <hr className="my-6 border-gray-100" />

              <h3 className="text-sm font-semibold text-gray-900">Incluso no plano:</h3>
              <ul className="mt-3 space-y-2">
                {features.map((f) => (
                  <li key={f} className="text-sm text-gray-600">• {f}</li>
                ))}
                <li className="text-sm text-gray-600">• Até {plan.maxClients} clientes</li>
                <li className="text-sm text-gray-600">• Até {plan.maxUsers} usuários</li>
              </ul>
            </div>
          </div>

          {/* Form - Right */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-gray-900">Dados de cobrança</h2>
              <p className="mt-1 text-sm text-gray-500">
                Informe os dados da empresa para a fatura.
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão social</Label>
                  <Input
                    id="razaoSocial"
                    placeholder="Escritório Contábil Ltda"
                    value={razaoSocial}
                    onChange={(e) => {
                      setRazaoSocial(e.target.value)
                      if (errors.razaoSocial) setErrors((prev) => ({ ...prev, razaoSocial: "" }))
                    }}
                    className={errors.razaoSocial ? "border-red-400 focus-visible:ring-red-400" : ""}
                  />
                  {errors.razaoSocial && <p className="text-xs text-red-500">{errors.razaoSocial}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => {
                      setCnpj(formatCNPJ(e.target.value))
                      if (errors.cnpj) setErrors((prev) => ({ ...prev, cnpj: "" }))
                    }}
                    className={errors.cnpj ? "border-red-400 focus-visible:ring-red-400" : ""}
                  />
                  {errors.cnpj && <p className="text-xs text-red-500">{errors.cnpj}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail de cobrança</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="financeiro@escritorio.com.br"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors((prev) => ({ ...prev, email: "" }))
                      }}
                      className={errors.email ? "border-red-400 focus-visible:ring-red-400" : ""}
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => {
                        setTelefone(formatPhone(e.target.value))
                        if (errors.telefone) setErrors((prev) => ({ ...prev, telefone: "" }))
                      }}
                      className={errors.telefone ? "border-red-400 focus-visible:ring-red-400" : ""}
                    />
                    {errors.telefone && <p className="text-xs text-red-500">{errors.telefone}</p>}
                  </div>
                </div>

                {/* Security notice */}
                <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2563eb]" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pagamento seguro com Stripe</p>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                      O processamento do pagamento é realizado pelo Stripe, uma das plataformas de pagamento mais seguras do mundo. O Company Radar não armazena dados de cartão de crédito.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold text-base"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-5 w-5" />
                  )}
                  Finalizar com Stripe
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  )
}
