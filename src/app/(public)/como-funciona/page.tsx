"use client"

import Link from "next/link"
import {
  CalendarDays,
  Bell,
  FileText,
  BarChart3,
  Clock,
  ShieldCheck,
  ArrowRight,
  Check,
  X,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Step {
  number: number
  title: string
  description: string
}

const steps: Step[] = [
  {
    number: 1,
    title: "Crie seus templates",
    description:
      "Transforme procedimentos internos em templates reutilizáveis com etapas, tarefas, prazos e recorrências.",
  },
  {
    number: 2,
    title: "Cadastre seus clientes",
    description:
      "Importe ou cadastre sua carteira de empresas com dados completos e atribua responsáveis.",
  },
  {
    number: 3,
    title: "Aplique e acompanhe",
    description:
      "Aplique templates em clientes e acompanhe a execução com dashboard, alertas e calendário.",
  },
  {
    number: 4,
    title: "Portal do cliente",
    description:
      "Conceda acesso para que clientes enviem documentos e acompanhem pendências.",
  },
]

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  color: string
  bgColor: string
}

const features: Feature[] = [
  {
    icon: CalendarDays,
    title: "Calendário compartilhado",
    description: "Visualize todos os prazos e entregas em um calendário integrado com filtros por equipe e cliente.",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    description: "Receba notificações automáticas quando prazos estiverem próximos ou tarefas atrasadas.",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    icon: FileText,
    title: "Central de documentos",
    description: "Solicite, receba e valide documentos dos clientes com controle de validade automático.",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    icon: BarChart3,
    title: "Relatórios gerenciais",
    description: "Gere relatórios detalhados de produtividade, prazos cumpridos e métricas em tempo real.",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: Clock,
    title: "Controle de prazos",
    description: "Gerencie recorrências automáticas, prioridades e filas de trabalho com total visibilidade.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    icon: ShieldCheck,
    title: "Portal seguro",
    description: "Acesso seguro para clientes com token individual, criptografia e conformidade LGPD.",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
]

const beforeItems = [
  "Planilhas espalhadas",
  "Agendas individuais",
  "Comunicação por WhatsApp",
  "Sem controle de prazos",
  "Documentos perdidos",
]

const afterItems = [
  "Templates centralizados",
  "Calendário compartilhado",
  "Portal do cliente",
  "Alertas automáticos",
  "Central de documentos",
]

export default function ComoFuncionaPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2563eb]">
              Como funciona
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Como funciona o{" "}
              <span className="text-[#2563eb]">Company Radar</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Do template à execução, em menos de 5 minutos.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Flow */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Step Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563eb] text-white text-lg font-bold">
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                {/* Arrow connector (desktop only, not on last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 z-10 text-gray-300">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards 2x3 */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Recursos que fazem a diferença
            </h2>
            <p className="mt-3 text-gray-600">
              Cada funcionalidade foi pensada para simplificar o dia a dia do seu escritório.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bgColor} ${feature.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Before vs After Comparison */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="mt-3 text-gray-600">
              Veja como o Company Radar transforma a operação do seu escritório.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Before */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                  <X className="h-4 w-4 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-700">Antes</h3>
              </div>
              <ul className="space-y-3">
                {beforeItems.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <X className="h-4 w-4 flex-shrink-0 text-red-400" />
                    <span className="text-sm text-red-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-700">Depois</h3>
              </div>
              <ul className="space-y-3">
                {afterItems.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                    <span className="text-sm text-green-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2563eb] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Comece agora gratuitamente
            </h2>
            <p className="mt-4 text-lg text-blue-100 leading-relaxed">
              Cadastro gratuito, sem necessidade de cartão de crédito. Comece a organizar seu escritório hoje mesmo.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-white text-[#2563eb] hover:bg-blue-50 h-12 px-8 text-base font-semibold"
                asChild
              >
                <Link href="/register">
                  Criar conta gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </section>
    </div>
  )
}
