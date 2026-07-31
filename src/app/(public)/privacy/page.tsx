export default function PrivacyPage() {
  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-gray-500">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="mt-10 space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. Introdução</h2>
            <p className="mt-3">
              A presente Política de Privacidade descreve como o Company Radar coleta, utiliza, armazena e protege os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. Dados Coletados</h2>
            <p className="mt-3">Coletamos os seguintes tipos de dados:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, e-mail, senha (armazenada de forma criptografada), telefone.</li>
              <li><strong>Dados da organização:</strong> razão social, CNPJ, endereço, dados de faturamento.</li>
              <li><strong>Dados operacionais:</strong> informações de clientes, tarefas, documentos e templates inseridos pelo usuário.</li>
              <li><strong>Dados de uso:</strong> logs de acesso, ações realizadas na plataforma, endereço IP e dados do navegador.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. Finalidade do Tratamento</h2>
            <p className="mt-3">Os dados são utilizados para:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Prestar os serviços da plataforma de forma adequada.</li>
              <li>Enviar notificações operacionais e comunicados.</li>
              <li>Processar cobranças e gerenciar a assinatura.</li>
              <li>Garantir a segurança da plataforma e dos dados.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. Compartilhamento de Dados</h2>
            <p className="mt-3">
              O Company Radar não comercializa, aluga ou compartilha dados pessoais com terceiros para fins de marketing. Os dados podem ser compartilhados apenas com:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li><strong>Prestadores de serviço:</strong> processadores de pagamento (Stripe), infraestrutura em nuvem, com contratos de proteção de dados.</li>
              <li><strong>Obrigações legais:</strong> quando exigido por lei, decisão judicial ou requisição de autoridade competente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. Segurança dos Dados</h2>
            <p className="mt-3">
              Adotamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais, incluindo criptografia em trânsito (TLS), criptografia em repouso, controle de acesso baseado em funções (RBAC), backups automáticos e monitoramento contínuo de segurança.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. Retenção de Dados</h2>
            <p className="mt-3">
              Os dados são mantidos pelo tempo necessário para a prestação dos serviços e o cumprimento de obrigações legais. Após o encerramento da conta, os dados são mantidos por 30 dias e, em seguida, excluídos permanentemente, salvo exigência legal em contrário.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. Direitos do Titular</h2>
            <p className="mt-3">Em conformidade com a LGPD, o titular dos dados tem os seguintes direitos:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Confirmação da existência de tratamento.</li>
              <li>Acesso aos dados pessoais.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade dos dados.</li>
              <li>Eliminação dos dados tratados com o consentimento.</li>
              <li>Informação sobre compartilhamento de dados.</li>
              <li>Revogação do consentimento.</li>
            </ul>
            <p className="mt-3">
              Para exercer seus direitos, entre em contato pelo e-mail: contato@companyradar.com.br.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">8. Cookies e Tecnologias Semelhantes</h2>
            <p className="mt-3">
              Utilizamos cookies essenciais para o funcionamento da plataforma e cookies de análise para melhorar a experiência do usuário. O usuário pode gerenciar suas preferências de cookies nas configurações do navegador.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">9. Alterações nesta Política</h2>
            <p className="mt-3">
              Esta Política de Privacidade pode ser atualizada periodicamente. Mudanças significativas serão comunicadas por e-mail ou notificação na plataforma. Recomendamos a leitura periódica deste documento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">10. Contato</h2>
            <p className="mt-3">
              Para dúvidas, solicitações ou reclamações relacionadas a esta Política de Privacidade, entre em contato com o nosso Encarregado de Proteção de Dados (DPO) pelo e-mail: contato@companyradar.com.br.
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
