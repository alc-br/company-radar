"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Users,
  Building2,
  CheckCircle2,
  ListChecks,
  FolderOpen,
  CalendarDays,
  Shield,
  BarChart3,
  FileText,
  Clock,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: FolderOpen,
    title: "Carteira de Clientes",
    description:
      "Cadastre e organize todos os seus clientes com dados completos: CNPJ, regime tributário, CNAE, contatos e tags personalizadas.",
  },
  {
    icon: LayoutTemplate,
    title: "Templates Operacionais",
    description:
      "Crie templates de procedimentos com etapas, prazos e responsáveis. Padronize a operação e garanta que nada seja esquecido.",
  },
  {
    icon: ListChecks,
    title: "Tarefas e Prazos",
    description:
    "Acompanhe tarefas por cliente, status e prioridade. Defina prazos, atribua responsáveis e receba alertas de vencimento.",
  },
  {
    icon: FileText,
    title: "Central de Documentos",
    description:
      "Receba, organize e valide documentos dos clientes. Solicitações automáticas por competência com controle de validade.",
  },
  {
    icon: CalendarDays,
    title: "Calendário Compartilhado",
    description:
      "Visualize prazos, entregas e compromissos em um calendário integrado. Feriados personalizados e visão por equipe.",
  },
  {
    icon: BarChart3,
    title: "Relatórios e Auditoria",
    description:
      "Gere relatórios de produtividade, prazos e status. Registro completo de ações para auditoria e conformidade.",
  },
  {
    icon: Users,
    title: "Gestão de Equipe",
    description:
      "Gerencie permissões por cargo e departamento. Controle de acesso granular para cada membro do escritório.",
  },
  {
    icon: Shield,
    title: "Segurança e LGPD",
    description:
      "Criptografia de ponta a ponta, backup automático e conformidade com a LGPD. Seus dados e dos clientes protegidos.",
  },
]

const steps = [
  {
    number: "01",
    title: "Crie Templates",
    description:
      "Defina procedimentos operacionais com etapas, prazos e responsáveis. Cada template representa um tipo de obrigação ou processo do escritório.",
    icon: LayoutTemplate,
  },
  {
    number: "02",
    title: "Aplique aos Clientes",
    description:
      "Selecione os clientes e aplique os templates relevantes. As tarefas são geradas automaticamente com base nas regras definidas.",
    icon: Building2,
  },
  {
    number: "03",
    title: "Gerencie Tarefas",
    description:
      "Acompanhe o andamento, receba alertas de prazos e garanta que todas as entregas sejam concluídas no tempo certo.",
    icon: ListChecks,
  },
]

const stats = [
  { value: "500+", label: "Escritórios ativos" },
  { value: "10.000+", label: "Clientes gerenciados" },
  { value: "99,9%", label: "Uptime garantido" },
]

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-100">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb] transition-colors group-hover:bg-[#2563eb] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const session = localStorage.getItem("cr_session")
    if (session) {
      try {
        const parsed = JSON.parse(session)
        if (parsed.userId && parsed.orgId) {
          router.replace("/app")
        }
      } catch {
        // ignore
      }
    }
  }, [router])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 to-white py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-[#2563eb]">
              <CheckCircle2 className="h-4 w-4" />
              Plataforma criada para escritórios contábeis brasileiros
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Padronize a operação do{" "}
              <span className="text-[#2563eb]">seu escritório</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed sm:text-xl">
              Nenhum cliente sem processo. Nenhum prazo esquecido. Com o Company Radar, sua equipe trabalha de forma organizada, padronizada e com total controle sobre entregas e obrigações.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] h-12 px-8 text-base"
                asChild
              >
                <Link href="/register">
                  Começar gratuitamente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
                asChild
              >
                <Link href="/recursos">Ver recursos</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-blue-100/30 blur-3xl" />
      </section>

      {/* How it works */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2563eb]">
              Como funciona
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Três passos para organizar seu escritório
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={step.number} className="relative">
                {idx < steps.length - 1 && (
                  <div className="absolute top-10 left-[calc(50%+2rem)] hidden h-0.5 w-[calc(100%-4rem)] bg-gradient-to-r from-blue-200 to-blue-100 md:block" />
                )}
                <div className="relative rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                  <span className="text-5xl font-bold text-blue-100">{step.number}</span>
                  <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563eb] text-white">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-[#2563eb] sm:text-5xl">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2563eb]">
              Recursos
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Tudo que seu escritório precisa em um só lugar
            </h2>
            <p className="mt-4 text-gray-500">
              Ferramentas pensadas para a rotina de escritórios de contabilidade no Brasil.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#2563eb] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Clock className="mx-auto h-12 w-12 text-blue-200" />
            <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
              Pare de perder prazos. Comece agora.
            </h2>
            <p className="mt-4 text-lg text-blue-100 leading-relaxed">
              Junte-se a mais de 500 escritórios contábeis que já padronizaram sua operação com o Company Radar.
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
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base border-blue-300 text-white hover:bg-blue-600"
                asChild
              >
                <Link href="/planos">Ver planos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário. A plataforma não substitui a orientação profissional contábil, jurídica ou fiscal.
          </p>
        </div>
      </section>
    </div>
  )
}
