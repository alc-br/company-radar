export default function TermsPage() {
  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Termos de Uso</h1>
        <p className="mt-2 text-sm text-gray-500">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="mt-10 space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Aceitação dos Termos</h2>
            <p className="mt-3">
              Ao acessar e utilizar o Company Radar, você concorda com estes Termos de Uso e com nossa Política de Privacidade. Se você não concordar com qualquer parte destes termos, não utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Descrição do Serviço</h2>
            <p className="mt-3">
              O Company Radar é uma plataforma SaaS de organização operacional destinada a escritórios de contabilidade e áreas afins. A plataforma permite a gestão de clientes, templates de procedimentos, tarefas, documentos, calendário e relatórios.
            </p>
            <p className="mt-3">
              O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário. A plataforma não substitui a orientação profissional contábil, jurídica ou fiscal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Cadastro e Conta</h2>
            <p className="mt-3">
              Para utilizar a plataforma, é necessário criar uma conta com informações verdadeiras e atualizadas. O usuário é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Planos e Cobrança</h2>
            <p className="mt-3">
              Os planos e valores estão disponíveis na página de planos da plataforma. O Company Radar reserva-se o direito de alterar os preços com aviso prévio de 30 dias. O ciclo de cobrança pode ser mensal ou anual, conforme escolha do usuário.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Uso Aceitável</h2>
            <p className="mt-3">
              O usuário concorda em utilizar a plataforma de forma lícita e em conformidade com a legislação brasileira. É vedado o uso da plataforma para atividades ilícitas, violação de direitos de terceiros ou qualquer ação que possa danificar a plataforma ou seus usuários.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Propriedade Intelectual</h2>
            <p className="mt-3">
              Todo o conteúdo, marca, logotipo, design e software do Company Radar são propriedade intelectual da empresa. É vedada a reprodução, distribuição ou modificação sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Limitação de Responsabilidade</h2>
            <p className="mt-3">
              O Company Radar não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso da plataforma. A plataforma é fornecida "como está", sem garantias de qualquer tipo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Disponibilidade do Serviço</h2>
            <p className="mt-3">
              O Company Radar se esforça para manter a plataforma disponível 24 horas por dia, 7 dias por semana. No entanto, não garante que o serviço será ininterrupto ou livre de erros. Manutenções programadas serão comunicadas com antecedência.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">9. Encerramento da Conta</h2>
            <p className="mt-3">
              O usuário pode solicitar o encerramento de sua conta a qualquer momento. Após o cancelamento, os dados serão mantidos por 30 dias para possível reativação e, após esse período, serão excluídos permanentemente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">10. Legislação e Foro</h2>
            <p className="mt-3">
              Estes termos são regidos pelas leis da República Federativa do Brasil. Para resolução de conflitos, fica eleito o foro da comarca da sede da empresa, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">11. Contato</h2>
            <p className="mt-3">
              Para dúvidas sobre estes Termos de Uso, entre em contato pelo e-mail: contato@companyradar.com.br.
            </p>
          </section>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            O Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário.
          </p>
        </div>
      </div>
    </div>
  )
}
