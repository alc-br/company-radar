'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Search,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'

interface FaqItem {
  question: string
  answer: string
}

interface FaqSection {
  title: string
  icon: React.ElementType
  items: FaqItem[]
}

const sections: FaqSection[] = [
  {
    title: 'Primeiros passos',
    icon: BookOpen,
    items: [
      {
        question: 'Como cadastrar meu primeiro cliente',
        answer:
          'Acesse o menu lateral e clique em "Empresas", depois no botão "Nova empresa". Preencha os dados como razão social, CNPJ, regime tributário e contatos. Você pode importar clientes em massa via planilha CSV a partir da página de empresas.',
      },
      {
        question: 'Como criar um template',
        answer:
          'Vá em "Templates" no menu lateral e clique em "Novo template". Defina o nome, categoria e periodicidade. Adicione as etapas do procedimento e, dentro de cada etapa, crie as tarefas com prazos e responsáveis. Quando estiver pronto, publique o template para poder aplicá-lo nos clientes.',
      },
      {
        question: 'Como aplicar um template',
        answer:
          'Na página de uma empresa, clique em "Aplicar template". Selecione o template desejado, defina a competência (mês/ano de referência) e confirme. Todas as etapas e tarefas do template serão criadas automaticamente para aquele cliente.',
      },
      {
        question: 'Como configurar minha equipe',
        answer:
          'Acesse "Equipe" no menu lateral para convidar novos membros. Cada membro receberá um convite por e-mail. Você pode definir o cargo e as permissões de acesso de cada integrante nas configurações da organização.',
      },
    ],
  },
  {
    title: 'Tarefas e prazos',
    icon: HelpCircle,
    items: [
      {
        question: 'Como gerenciar tarefas',
        answer:
          'Na página "Tarefas" você pode visualizar todas as tarefas em formato de lista ou Kanban. Filtre por status, prioridade, responsável ou cliente. Clique em uma tarefa para ver detalhes, alterar status ou adicionar comentários e anexos.',
      },
      {
        question: 'Como configurar recorrências',
        answer:
          'Ao criar ou editar um template, defina a periodicidade (mensal, trimestral, semestral ou anual). Quando o template for aplicado, as tarefas serão geradas automaticamente na competência correta conforme a recorrência configurada.',
      },
      {
        question: 'Como usar a fila prioritária',
        answer:
          'Acesse "Meu Trabalho" no menu para ver sua fila pessoal de tarefas. Elas são organizadas automaticamente por prioridade e data de vencimento. Marque tarefas como concluídas diretamente pela fila para manter seu fluxo de trabalho organizado.',
      },
      {
        question: 'O que fazer quando uma tarefa atrasa',
        answer:
          'Tarefas atrasadas são destacadas em vermelho no dashboard e na lista de tarefas. Você pode reabrir a tarefa, alterar o prazo ou adicionar um comentário explicando o motivo do atraso. O sistema também envia alertas automáticos para que a equipe possa agir rapidamente.',
      },
    ],
  },
  {
    title: 'Documentos',
    icon: Search,
    items: [
      {
        question: 'Como solicitar documentos do cliente',
        answer:
          'Na página da empresa, acesse a seção "Documentos" e clique em "Solicitar documentos". Selecione os tipos de documentos necessários, defina a competência e uma data limite. O cliente receberá a solicitação no portal.',
      },
      {
        question: 'Como aprovar documentos',
        answer:
          'Quando o cliente enviar documentos pelo portal, eles aparecerão na Central de Documentos com status "Pendente". Revise o arquivo e altere o status para "Aprovado" ou "Rejeitado", adicionando um comentário se necessário.',
      },
      {
        question: 'Como configurar tipos de documento',
        answer:
          'Em "Configurações" você pode cadastrar os tipos de documento utilizados pelo seu escritório, como guias, balancetes, contratos e comprovantes. Defina formatos aceitos (PDF, XLS, JPG) e se o documento possui data de validade.',
      },
    ],
  },
  {
    title: 'Portal do cliente',
    icon: MessageSquare,
    items: [
      {
        question: 'Como conceder acesso ao portal',
        answer:
          'Na página da empresa, clique em "Configurações" e depois em "Portal". Ative o acesso ao portal e adicione os contatos do cliente que deverão ter acesso. Cada contato receberá um link de acesso seguro por e-mail.',
      },
      {
        question: 'O que o cliente vê',
        answer:
          'O cliente visualiza tarefas atribuídas a ele, solicitações de documentos, comunicados do escritório e um cronograma com os próximos prazos. Ele não tem acesso a informações de outros clientes nem a dados internos do escritório.',
      },
      {
        question: 'Como o cliente envia documentos',
        answer:
          'Pelo portal do cliente, na seção "Documentos", o cliente visualiza as solicitações pendentes e pode enviar arquivos diretamente. O escritório recebe a notificação e pode aprovar ou rejeitar cada documento enviado.',
      },
    ],
  },
  {
    title: 'Conta e assinatura',
    icon: HelpCircle,
    items: [
      {
        question: 'Como alterar meu plano',
        answer:
          'Acesse "Assinatura" no menu lateral para ver seu plano atual e as opções disponíveis. Clique em "Alterar plano" para fazer upgrade ou downgrade. A alteração entra em vigor imediatamente e o valor é proporcional ao período restante.',
      },
      {
        question: 'Como gerenciar equipe',
        answer:
          'Em "Equipe" você pode convidar novos membros, remover acessos e alterar permissões. Cada membro pode ser definido como Administrador ou Colaborador. Administradores podem gerenciar a organização e outros membros.',
      },
      {
        question: 'Como exportar dados',
        answer:
          'Na página de "Relatórios" você pode exportar relatórios em CSV e XLSX. Além disso, é possível exportar a lista de clientes e tarefas diretamente das respectivas páginas usando o botão de exportação disponível no topo da listagem.',
      },
    ],
  },
]

export default function AjudaPage() {
  const [search, setSearch] = useState('')
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['Primeiros passos']))
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections
    const q = search.toLowerCase()
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [search])

  function toggleSection(title: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  function toggleItem(question: string) {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(question)) next.delete(question)
      else next.add(question)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Central de Ajuda</h1>
        <p className="text-sm text-muted-foreground">
          Encontre respostas e recursos para usar o Company Radar.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar na Central de Ajuda..."
          className="h-10 pl-9 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* FAQ Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const SectionIcon = section.icon
          const isOpen = openSections.has(section.title)
          return (
            <div
              key={section.title}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <button
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center gap-3 p-4 sm:p-6 text-left"
              >
                <SectionIcon className="h-5 w-5 shrink-0 text-[#2563eb]" />
                <span className="flex-1 text-base font-semibold text-gray-900">
                  {section.title}
                </span>
                <span className="text-xs text-muted-foreground mr-1">
                  {section.items.length}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="pt-3 space-y-1">
                    {section.items.map((item) => {
                      const itemOpen = openItems.has(item.question)
                      return (
                        <div key={item.question} className="rounded-lg">
                          <button
                            onClick={() => toggleItem(item.question)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {itemOpen ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="flex-1">{item.question}</span>
                          </button>
                          {itemOpen && (
                            <div className="ml-6 mr-3 mb-2 rounded-lg bg-gray-50 px-4 py-3">
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredSections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium">Nenhum resultado encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tente buscar com outros termos.
            </p>
          </div>
        )}
      </div>

      {/* Footer support link */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
        <h3 className="text-base font-semibold text-gray-900">Precisa de mais ajuda?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nossa equipe está pronta para ajudar.
        </p>
        <a
          href="mailto:suporte@companyradar.com.br"
          className="mt-3 inline-block text-sm font-medium text-[#2563eb] hover:underline"
        >
          suporte@companyradar.com.br
        </a>
      </div>
    </div>
  )
}
