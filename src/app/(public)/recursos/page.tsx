"use client"

import Link from "next/link"
import {
  Building2,
  LayoutTemplate,
  ListChecks,
  FolderOpen,
  CalendarDays,
  Globe,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeatureSection {
  icon: LucideIcon
  title: string
  subtitle: string
  description: string
  highlights: string[]
  color: string
  bgColor: string
}

const sections: FeatureSection[] = [
  {
    icon: Building2,
    title: "Carteira de Clientes",
    subtitle: "Cadastro completo e organizado",
    description:
      "Mantenha todos os dados dos seus clientes centralizados e atualizados. Cadastre CNPJ, inscrições estaduais e municipais, regime tributário, CNAE, tamanho da empresa e muito mais. Organize por tags, segmentos e status para encontrar qualquer informação rapidamente.",
    highlights: [
      "Cadastro completo com dados societários e fiscais",
      "Classificação por tags e segmentos personalizados",
      "Gestão de múltiplos contatos por cliente",
      "Histórico de alterações e auditoria integrada",
      "Importação e exportação de dados em massa",
    ],
    color: "text-[#2563eb]",
    bgColor: "bg-blue-50",
  },
  {
    icon: LayoutTemplate,
    title: "Templates Operacionais",
    subtitle: "Procedimentos padronizados",
    description:
      "Crie e gerencie templates de procedimentos que representam as obrigações e processos do seu escritório. Defina etapas, tarefas, prazos e responsáveis. Versionamento automático para garantir que mudanças sejam rastreadas sem impactar processos em andamento.",
    highlights: [
      "Editor visual de etapas e tarefas",
      "Versionamento com histórico completo",
      "Variáveis dinâmicas (competência, dados do cliente)",
      "Periodicidade automática: mensal, trimestral, anual",
      "Departamentos e responsáveis por etapa",
    ],
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    icon: ListChecks,
    title: "Tarefas e Prazos",
    subtitle: "Controle total de entregas",
    description:
      "Acompanhe todas as tarefas do escritório em um painel unificado. Visualize por status, prioridade, responsável, cliente ou data de vencimento. Receba alertas automáticos quando prazos estiverem próximos ou atrasados. Checklist integrado em cada tarefa.",
    highlights: [
      "Painel Kanban e visualização por lista",
      "Alertas de vencimento por e-mail e notificação",
      "Tarefas recorrentes geradas automaticamente",
      "Checklist de itens em cada tarefa",
      "Dependências entre tarefas",
    ],
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    icon: FolderOpen,
    title: "Central de Documentos",
    subtitle: "Documentos sob controle",
    description:
      "Receba, organize e valide documentos dos clientes em um único local. Crie solicitações de documentos por competência, defina formatos aceitos e acompanhe o status de cada entrega. Controle de validade automático para documentos com prazo de expiração.",
    highlights: [
      "Solicitação de documentos por competência",
      "Controle de validade e alertas de vencimento",
      "Tipos de documento personalizados por escritório",
      "Portal do cliente para envio autônomo",
      "Validação e aprovação com registro de auditoria",
    ],
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    icon: CalendarDays,
    title: "Calendário Compartilhado",
    subtitle: "Visão unificada de prazos",
    description:
      "Visualize todos os prazos, entregas e compromissos em um calendário integrado. Filtre por equipe, cliente ou tipo de evento. Configure feriados personalizados e receba uma visão clara dos próximos vencimentos para planejamento adequado.",
    highlights: [
      "Visão mensal, semanal e diária",
      "Filtros por equipe, cliente e tipo de evento",
      "Feriados nacionais e personalizados",
      "Integração automática com tarefas e prazos",
      "Exportação para iCal e Google Calendar",
    ],
    color: "text-rose-600",
    bgColor: "bg-rose-50",
  },
  {
    icon: Globe,
    title: "Portal do Cliente",
    subtitle: "Autonomia para o cliente",
    description:
      "Ofereça um portal exclusivo para seus clientes enviarem documentos, acompanharem o andamento de tarefas e acessarem informações relevantes. Reduza a dependência de e-mail e WhatsApp para troca de arquivos e informações.",
    highlights: [
      "Envio de documentos sem depender do contador",
      "Acompanhamento de status de obrigações",
      "Comunicação direta com a equipe do escritório",
      "Acesso seguro com token individual",
      "Visualização de tarefas visíveis no portal",
    ],
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  {
    icon: BarChart3,
    title: "Relatórios e Auditoria",
    subtitle: "Dados para decisões",
    description:
      "Gere relatórios detalhados sobre produtividade da equipe, status de tarefas, prazos cumpridos e muito mais. Todas as ações são registradas em log de auditoria para conformidade e rastreabilidade completa.",
    highlights: [
      "Relatórios de produtividade por colaborador",
      "Métricas de prazos cumpridos e atrasados",
      "Log completo de ações (auditoria)",
      "Exportação em CSV e XLSX",
      "Dashboard com indicadores em tempo real",
    ],
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    icon: ShieldCheck,
    title: "Segurança e LGPD",
    subtitle: "Proteção de dados garantida",
    description:
      "A segurança dos dados é prioridade. Criptografia de ponta a ponta, backups automáticos, controle de acesso granular e conformidade com a Lei Geral de Proteção de Dados (LGPD). Seus dados e dos seus clientes estão protegidos.",
    highlights: [
      "Criptografia TLS para dados em trânsito",
      "Backup automático diário",
      "Controle de acesso por cargo e permissão",
      "Conformidade com a LGPD",
      "Infraestrutura em nuvem com certificação SOC 2",
    ],
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
]

function FeatureSectionCard({ section, index }: { section: FeatureSection; index: number }) {
  const isReversed = index % 2 !== 0
  const Icon = section.icon

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-2 ${isReversed ? "lg:grid-flow-dense" : ""}`}>
          <div className={isReversed ? "lg:col-start-2" : ""}>
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${section.bgColor} ${section.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">{section.title}</h2>
            <p className="mt-1 text-sm font-medium text-[#2563eb]">{section.subtitle}</p>
            <p className="mt-4 text-gray-600 leading-relaxed">{section.description}</p>
            <ul className="mt-6 space-y-3">
              {section.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3">
                  <Check className={`mt-0.5 h-5 w-5 flex-shrink-0 ${section.color}`} />
                  <span className="text-sm text-gray-600">{h}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={isReversed ? "lg:col-start-1" : ""}>
            <div className={`rounded-2xl ${section.bgColor} p-8 sm:p-12`}>
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${i === 1 ? "bg-emerald-400" : i === 2 ? "bg-amber-400" : "bg-blue-400"}`} />
                      <div className="h-3 w-32 rounded bg-gray-200" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <div className="h-2 w-20 rounded bg-gray-100" />
                      <div className="h-2 w-16 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur">
                <div>
                  <div className="h-2 w-24 rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
                </div>
                <div className={`h-8 w-20 rounded-lg ${section.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${section.color}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function RecursosPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#2563eb]">Recursos</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              Tudo para seu escritório funcionar com{" "}
              <span className="text-[#2563eb]">precisão</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Conheça cada módulo do Company Radar e descubra como ele pode transformar a operação do seu escritório contábil.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <div className="divide-y divide-gray-100">
        {sections.map((section, index) => (
          <FeatureSectionCard key={section.title} section={section} index={index} />
        ))}
      </div>

      {/* CTA */}
      <section className="bg-[#2563eb] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Pronto para organizar seu escritório?
            </h2>
            <p className="mt-4 text-lg text-blue-100 leading-relaxed">
              Comece a usar o Company Radar agora mesmo. Cadastro gratuito, sem necessidade de cartão de crédito.
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
