import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Clean existing data in correct order
    await db.taskComment.deleteMany()
    await db.taskChecklist.deleteMany()
    await db.task.deleteMany()
    await db.document.deleteMany()
    await db.calendarEvent.deleteMany()
    await db.userNotification.deleteMany()
    await db.auditLog.deleteMany()
    await db.contact.deleteMany()
    await db.clientTag.deleteMany()
    await db.client.deleteMany()
    await db.template.deleteMany()
    await db.orgMember.deleteMany()
    await db.subscription.deleteMany()
    await db.user.deleteMany()
    await db.organization.deleteMany()
    await db.tag.deleteMany()
    await db.department.deleteMany()
    await db.documentType.deleteMany()
    await db.plan.deleteMany()
    await db.fAQ.deleteMany()

    // ─── 1 User ───────────────────────────────────────────
    const user = await db.user.create({
      data: {
        id: 'user-default',
        email: 'ana@demo.com',
        passwordHash: Buffer.from('demo123').toString('base64'),
        name: 'Ana Costa',
        emailVerified: true,
        activeOrgId: 'org-default',
      },
    })

    // ─── 1 Organization ───────────────────────────────────
    const org = await db.organization.create({
      data: {
        id: 'org-default',
        name: 'Escritorio Contabil Demo',
        cnpj: '12.345.678/0001-90',
        email: 'contato@demo.com.br',
        phone: '(11) 99999-0000',
        plan: 'professional',
        settings: JSON.stringify({
          workingHours: { start: '08:00', end: '18:00' },
          timezone: 'America/Sao_Paulo',
          fiscalYearStart: '01',
          defaultTaskPriority: 'medium',
          notifications: { email: true, inApp: true },
        }),
      },
    })

    // ─── 5 OrgMembers ─────────────────────────────────────
    const memberData = [
      { id: 'member-1', userId: 'user-default', name: 'Ana Costa', email: 'ana@demo.com', role: 'owner', status: 'active' },
      { id: 'member-2', name: 'Carlos Silva', email: 'carlos@demo.com', role: 'admin', status: 'active' },
      { id: 'member-3', name: 'Juliana Rocha', email: 'juliana@demo.com', role: 'gestor', status: 'active' },
      { id: 'member-4', name: 'Pedro Almeida', email: 'pedro@demo.com', role: 'collaborator', status: 'active' },
      { id: 'member-5', name: 'Mariana Lopes', email: 'mariana@demo.com', role: 'collaborator', status: 'invited', inviteToken: 'inv-token-mariana' },
    ]
    await db.orgMember.createMany({ data: memberData.map(m => ({ ...m, organizationId: 'org-default' })) })

    // ─── 4 Tags ───────────────────────────────────────────
    const tagData = [
      { id: 'tag-priority', name: 'Prioritario', color: '#ef4444' },
      { id: 'tag-new', name: 'Novo Cliente', color: '#22c55e' },
      { id: 'tag-vip', name: 'VIP', color: '#a855f7' },
      { id: 'tag-regular', name: 'Regular', color: '#6b7280' },
    ]
    await db.tag.createMany({ data: tagData.map(t => ({ ...t, organizationId: 'org-default' })) })

    // ─── 4 Departments ────────────────────────────────────
    const deptData = [
      { id: 'dept-fiscal', name: 'Fiscal', description: 'Departamento fiscal e tributario' },
      { id: 'dept-contabil', name: 'Contabil', description: 'Departamento contabil' },
      { id: 'dept-pessoal', name: 'Pessoal', description: 'Departamento de pessoal e folha' },
      { id: 'dept-societario', name: 'Societario', description: 'Departamento societario e juridico' },
    ]
    await db.department.createMany({ data: deptData.map(d => ({ ...d, organizationId: 'org-default' })) })

    // ─── 5 DocumentTypes ──────────────────────────────────
    const docTypeData = [
      { id: 'doctype-contrato', name: 'Contrato Social', description: 'Contrato social da empresa', required: true },
      { id: 'doctype-balanco', name: 'Balanco Patrimonial', description: 'Balanco patrimonial anual', required: true },
      { id: 'doctype-dre', name: 'DRE', description: 'Demonstracao do resultado do exercicio', required: false },
      { id: 'doctype-guia', name: 'Guia de Recolhimento', description: 'Guias de impostos a recolher', required: false },
      { id: 'doctype-nota', name: 'Nota Fiscal', description: 'Notas fiscais de servicos', required: false },
    ]
    await db.documentType.createMany({ data: docTypeData.map(d => ({ ...d, organizationId: 'org-default' })) })

    // ─── 15 Clients with tags ─────────────────────────────
    const clientData = [
      { id: 'client-1', name: 'Tech Solutions Ltda', cnpj: '11.111.111/0001-01', tradeName: 'TechSol', email: 'financeiro@techsol.com.br', phone: '(11) 3456-7890', city: 'Sao Paulo', state: 'SP', segment: 'Tecnologia', tags: ['tag-priority', 'tag-vip'] },
      { id: 'client-2', name: 'Comercio ABC Ltda', cnpj: '22.222.222/0001-02', tradeName: 'ABC Comercio', email: 'contato@abc.com.br', phone: '(21) 2345-6789', city: 'Rio de Janeiro', state: 'RJ', segment: 'Comercio', tags: ['tag-regular'] },
      { id: 'client-3', name: 'Industria Mega S/A', cnpj: '33.333.333/0001-03', tradeName: 'Mega Industrial', email: 'dir@megaind.com.br', phone: '(31) 3456-1234', city: 'Belo Horizonte', state: 'MG', segment: 'Industria', tags: ['tag-priority'] },
      { id: 'client-4', name: 'Servicos Gerais XYZ', cnpj: '44.444.444/0001-04', tradeName: 'XYZ Servicos', email: 'admin@xyz.com.br', phone: '(41) 3321-9876', city: 'Curitiba', state: 'PR', segment: 'Servicos', tags: ['tag-new'] },
      { id: 'client-5', name: 'Agro Pampa Ltda', cnpj: '55.555.555/0001-05', tradeName: 'Pampa Agro', email: 'contato@pampaagro.com.br', phone: '(51) 3456-5678', city: 'Porto Alegre', state: 'RS', segment: 'Agropecuaria', tags: ['tag-regular'] },
      { id: 'client-6', name: 'Construtora Horizonte', cnpj: '66.666.666/0001-06', tradeName: 'Horizonte', email: 'obra@horizonte.com.br', phone: '(48) 3321-4321', city: 'Florianopolis', state: 'SC', segment: 'Construcao', tags: ['tag-priority', 'tag-vip'] },
      { id: 'client-7', name: 'Restaurante Sabor & Arte', cnpj: '77.777.777/0001-07', tradeName: 'Sabor Arte', email: 'chef@saborarte.com.br', phone: '(62) 3456-8765', city: 'Goiania', state: 'GO', segment: 'Alimentacao', tags: ['tag-new'] },
      { id: 'client-8', name: 'Logistica Express Ltda', cnpj: '88.888.888/0001-08', tradeName: 'LogExpress', email: 'op@logexpress.com.br', phone: '(19) 3456-2345', city: 'Campinas', state: 'SP', segment: 'Logistica', tags: ['tag-regular'] },
      { id: 'client-9', name: 'Clinica Bem Estar', cnpj: '99.999.999/0001-09', tradeName: 'Bem Estar Saude', email: 'secretaria@bemestar.com.br', phone: '(85) 3321-6543', city: 'Fortaleza', state: 'CE', segment: 'Saude', tags: ['tag-vip'] },
      { id: 'client-10', name: 'Educacao Futuro Ltda', cnpj: '10.010.010/0001-10', tradeName: 'Futuro Educacao', email: 'dir@futuroedu.com.br', phone: '(91) 3456-7891', city: 'Belem', state: 'PA', segment: 'Educacao', tags: ['tag-new'] },
      { id: 'client-11', name: 'Imobiliaria Casa Nova', cnpj: '11.012.013/0001-11', tradeName: 'Casa Nova', email: 'vendas@casanova.com.br', phone: '(65) 3321-1234', city: 'Cuiaba', state: 'MT', segment: 'Imobiliario', tags: ['tag-regular'] },
      { id: 'client-12', name: 'Transporte Rapido Ltda', cnpj: '12.013.014/0001-12', tradeName: 'Rapido Trans', email: 'logistica@rapidotrans.com.br', phone: '(92) 3456-5679', city: 'Manaus', state: 'AM', segment: 'Transporte', tags: ['tag-priority'] },
      { id: 'client-13', name: 'Studio Design Criativo', cnpj: '13.014.015/0001-13', tradeName: 'Design Criativo', email: 'contato@designcriativo.com.br', phone: '(71) 3321-9877', city: 'Salvador', state: 'BA', segment: 'Design', tags: ['tag-new', 'tag-vip'] },
      { id: 'client-14', name: 'Farmacia Saude Total', cnpj: '14.015.016/0001-14', tradeName: 'Saude Total', email: 'farmacia@saudetotal.com.br', phone: '(81) 3456-8766', city: 'Recife', state: 'PE', segment: 'Saude', tags: ['tag-regular'] },
      { id: 'client-15', name: 'Advocacia Direito & Cia', cnpj: '15.016.017/0001-15', tradeName: 'Direito Cia', email: 'socio@direitocia.com.br', phone: '(86) 3321-4322', city: 'Teresina', state: 'PI', segment: 'Juridico', tags: ['tag-priority'] },
    ]

    for (const c of clientData) {
      const { tags: clientTags, ...clientFields } = c
      await db.client.create({
        data: {
          ...clientFields,
          organizationId: 'org-default',
          notes: `Cliente ${c.tradeName} - segmento ${c.segment}`,
          portalAccess: c.tags.includes('tag-vip'),
        },
      })
    }

    // Create ClientTag relations
    const clientTagEntries: { clientId: string; tagId: string }[] = []
    for (const c of clientData) {
      for (const tagId of c.tags) {
        clientTagEntries.push({ clientId: c.id, tagId })
      }
    }
    await db.clientTag.createMany({ data: clientTagEntries })

    // ─── 50 Contacts ──────────────────────────────────────
    const contactRoles = ['Socio Administrador', 'Gerente Financeiro', 'Diretor', 'Contador Interno', 'Assistente Administrativo']
    const contacts: { id: string; clientId: string; name: string; email: string; role: string }[] = []
    let contactIdx = 0
    for (const c of clientData) {
      const numContacts = 3 + (contactIdx % 3) // 3-5 contacts per client
      for (let i = 0; i < numContacts && contacts.length < 50; i++) {
        const cid = `contact-${contactIdx + 1}`
        contacts.push({
          id: cid,
          clientId: c.id,
          name: `${['Maria', 'Joao', 'Lucia', 'Fernando', 'Patricia', 'Ricardo', 'Camila', 'Bruno', 'Daniela', 'Eduardo'][contactIdx % 10]} ${['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida'][contactIdx % 10]}`,
          email: `${['maria', 'joao', 'lucia', 'fernando', 'patricia', 'ricardo', 'camila', 'bruno', 'daniela', 'eduardo'][contactIdx % 10]}.${contactIdx}@${c.tradeName?.toLowerCase().replace(/\s/g, '') || 'empresa'}.com.br`,
          role: contactRoles[i % contactRoles.length],
        })
        contactIdx++
      }
    }
    await db.contact.createMany({
      data: contacts.map(c => ({
        id: c.id,
        clientId: c.clientId,
        name: c.name,
        email: c.email,
        role: c.role,
        phone: `(${Math.floor(Math.random() * 90 + 10)}) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      })),
    })

    // ─── 6 Templates with proper steps JSON ───────────────
    const templateData = [
      {
        id: 'tpl-fiscal', name: 'Abertura Mensal - Fiscal', description: 'Rotina mensal de obrigacoes fiscais', category: 'Fiscal', departmentId: 'dept-fiscal', isPublished: true, version: 2,
        steps: JSON.stringify([
          { title: 'Coletar notas fiscais', description: 'Reunir todas as NF-e e NFC-e do periodo', responsible: 'Analista Fiscal', daysOffset: 1, documentType: 'doctype-nota', checklist: ['Verificar XML', 'Conferir valores', 'Separar por CFOP'] },
          { title: 'Apurar ICMS/ISS', description: 'Calcular impostos devidos no periodo', responsible: 'Contador Fiscal', daysOffset: 3, checklist: ['Apuracao ICMS', 'Apuracao ISS', 'Calculo PIS/COFINS'] },
          { title: 'Gerar SPED Fiscal', description: 'Gerar arquivo EFD-ICMS/IPI', responsible: 'Contador Fiscal', daysOffset: 5 },
          { title: 'Transmitir guias', description: 'Transmitir guias de pagamento via SEFAZ', responsible: 'Assistente', daysOffset: 7 },
        ]),
      },
      {
        id: 'tpl-folha', name: 'Folha de Pagamento', description: 'Processamento mensal da folha', category: 'Pessoal', departmentId: 'dept-pessoal', isPublished: true, version: 1,
        steps: JSON.stringify([
          { title: 'Receber ponto dos colaboradores', description: 'Importar marcacoes de ponto do periodo', responsible: 'RH', daysOffset: 1, checklist: ['Conferir batidas', 'Tratar excecoes', 'Aprovar banco de horas'] },
          { title: 'Calcular folha', description: 'Processar calculo da folha de pagamento', responsible: 'Departamento Pessoal', daysOffset: 3 },
          { title: 'Gerar eSocial', description: 'Transmitir eventos S-1200/S-1210', responsible: 'Departamento Pessoal', daysOffset: 5 },
          { title: 'Fechar folha', description: 'Conferir e fechar folha do mes', responsible: 'Gestor', daysOffset: 7 },
        ]),
      },
      {
        id: 'tpl-balanco', name: 'Balanco Patrimonial Anual', description: 'Elaboracao do balanco anual', category: 'Contabil', departmentId: 'dept-contabil', isPublished: true, version: 1,
        steps: JSON.stringify([
          { title: 'Levantar saldos', description: 'Obter saldos de todas as contas contabeis', responsible: 'Contador', daysOffset: 1 },
          { title: 'Conciliar bancario', description: 'Realizar conciliacao bancaria completa', responsible: 'Auxiliar Contabil', daysOffset: 3, checklist: ['Banco A', 'Banco B', 'Aplicacoes', 'Cartoes'] },
          { title: 'Montar DRE e BP', description: 'Elaborar DRE e Balanco Patrimonial', responsible: 'Contador Senior', daysOffset: 7 },
          { title: 'Assinar balanco', description: 'Obter assinaturas e publicar', responsible: 'Socio', daysOffset: 10 },
        ]),
      },
      {
        id: 'tpl-dctf', name: 'DCTF Mensal', description: 'Declaracao de debitos e creditos tributarios', category: 'Fiscal', departmentId: 'dept-fiscal', isPublished: true, version: 1,
        steps: JSON.stringify([
          { title: 'Compilar dados fiscais', description: 'Reunir todas as informacoes fiscais do periodo', responsible: 'Analista Fiscal', daysOffset: 1 },
          { title: 'Preencher DCTF', description: 'Preencher declaracao no programa Receita', responsible: 'Contador Fiscal', daysOffset: 3 },
          { title: 'Transmitir', description: 'Transmitir via ReceitaNet', responsible: 'Assistente', daysOffset: 5 },
        ]),
      },
      {
        id: 'tpl-reinf', name: 'EFD-Reinf', description: 'Escrituracao Fiscal Digital Reinf', category: 'Fiscal', departmentId: 'dept-fiscal', isPublished: false, version: 1,
        steps: JSON.stringify([
          { title: 'Coletar infos de retencoes', description: 'Obter dados de retencoes de servicos', responsible: 'Analista Fiscal', daysOffset: 1, checklist: ['Retencoes de ISS', 'Retencoes de IR', 'Retencoes de CSLL', 'Retencoes de PIS/COFINS'] },
          { title: 'Gerar arquivo Reinf', description: 'Gerar arquivo EFD-Reinf no layout vigente', responsible: 'Contador Fiscal', daysOffset: 3 },
          { title: 'Transmitir', description: 'Transmitir ao ambiente do SPED', responsible: 'Assistente', daysOffset: 5 },
        ]),
      },
      {
        id: 'tpl-societario', name: 'Societario - Alteracao Contratual', description: 'Processo de alteracao contratual', category: 'Societario', departmentId: 'dept-societario', isPublished: true, version: 1,
        steps: JSON.stringify([
          { title: 'Receber dados da alteracao', description: 'Reunir informacoes da alteracao contratual', responsible: 'Assistente Societario', daysOffset: 1 },
          { title: 'Redigir minuta', description: 'Elaborar minuta da alteracao contratual', responsible: 'Advogado Societario', daysOffset: 3, documentType: 'doctype-contrato' },
          { title: 'Assinar contrato', description: 'Obter assinaturas dos socios', responsible: 'Socio Administrador', daysOffset: 5 },
          { title: 'Registrar na junta', description: 'Protocolar alteracao na Junta Comercial', responsible: 'Assistente Societario', daysOffset: 10 },
        ]),
      },
    ]
    await db.template.createMany({
      data: templateData.map(t => ({ ...t, organizationId: 'org-default' })),
    })

    // ─── 50 Tasks with varied statuses/priorities/dates ──
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue']
    const priorities = ['low', 'medium', 'high', 'urgent']
    const assignees = ['Ana Costa', 'Carlos Silva', 'Juliana Rocha', 'Pedro Almeida', 'Mariana Lopes']
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
      'Transmitir DIRF', 'Apurar imposto de renda retido', 'VerificarSaldo de caixa',
      'Gerar relatorio de vendas', 'Processar adiantamento salarial', 'Verificar duplicatas a pagar',
      'Emitir boleto de cobranca', 'Registrar compra de equipamentos', 'Conferir livros fiscais',
      'Processar horas extras', 'Verificar creditos de PIS/COFINS', 'Gerar relatorio tributario',
      'Atualizar quadro societario', 'Verificar obrigacoes acessorias', 'Processar rescisao sem justa causa',
      'Emitir certidoes negativas', 'Gerar DAS Simples Nacional', 'Verificar saldo de IRPJ a compensar',
      'Processar competencia 13', 'Registrar provisoes contabeis',
    ]

    const now = new Date()
    const tasksWithChecklist: { taskId: string; items: { text: string; done: boolean; order: number }[] }[] = []
    const taskCommentData: { taskId: string; userName: string; content: string }[] = []

    for (let i = 0; i < 50; i++) {
      const client = clientData[i % clientData.length]
      const daysOffset = Math.floor(Math.random() * 60) - 30
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + daysOffset)

      let status = daysOffset < -3 ? 'overdue' : statuses[Math.floor(Math.random() * statuses.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      const templateId = Math.random() > 0.4 ? templateData[Math.floor(Math.random() * templateData.length)].id : null

      const completedAt = status === 'completed' ? new Date(dueDate.getTime() - 86400000) : null

      const taskId = `task-${i + 1}`

      await db.task.create({
        data: {
          id: taskId,
          organizationId: 'org-default',
          clientId: client.id,
          title: taskTitles[i] || `Tarefa ${i + 1}`,
          status,
          priority,
          dueDate,
          completedAt,
          assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
          templateId,
          parentTaskId: null,
          description: `Tarefa ${i + 1} para ${client.tradeName}`,
        },
      })

      // Add checklist items to ~30 tasks
      if (Math.random() > 0.4) {
        const numItems = Math.floor(Math.random() * 4) + 1
        const items: { text: string; done: boolean; order: number }[] = []
        for (let j = 0; j < numItems; j++) {
          items.push({
            text: `Item ${j + 1}: ${['Verificar', 'Coletar', 'Processar', 'Conferir', 'Transmitir'][j % 5]} dados`,
            done: status === 'completed' ? true : Math.random() > 0.5,
            order: j,
          })
        }
        tasksWithChecklist.push({ taskId, items })
      }

      // Add comments to ~20 tasks
      if (Math.random() > 0.6) {
        const numComments = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < numComments; j++) {
          taskCommentData.push({
            taskId,
            userName: assignees[Math.floor(Math.random() * assignees.length)],
            content: ['Em andamento', 'Aguardando documentos do cliente', 'Concluido com sucesso', 'Precisa de revisao', 'Prazo proximo, priorizar'][Math.floor(Math.random() * 5)],
          })
        }
      }
    }

    // Create all checklist items
    const allChecklistItems = tasksWithChecklist.flatMap(tc =>
      tc.items.map(item => ({ ...item, taskId: tc.taskId }))
    )
    if (allChecklistItems.length > 0) {
      await db.taskChecklist.createMany({ data: allChecklistItems })
    }

    // Create all comments
    if (taskCommentData.length > 0) {
      await db.taskComment.createMany({ data: taskCommentData })
    }

    // ─── 20 Documents ─────────────────────────────────────
    const docNames = ['Contrato Social', 'Balanco Patrimonial', 'DRE', 'Guia de Recolhimento', 'Nota Fiscal', 'Relatorio Trimestral', 'Alteracao Contratual', 'Procuracao']
    const docStatuses = ['pending', 'received', 'approved', 'rejected', 'expired']
    for (let i = 0; i < 20; i++) {
      const client = clientData[i % clientData.length]
      const daysOffset = Math.floor(Math.random() * 90) - 30
      const dueDate = new Date(now)
      dueDate.setDate(dueDate.getDate() + daysOffset)

      await db.document.create({
        data: {
          organizationId: 'org-default',
          clientId: client.id,
          name: `${docNames[i % docNames.length]} - ${client.tradeName}`,
          typeId: docTypeData[i % docTypeData.length].id,
          status: docStatuses[Math.floor(Math.random() * docStatuses.length)],
          dueDate,
          notes: i % 3 === 0 ? `Documento referente ao periodo ${new Date(now.getFullYear(), now.getMonth() - 1).toLocaleDateString('pt-BR')}` : null,
        },
      })
    }

    // ─── 3 CalendarEvents ─────────────────────────────────
    await db.calendarEvent.createMany({
      data: [
        { id: 'cal-1', organizationId: 'org-default', title: 'Reuniao de planejamento mensal', description: 'Reuniao com toda a equipe', startDate: new Date(now.getFullYear(), now.getMonth(), 5, 9, 0), endDate: new Date(now.getFullYear(), now.getMonth(), 5, 11, 0), type: 'meeting', color: '#3b82f6' },
        { id: 'cal-2', organizationId: 'org-default', title: 'Prazo DCTF', description: 'Ultimo dia para transmissao da DCTF', startDate: new Date(now.getFullYear(), now.getMonth(), 15), allDay: true, type: 'deadline', color: '#ef4444' },
        { id: 'cal-3', organizationId: 'org-default', title: 'Feriado - Dia do Contabil', description: 'Dia do Contabilista', startDate: new Date(now.getFullYear(), 4, 25), allDay: true, type: 'holiday', color: '#22c55e' },
      ],
    })

    // ─── 10 UserNotifications ─────────────────────────────
    await db.userNotification.createMany({
      data: [
        { id: 'notif-1', userId: 'user-default', title: 'Tarefa atrasada', message: 'Apurar ICMS - Tech Solutions esta atrasada', type: 'warning', read: false },
        { id: 'notif-2', userId: 'user-default', title: 'Novo cliente cadastrado', message: 'Studio Design Criativo adicionado a carteira', type: 'info', read: true },
        { id: 'notif-3', userId: 'user-default', title: 'Documento pendente', message: 'Balanco Patrimonial da Industria Mega ainda nao foi recebido', type: 'warning', read: false },
        { id: 'notif-4', userId: 'user-default', title: 'Template publicado', message: 'EFD-Reinf agora esta disponivel para aplicacao', type: 'success', read: true },
        { id: 'notif-5', userId: 'user-default', title: 'Prazo proximo', message: 'DCTF mensal vence em 2 dias', type: 'urgent', read: false },
        { id: 'notif-6', userId: 'user-default', title: 'Concluido', message: 'Folha de Pagamento de Maio processada com sucesso', type: 'success', read: true },
        { id: 'notif-7', userId: 'user-default', title: 'Novo membro', message: 'Mariana Lopes foi convidada para a equipe', type: 'info', read: false },
        { id: 'notif-8', userId: 'user-default', title: 'Cliente inativo', message: 'Transporte Rapido Ltda foi marcado como inativo', type: 'warning', read: true },
        { id: 'notif-9', userId: 'user-default', title: 'Backup realizado', message: 'Backup automatico concluido com sucesso', type: 'success', read: true },
        { id: 'notif-10', userId: 'user-default', title: 'Atualizacao do sistema', message: 'Nova versao disponivel com melhorias no dashboard', type: 'info', read: false },
      ],
    })

    // ─── 5 AuditLogs ──────────────────────────────────────
    await db.auditLog.createMany({
      data: [
        { id: 'audit-1', userId: 'user-default', userName: 'Ana Costa', action: 'client.create', entity: 'Client', entityId: 'client-1', detail: 'Created client Tech Solutions Ltda' },
        { id: 'audit-2', userId: 'user-default', userName: 'Ana Costa', action: 'template.publish', entity: 'Template', entityId: 'tpl-fiscal', detail: 'Published template Abertura Mensal - Fiscal' },
        { id: 'audit-3', userId: 'user-default', userName: 'Ana Costa', action: 'task.complete', entity: 'Task', entityId: 'task-3', detail: 'Completed task Processar folha de pagamento' },
        { id: 'audit-4', userId: 'user-default', userName: 'Ana Costa', action: 'member.invite', entity: 'OrgMember', entityId: 'member-5', detail: 'Invited Mariana Lopes to the organization' },
        { id: 'audit-5', userId: 'user-default', userName: 'Ana Costa', action: 'document.upload', entity: 'Document', detail: 'Uploaded Contrato Social for Tech Solutions' },
      ],
    })

    // ─── 3 Plans ──────────────────────────────────────────
    await db.plan.createMany({
      data: [
        { id: 'plan-free', name: 'Gratis', slug: 'free', price: 0, annualPrice: 0, maxClients: 5, maxUsers: 1, features: JSON.stringify(['Ate 5 clientes', '1 usuario', 'Tarefas basicas', 'Calendario']), active: true, sortOrder: 0 },
        { id: 'plan-pro', name: 'Profissional', slug: 'professional', price: 149.9, annualPrice: 1499, maxClients: 50, maxUsers: 10, features: JSON.stringify(['Ate 50 clientes', 'Ate 10 usuarios', 'Templates avancados', 'Dashboard completo', 'Relatorios', 'Suporte prioritario', 'API access']), active: true, sortOrder: 1 },
        { id: 'plan-enterprise', name: 'Enterprise', slug: 'enterprise', price: 399.9, annualPrice: 3999, maxClients: -1, maxUsers: -1, features: JSON.stringify(['Clientes ilimitados', 'Usuarios ilimitados', 'Todos os recursos', 'Integracoes avancadas', 'SLA garantido', 'Gerente de conta dedicado', 'Treinamento in-company', 'API ilimitada']), active: true, sortOrder: 2 },
      ],
    })

    // ─── 1 Subscription ───────────────────────────────────
    await db.subscription.create({
      data: {
        id: 'sub-default',
        organizationId: 'org-default',
        planId: 'plan-pro',
        status: 'active',
        currentPeriodEnd: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
      },
    })

    // ─── 5 FAQs ───────────────────────────────────────────
    await db.fAQ.createMany({
      data: [
        { id: 'faq-1', question: 'Como cadastrar um novo cliente?', answer: 'Acesse o menu Clientes e clique em Novo Cliente. Preencha os dados obrigatorios como CNPJ, razao social e nome fantasia. Voce tambem pode importar clientes via arquivo CSV.', order: 1, active: true },
        { id: 'faq-2', question: 'Como criar um template de tarefa?', answer: 'Vá em Templates e clique em Novo Template. Defina o nome, categoria, departamento responsavel e os passos da rotina. Quando publicado, o template podera ser aplicado a qualquer cliente.', order: 2, active: true },
        { id: 'faq-3', question: 'Quais sao os planos disponiveis?', answer: 'Oferecemos 3 planos: Gratuito (ate 5 clientes), Profissional (R$ 149,90/mes - ate 50 clientes) e Enterprise (sob consulta - ilimitado). Todos os planos possuem periodo de teste de 14 dias.', order: 3, active: true },
        { id: 'faq-4', question: 'Como gerenciar a equipe?', answer: 'Acesse a pagina de Equipe para convidar novos membros. Voce pode definir permissoes por perfil (owner, admin, gestor, colaborador, financeiro) e gerenciar o acesso de cada membro.', order: 4, active: true },
        { id: 'faq-5', question: 'Meus dados estao seguros?', answer: 'Sim! Utilizamos criptografia de ponta a ponta, backups automaticos diarios e nossa infraestrutura segue as melhores praticas de seguranca. Estamos em conformidade com a LGPD.', order: 5, active: true },
      ],
    })

    return NextResponse.json({ success: true, message: 'Seed data created successfully' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 })
  }
}