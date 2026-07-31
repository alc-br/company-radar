"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Check,
  ArrowRight,
  Loader2,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"

interface Plan {
  id: string
  name: string
  slug: string
  price: number
  annualPrice: number | null
  maxClients: number
  maxUsers: number
  maxStorageMb: number
  maxExports: number
  maxPortalContacts: number
  maxTemplates: number
  features: string
  highlight: boolean
  stripePriceId: string | null
  stripeAnnualPriceId: string | null
}

interface FAQItem {
  id: string
  question: string
  answer: string
  order: number
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export default function PlanosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [plans, setPlans] = useState<Plan[]>([])
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cycle = searchParams.get("cycle")
    if (cycle === "annual") setAnnual(true)
  }, [searchParams])

  useEffect(() => {
    async function fetchPlans() {
      try {
        const [plansRes, faqRes] = await Promise.all([
          fetch("/api/public/plans"),
          fetch("/api/public/faq"),
        ])
        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans(data)
        }
        if (faqRes.ok) {
          const data = await faqRes.json()
          setFaqs(data.slice(0, 6))
        }
      } catch {
        toast.error("Erro ao carregar planos.")
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  function handleSelectPlan(plan: Plan) {
    if (plan.price === 0) {
      router.push("/register")
      return
    }
    const cycle = annual ? "annual" : "monthly"
    router.push(`/checkout?planId=${plan.id}&cycle=${cycle}`)
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2563eb]">Planos</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Escolha o plano ideal para o seu escritório
            </h1>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Comece gratuitamente e cresça conforme sua carteira de clientes expande. Sem surpresas, sem fidelidade.
            </p>
          </div>

          {/* Toggle */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!annual ? "text-gray-900" : "text-gray-500"}`}>Mensal</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                annual ? "bg-[#2563eb]" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={annual}
              aria-label="Alternar ciclo de cobrança"
            >
              <span
                className={`pointer-events-none inline-block h-5.5 w-5.5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  annual ? "translate-x-5" : "translate-x-0.5"
                } mt-[1px]`}
              />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-gray-900" : "text-gray-500"}`}>
              Anual
              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                20% off
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="bg-white pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
            </div>
          ) : plans.length === 0 ? (
            <div className="py-20 text-center">
              <HelpCircle className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum plano disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const price = annual && plan.annualPrice ? plan.annualPrice : plan.price
                const monthlyEquiv =
                  annual && plan.annualPrice
                    ? plan.annualPrice / 12
                    : plan.price
                const features: string[] = JSON.parse(plan.features || "[]")

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 transition-shadow ${
                      plan.highlight
                        ? "border-[#2563eb] shadow-lg shadow-blue-100 ring-2 ring-[#2563eb]"
                        : "border-gray-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563eb] px-4 py-1 text-xs font-semibold text-white">
                        Recomendado
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-4">
                      {price === 0 ? (
                        <p className="text-4xl font-bold text-gray-900">Grátis</p>
                      ) : (
                        <>
                          <p className="text-4xl font-bold text-gray-900">
                            {formatBRL(monthlyEquiv)}
                            <span className="text-base font-normal text-gray-500">/mês</span>
                          </p>
                          {annual && plan.annualPrice && (
                            <p className="mt-1 text-sm text-gray-500">
                              Cobrado anualmente: {formatBRL(plan.annualPrice)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Até {plan.maxClients} clientes · {plan.maxUsers} usuários
                    </p>
                    <hr className="my-6 border-gray-100" />
                    <ul className="flex-1 space-y-3">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563eb]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`mt-8 h-11 w-full text-sm font-semibold ${
                        plan.highlight
                          ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {price === 0 ? "Começar gratuitamente" : "Contratar agora"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#2563eb]">Dúvidas frequentes</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Perguntas sobre planos</h2>
            </div>
            <Accordion type="single" collapsible className="mt-10">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left text-sm font-medium text-gray-900 hover:text-[#2563eb]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-8 text-center">
              <Link href="/faq" className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]">
                Ver todas as perguntas frequentes →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <section className="bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário. Valores e condições sujeitos a alteração sem aviso prévio.
          </p>
        </div>
      </section>
    </div>
  )
}
