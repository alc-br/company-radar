import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const existing = await db.client.count()
    if (existing > 0) return NextResponse.json({ success: true, message: 'Dados ja existem' })

    const org = await db.organization.create({
      data: { name: 'Escritorio Contabil Demo', cnpj: '12.345.678/0001-90', email: 'contato@demo.com.br', phone: '(11) 99999-0000', plan: 'professional' },
    })

    const memberNames = ['Ana Costa', 'Carlos Silva', 'Juliana Rocha', 'Pedro Almeida', 'Mariana Lopes']
    const memberEmails = ['ana@demo.com.br', 'carlos@demo.com.br', 'juliana@demo.com.br', 'pedro@demo.com.br', 'mariana@demo.com.br']
    const memberRoles = ['owner', 'admin', 'gestor', 'collaborator', 'collaborator']

    for (let i = 0; i < memberNames.length; i++) {
      await db.orgMember.create({
        data: { organizationId: org.id, name: memberNames[i], email: memberEmails[i], role: memberRoles[i] },
      })
    }

    const clientData = [
      { name: 'Tech Solutions Ltda', cnpj: '11.111.111/0001-01', tradeName: 'TechSol', email: 'financeiro@techsol.com.br', phone: '(11) 3456-7890', city: 'Sao Paulo', state: 'SP', segment: 'Tecnologia' },
      { name: 'Comercio ABC Ltda', cnpj: '22.222.222/0001-02', tradeName: 'ABC Comercio', email: 'contato@abc.com.br', phone: '(21) 2345-6789', city: 'Rio de Janeiro', state: 'RJ', segment: 'Comercio' },
      { name: 'Industria Mega S/A', cnpj: '33.333.333/0001-03', tradeName: 'Mega Industrial', email: 'dir@megaind.com.br', phone: '(31) 3456-1234', city: 'Belo Horizonte', state: 'MG', segment: 'Industria' },
      { name: 'Servicos Gerais XYZ', cnpj: '44.444.444/0001-04', tradeName: 'XYZ Servicos', email: 'admin@xyz.com.br', phone: '(41) 3321-9876', city: 'Curitiba', state: 'PR', segment: 'Servicos' },
      { name: 'Agro Pampa Ltda', cnpj: '55.555.555/0001-05', tradeName: 'Pampa Agro', email: 'contato@pampaagro.com.br', phone: '(51) 3456-5678', city: 'Porto Alegre', state: 'RS', segment: 'Agropecuaria' },
      { name: 'Construtora Horizonte', cnpj: '66.666.666/0001-06', tradeName: 'Horizonte', email: 'obra@horizonte.com.br', phone: '(48) 3321-4321', city: 'Florianopolis', state: 'SC', segment: 'Construcao' },
      { name: 'Restaurante Sabor & Arte', cnpj: '77.777.777/0001-07', tradeName: 'Sabor Arte', email: 'chef@saborarte.com.br', phone: '(62) 3456-8765', city: 'Goiania', state: 'GO', segment: 'Alimentacao' },
      { name: 'Logistica Express Ltda', cnpj: '88.888.888/0001-08', tradeName: 'LogExpress', email: 'op@logexpress.com.br', phone: '(19) 3456-2345', city: 'Campinas', state: 'SP', segment: 'Logistica' },
      { name: 'Clinica Bem Estar', cnpj: '99.999.999/0001-09', tradeName: 'Bem Estar Saude', email: 'secretaria@bemestar.com.br', phone: '(85) 3321-6543', city: 'Fortaleza', state: 'CE', segment: 'Saude' },
      { name: 'Educacao Futuro Ltda', cnpj: '10.010.010/0001-10', tradeName: 'Futuro Educacao', email: 'dir@futuroedu.com.br', phone: '(91) 3456-7891', city: 'Belem', state: 'PA', segment: 'Educacao' },
      { name: 'Imobiliaria Casa Nova', cnpj: '11.012.013/0001-11', tradeName: 'Casa Nova', email: 'vendas@casanova.com.br', phone: '(65) 3321-1234', city: 'Cuiaba', state: 'MT', segment: 'Imobiliario' },
      { name: 'Transporte Rapido Ltda', cnpj: '12.013.014/0001-12', tradeName: 'Rapido Trans', email: 'logistica@rapidotrans.com.br', phone: '(92) 3456-5679', city: 'Manaus', state: 'AM', segment: 'Transporte' },
      { name: 'Studio Design Criativo', cnpj: '13.014.015/0001-13', tradeName: 'Design Criativo', email: 'contato@designcriativo.com.br', phone: '(71) 3321-9877', city: 'Salvador', state: 'BA', segment: 'Design' },
      { name: 'Farmacia Saude Total', cnpj: '14.015.016/0001-14', tradeName: 'Saude Total', email: 'farmacia@saudetotal.com.br', phone: '(81) 3456-8766', city: 'Recife', state: 'PE', segment: 'Saude' },
      { name: 'Advocacia Direito & Cia', cnpj: '15.016.017/0001-15', tradeName: 'Direito Cia', email: 'socio@direitocia.com.br', phone: '(86) 3321-4322', city: 'Teresina', state: 'PI', segment: 'Juridico' },
    ]

    const clients: { id: string }[] = []
    for (const c of clientData) {
      const client = await db.client.create({
        data: { ...c, organizationId: org.id },
      })
      clients.push(client)
    }

    for (const client of clients) {
      const numContacts = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < numContacts; i++) {
        await db.contact.create({
          data: {
            clientId: client.id,
            name: `Contato ${i + 1} de ${clientData[clients.indexOf(client)]?.tradeName || 'Empresa'}`,
            email: `contato${i + 1}@${clientData[clients.indexOf(client)]?.tradeName?.toLowerCase().replace(/\s/g, '') || 'empresa'}.com.br`,
            role: i === 0 ? 'Socio Administrador' : 'Gerente Financeiro',
          },
        })
      }
    }

    const templates = [
      { name: 'Abertura Mensal - Fiscal', description: 'Rotina mensal de obrigacoes fiscais', category: 'Fiscal', department: 'Fiscal', steps: [{ t: 'Coletar notas fiscais', done: false }, { t: 'Apurar ICMS/ISS', done: false }, { t: 'Gerar SPED Fiscal', done: false }, { t: 'Transmitir guias', done: false }] },
      { name: 'Folha de Pagamento', description: 'Processamento mensal da folha', category: 'Pessoal', department: 'Pessoal', steps: [{ t: 'Receber ponto dos colaboradores', done: false }, { t: 'Calcular folha', done: false }, { t: 'Gerar eSocial', done: false }, { t: 'Fechar folha', done: false }] },
      { name: 'Balanco Patrimonial Anual', description: 'Elaboracao do balanco anual', category: 'Contabil', department: 'Contabil', steps: [{ t: 'Levantar saldos', done: false }, { t: 'Conciliar bancario', done: false }, { t: 'Montar DRE e BP', done: false }, { t: 'Assinar balanco', done: false }] },
      { name: 'DCTF Mensal', description: 'Declaracao de debitos e creditos tributarios', category: 'Fiscal', department: 'Fiscal', steps: [{ t: 'Compilar dados fiscais', done: false }, { t: 'Preencher DCTF', done: false }, { t: 'Transmitir', done: false }] },
      { name: 'EFD-Reinf', description: 'Escrituracao Fiscal Digital Reinf', category: 'Fiscal', department: 'Fiscal', steps: [{ t: 'Coletar infos de retencoes', done: false }, { t: 'Gerar arquivo Reinf', done: false }, { t: 'Transmitir', done: false }] },
      { name: 'Societario - Alteracao Contratual', description: 'Processo de alteracao contratual', category: 'Societario', department: 'Societario', steps: [{ t: 'Receber dados da alteracao', done: false }, { t: 'Redigir minuta', done: false }, { t: 'Assinar contrato', done: false }, { t: 'Registrar na junta', done: false }] },
    ]

    const createdTemplates: { id: string }[] = []
    for (const t of templates) {
      const tpl = await db.template.create({
        data: {
          organizationId: org.id,
          name: t.name,
          description: t.description,
          category: t.category,
          department: t.department,
          steps: JSON.stringify(t.steps),
          isPublished: Math.random() > 0.3,
        },
      })
      createdTemplates.push(tpl)
    }

    const statuses = ['pending', 'in_progress', 'completed', 'overdue']
    const priorities = ['low', 'medium', 'high', 'urgent']
    const taskTitles = [
      'Apurar ICMS mes atual', 'Gerar SPED Fiscal', 'Processar folha de pagamento', 'Emitir guia de INSS',
      'Conciliacao bancaria', 'Gerar DCTF mensal', 'Verificar eSocial eventos S-1200', 'Emitir relatorio de receitas',
      'Enviar balancete ao cliente', 'Apurar PIS/COFINS', 'Verificar retencoes de IR', 'Transmitir EFD-Contribuicoes',
      'Processar 13o salario proporcional', 'Declaracao de IRPJ trimestral', 'Verificar ativo imobilizado',
      'Emitir relatorio de custos', 'Registrar despesas operacionais', 'Verificar impostos a recolher',
      'Processar ferias coletivas', 'Verificar adiantamento de clientes', 'Reconciliar cartoes de credito',
      'Emitir nota fiscal de servico', 'Verificar estoque', 'Gerar relatorio de inadimplencia',
      'Atualizar cadastro de fornecedores', 'Verificar ICMS-ST', 'Processar rescisao de contrato',
      'Gerar livro diario', 'Emitir DARF de IRPJ', 'Verificar FGTS',
    ]

    const now = new Date()
    for (let i = 0; i < 40; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)]
      const daysOffset = Math.floor(Math.random() * 60) - 30
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + daysOffset)

      const status = daysOffset < -3 ? 'overdue' : statuses[Math.floor(Math.random() * statuses.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      const templateId = Math.random() > 0.4 ? createdTemplates[Math.floor(Math.random() * createdTemplates.length)].id : null
      const assignees = ['Ana Costa', 'Carlos Silva', 'Juliana Rocha', 'Pedro Almeida', 'Mariana Lopes']

      const checkItems = Math.floor(Math.random() * 5)
      const checklist = Array.from({ length: checkItems }, (_, j) => ({
        text: `Item ${j + 1} da tarefa`,
        done: Math.random() > 0.5,
      }))

      await db.task.create({
        data: {
          organizationId: org.id,
          clientId: client.id,
          title: taskTitles[i] || `Tarefa ${i + 1}`,
          status,
          priority,
          dueDate,
          assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
          templateId,
          checklist: JSON.stringify(checklist),
        },
      })
    }

    const docTypes = ['Contrato Social', 'Balanco Patrimonial', 'DRE', 'Guia de Recolhimento', 'Nota Fiscal', 'Relatorio Trimestral', 'Alteracao Contratual', 'Procuracao']
    for (let i = 0; i < 20; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)]
      const daysOffset = Math.floor(Math.random() * 90) - 30
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + daysOffset)

      await db.document.create({
        data: {
          organizationId: org.id,
          clientId: client.id,
          name: docTypes[Math.floor(Math.random() * docTypes.length)],
          type: docTypes[Math.floor(Math.random() * docTypes.length)],
          status: Math.random() > 0.3 ? 'received' : 'pending',
          dueDate,
        },
      })
    }

    const notifMessages = [
      { title: 'Tarefa atrasada', message: 'Apurar ICMS - Tech Solutions esta atrasada', type: 'warning' },
      { title: 'Novo cliente cadastrado', message: 'Studio Design Criativo adicionado a carteira', type: 'info' },
      { title: 'Documento pendente', message: 'Balanco Patrimonial da Industria Mega ainda nao foi recebido', type: 'warning' },
      { title: 'Template publicado', message: 'EFD-Reinf agora esta disponivel para aplicacao', type: 'success' },
      { title: 'Prazo proximo', message: 'DCTF mensal vence em 2 dias', type: 'urgent' },
      { title: 'Concluido', message: 'Folha de Pagamento de Maio processada com sucesso', type: 'success' },
    ]

    for (const n of notifMessages) {
      await db.notification.create({ data: n, read: Math.random() > 0.6 })
    }

    return NextResponse.json({ success: true, message: 'Dados de exemplo criados com sucesso' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Erro no seed' }, { status: 500 })
  }
}
