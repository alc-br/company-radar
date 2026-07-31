import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// ── Deterministic IDs ─────────────────────────────────────
const IDS = {
  plans: ['plan-essencial', 'plan-profissional', 'plan-gestao', 'plan-escala', 'plan-enterprise'],
  org: 'org-seed-exemplo',
  users: ['user-carlos', 'user-ana', 'user-pedro', 'user-maria', 'user-joao'],
  members: ['mem-carlos', 'mem-ana', 'mem-pedro', 'mem-maria', 'mem-joao'],
  departments: ['dept-fiscal', 'dept-contabil', 'dept-pessoal', 'dept-societario', 'dept-atendimento'],
  tags: ['tag-vip', 'tag-novo', 'tag-pj', 'tag-pme', 'tag-grande', 'tag-simples', 'tag-lucro-presumido', 'tag-inadimplente'],
  documentTypes: ['doctype-nota', 'doctype-balancete', 'doctype-darf', 'doctype-guia-inss', 'doctype-contrato'],
  clients: [
    'client-tech-solutions', 'client-comercio-vida', 'client-industria-forte',
    'client-consultoria-brasil', 'client-restaurante-sabor', 'client-construtora-horizonte',
    'client-clinica-saude', 'client-logistica-rapida', 'client-educacao-plus',
    'client-agro-sul', 'client-imobiliaria-casa', 'client-mecanica-precisao',
    'client-salao-beleza', 'client-transporte-carga', 'client-joalheria-ouro',
    'client-padaria-pao', 'client-farmacia-vida', 'client-oficina-carro',
    'client-mercado-bom', 'client-estudio-design',
  ],
  templates: ['tmpl-mensal-contabil', 'tmpl-obrigacoes-fiscais', 'tmpl-encerramento-anual'],
  templateVersions: ['tv-mensal-v1', 'tv-fiscais-v1', 'tv-anual-v1', 'tv-mensal-v2', 'tv-fiscais-v2'],
  applications: [
    'app-mensal-tech', 'app-mensal-comercio', 'app-mensal-industria',
    'app-fiscais-tech', 'app-fiscais-comercio', 'app-fiscais-consultoria',
    'app-fiscais-restaurante', 'app-fiscais-construtora',
    'app-anual-tech', 'app-anual-industria',
  ],
}

// ── Helper ───────────────────────────────────────────────
function daysAgo(d: number): string {
  const date = new Date()
  date.setDate(date.getDate() - d)
  return date.toISOString().split('T')[0]
}

function daysFromNow(d: number): string {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date.toISOString().split('T')[0]
}

function todayPlus(d: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date
}

// ── Seed ─────────────────────────────────────────────────
export async function POST() {
  try {
    // ── Clean in correct FK order ───────────────────────
    await db.taskComment.deleteMany()
    await db.taskFollower.deleteMany()
    await db.taskDependency.deleteMany()
    await db.taskChecklist.deleteMany()
    await db.task.deleteMany()
    await db.document.deleteMany()
    await db.documentRequest.deleteMany()
    await db.calendarEvent.deleteMany()
    await db.holiday.deleteMany()
    await db.userNotification.deleteMany()
    await db.notificationPreference.deleteMany()
    await db.auditLog.deleteMany()
    await db.contact.deleteMany()
    await db.clientTag.deleteMany()
    await db.templateApplication.deleteMany()
    await db.templateVersion.deleteMany()
    await db.template.deleteMany()
    await db.orgMember.deleteMany()
    await db.subscription.deleteMany()
    await db.exportJob.deleteMany()
    await db.user.deleteMany()
    await db.organization.deleteMany()
    await db.tag.deleteMany()
    await db.department.deleteMany()
    await db.documentType.deleteMany()
    await db.businessUnit.deleteMany()
    await db.plan.deleteMany()
    await db.fAQ.deleteMany()
    await db.publicPage.deleteMany()

    // ══════════════════════════════════════════════════════
    // 1. PLANS
    // ══════════════════════════════════════════════════════
    const plans = await Promise.all([
      db.plan.upsert({
        where: { slug: 'essencial' },
        update: {},
        create: {
          id: IDS.plans[0], name: 'Essencial', slug: 'essencial', price: 99,
          annualPrice: 948, maxClients: 25, maxUsers: 3, maxStorageMb: 1024,
          maxExports: 50, maxPortalContacts: 10, maxTemplates: 10,
          features: JSON.stringify(['Até 25 clientes', '3 usuários', '1 GB armazenamento', 'Templates básicos', 'Suporte por e-mail']),
          highlight: false, active: true, sortOrder: 1,
        },
      }),
      db.plan.upsert({
        where: { slug: 'profissional' },
        update: {},
        create: {
          id: IDS.plans[1], name: 'Profissional', slug: 'profissional', price: 199,
          annualPrice: 1908, maxClients: 100, maxUsers: 10, maxStorageMb: 5120,
          maxExports: 200, maxPortalContacts: 50, maxTemplates: 30,
          features: JSON.stringify(['Até 100 clientes', '10 usuários', '5 GB armazenamento', 'Templates avançados', 'Relatórios', 'Suporte prioritário', 'Portal do cliente']),
          highlight: true, active: true, sortOrder: 2,
        },
      }),
      db.plan.upsert({
        where: { slug: 'gestao' },
        update: {},
        create: {
          id: IDS.plans[2], name: 'Gestão', slug: 'gestao', price: 399,
          annualPrice: 3828, maxClients: 300, maxUsers: 25, maxStorageMb: 20480,
          maxExports: 500, maxPortalContacts: 200, maxTemplates: 100,
          features: JSON.stringify(['Até 300 clientes', '25 usuários', '20 GB armazenamento', 'Templates ilimitados', 'Relatórios avançados', 'API', 'Suporte dedicado', 'Múltiplas unidades']),
          highlight: false, active: true, sortOrder: 3,
        },
      }),
      db.plan.upsert({
        where: { slug: 'escala' },
        update: {},
        create: {
          id: IDS.plans[3], name: 'Escala', slug: 'escala', price: 699,
          annualPrice: 6708, maxClients: 1000, maxUsers: 50, maxStorageMb: 51200,
          maxExports: 1000, maxPortalContacts: 500, maxTemplates: 200,
          features: JSON.stringify(['Até 1.000 clientes', '50 usuários', '50 GB armazenamento', 'Tudo ilimitado', 'Relatórios executivos', 'API completa', 'Gerente de sucesso', 'SLA garantido', 'White label']),
          highlight: false, active: true, sortOrder: 4,
        },
      }),
      db.plan.upsert({
        where: { slug: 'enterprise' },
        update: {},
        create: {
          id: IDS.plans[4], name: 'Enterprise', slug: 'enterprise', price: 999,
          annualPrice: 9588, maxClients: 9999, maxUsers: 999, maxStorageMb: 102400,
          maxExports: 5000, maxPortalContacts: 9999, maxTemplates: 999,
          features: JSON.stringify(['Clientes ilimitados', 'Usuários ilimitados', '100 GB armazenamento', 'Tudo da Escala', 'Implantação assistida', 'Treinamento', 'SLA premium', 'Integração sob medida', 'Multi-organização']),
          highlight: false, active: true, sortOrder: 5,
        },
      }),
    ])

    // ══════════════════════════════════════════════════════
    // 2. ORGANIZATION
    // ══════════════════════════════════════════════════════
    const existingOrg = await db.organization.findUnique({ where: { id: IDS.org } })

    let org
    if (existingOrg) {
      org = existingOrg
    } else {
      org = await db.organization.create({
        data: {
          id: IDS.org,
          name: 'Escritório Contábil Exemplo',
          tradeName: 'Contabilidade Exemplo',
          cnpj: '12.345.678/0001-90',
          email: 'contato@exemplo.com.br',
          phone: '(11) 3456-7890',
          logo: null,
          primaryColor: '#2563eb',
          address: 'Rua da Contabilidade, 500 - Sala 1201',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01001-000',
          timezone: 'America/Sao_Paulo',
          plan: 'profissional',
          onboardingCompleted: true,
          onboardingStep: 6,
          settings: JSON.stringify({
            workingHours: { start: '08:00', end: '18:00' },
            workingDays: [1, 2, 3, 4, 5],
            razaoSocial: 'Escritório Contábil Exemplo Ltda',
            crc: '1SP987654/O-3',
          }),
        },
      })
    }

    // ══════════════════════════════════════════════════════
    // 3. SUBSCRIPTION for org
    // ══════════════════════════════════════════════════════
    await db.subscription.upsert({
      where: { organizationId: IDS.org },
      update: {},
      create: {
        organizationId: IDS.org,
        planId: IDS.plans[1], // Profissional
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: todayPlus(-15),
        currentPeriodEnd: todayPlus(15),
      },
    })

    // ══════════════════════════════════════════════════════
    // 4. USERS (5)
    // ══════════════════════════════════════════════════════
    const hash = await bcrypt.hash('demo123', 10)

    const users = await Promise.all([
      db.user.upsert({
        where: { id: IDS.users[0] },
        update: {},
        create: {
          id: IDS.users[0], email: 'carlos@exemplo.com.br', passwordHash: hash,
          name: 'Carlos', lastName: 'Silva', emailVerified: true,
          activeOrgId: IDS.org, termsAccepted: true, termsVersion: '1.0.0',
        },
      }),
      db.user.upsert({
        where: { id: IDS.users[1] },
        update: {},
        create: {
          id: IDS.users[1], email: 'ana@exemplo.com.br', passwordHash: hash,
          name: 'Ana', lastName: 'Costa', emailVerified: true,
          activeOrgId: IDS.org, termsAccepted: true, termsVersion: '1.0.0',
        },
      }),
      db.user.upsert({
        where: { id: IDS.users[2] },
        update: {},
        create: {
          id: IDS.users[2], email: 'pedro@exemplo.com.br', passwordHash: hash,
          name: 'Pedro', lastName: 'Santos', emailVerified: true,
          activeOrgId: IDS.org, termsAccepted: true, termsVersion: '1.0.0',
        },
      }),
      db.user.upsert({
        where: { id: IDS.users[3] },
        update: {},
        create: {
          id: IDS.users[3], email: 'maria@exemplo.com.br', passwordHash: hash,
          name: 'Maria', lastName: 'Oliveira', emailVerified: true,
          activeOrgId: IDS.org, termsAccepted: true, termsVersion: '1.0.0',
        },
      }),
      db.user.upsert({
        where: { id: IDS.users[4] },
        update: {},
        create: {
          id: IDS.users[4], email: 'joao@exemplo.com.br', passwordHash: hash,
          name: 'João', lastName: 'Lima', emailVerified: true,
          activeOrgId: IDS.org, termsAccepted: true, termsVersion: '1.0.0',
        },
      }),
    ])

    // ══════════════════════════════════════════════════════
    // 5. DEPARTMENTS (5)
    // ══════════════════════════════════════════════════════
    const departments = await Promise.all([
      db.department.upsert({
        where: { id: IDS.departments[0] }, update: {},
        create: { id: IDS.departments[0], organizationId: IDS.org, name: 'Fiscal', description: 'SPED Fiscal, guias, tributos', color: '#ef4444', managerId: IDS.members[2] },
      }),
      db.department.upsert({
        where: { id: IDS.departments[1] }, update: {},
        create: { id: IDS.departments[1], organizationId: IDS.org, name: 'Contábil', description: 'Escrituração, balanços, relatórios', color: '#3b82f6', managerId: IDS.members[1] },
      }),
      db.department.upsert({
        where: { id: IDS.departments[2] }, update: {},
        create: { id: IDS.departments[2], organizationId: IDS.org, name: 'Pessoal', description: 'Folha de pagamento, e-social, FGTS', color: '#10b981', managerId: IDS.members[3] },
      }),
      db.department.upsert({
        where: { id: IDS.departments[3] }, update: {},
        create: { id: IDS.departments[3], organizationId: IDS.org, name: 'Societário', description: 'Contratos, atas, alterações contratuais', color: '#f59e0b' },
      }),
      db.department.upsert({
        where: { id: IDS.departments[4] }, update: {},
        create: { id: IDS.departments[4], organizationId: IDS.org, name: 'Atendimento', description: 'Atendimento e suporte ao cliente', color: '#8b5cf6' },
      }),
    ])

    // ══════════════════════════════════════════════════════
    // 6. ORG MEMBERS (5)
    // ══════════════════════════════════════════════════════
    await Promise.all([
      db.orgMember.upsert({
        where: { id: IDS.members[0] }, update: {},
        create: { id: IDS.members[0], organizationId: IDS.org, userId: IDS.users[0], name: 'Carlos Silva', email: 'carlos@exemplo.com.br', role: 'owner', departmentId: IDS.departments[1], status: 'active', permissions: JSON.stringify({ all: true }) },
      }),
      db.orgMember.upsert({
        where: { id: IDS.members[1] }, update: {},
        create: { id: IDS.members[1], organizationId: IDS.org, userId: IDS.users[1], name: 'Ana Costa', email: 'ana@exemplo.com.br', role: 'admin', departmentId: IDS.departments[1], status: 'active', permissions: JSON.stringify({ all: true }) },
      }),
      db.orgMember.upsert({
        where: { id: IDS.members[2] }, update: {},
        create: { id: IDS.members[2], organizationId: IDS.org, userId: IDS.users[2], name: 'Pedro Santos', email: 'pedro@exemplo.com.br', role: 'gestor', departmentId: IDS.departments[0], status: 'active', permissions: JSON.stringify({ tasks: true, clients: true, documents: true }) },
      }),
      db.orgMember.upsert({
        where: { id: IDS.members[3] }, update: {},
        create: { id: IDS.members[3], organizationId: IDS.org, userId: IDS.users[3], name: 'Maria Oliveira', email: 'maria@exemplo.com.br', role: 'collaborator', departmentId: IDS.departments[2], status: 'active', permissions: JSON.stringify({ tasks: true, documents: true }) },
      }),
      db.orgMember.upsert({
        where: { id: IDS.members[4] }, update: {},
        create: { id: IDS.members[4], organizationId: IDS.org, userId: IDS.users[4], name: 'João Lima', email: 'joao@exemplo.com.br', role: 'collaborator', departmentId: IDS.departments[0], status: 'active', permissions: JSON.stringify({ tasks: true }) },
      }),
    ])

    // ══════════════════════════════════════════════════════
    // 7. TAGS (8)
    // ══════════════════════════════════════════════════════
    const tagData = [
      { name: 'VIP', color: '#f59e0b' },
      { name: 'Novo Cliente', color: '#10b981' },
      { name: 'Pessoa Jurídica', color: '#3b82f6' },
      { name: 'PME', color: '#8b5cf6' },
      { name: 'Grande Empresa', color: '#ef4444' },
      { name: 'Simples Nacional', color: '#06b6d4' },
      { name: 'Lucro Presumido', color: '#f97316' },
      { name: 'Inadimplente', color: '#dc2626' },
    ]
    const tags = await Promise.all(
      tagData.map((t, i) =>
        db.tag.upsert({
          where: { id: IDS.tags[i] },
          update: {},
          create: { id: IDS.tags[i], organizationId: IDS.org, ...t },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 8. DOCUMENT TYPES (5)
    // ══════════════════════════════════════════════════════
    const docTypes = await Promise.all([
      db.documentType.upsert({
        where: { id: IDS.documentTypes[0] }, update: {},
        create: { id: IDS.documentTypes[0], organizationId: IDS.org, name: 'Nota Fiscal', category: 'Fiscal', description: 'Notas fiscais de entrada e saída', validityDays: 3650, required: true },
      }),
      db.documentType.upsert({
        where: { id: IDS.documentTypes[1] }, update: {},
        create: { id: IDS.documentTypes[1], organizationId: IDS.org, name: 'Balancete', category: 'Contábil', description: 'Balancetes de verificação', validityDays: 365, required: false },
      }),
      db.documentType.upsert({
        where: { id: IDS.documentTypes[2] }, update: {},
        create: { id: IDS.documentTypes[2], organizationId: IDS.org, name: 'DARF', category: 'Fiscal', description: 'Documento de Arrecadação da Receita Federal', validityDays: 180, required: true },
      }),
      db.documentType.upsert({
        where: { id: IDS.documentTypes[3] }, update: {},
        create: { id: IDS.documentTypes[3], organizationId: IDS.org, name: 'Guia INSS', category: 'Pessoal', description: 'Guia de recolhimento do INSS/FGTS', validityDays: 90, required: true },
      }),
      db.documentType.upsert({
        where: { id: IDS.documentTypes[4] }, update: {},
        create: { id: IDS.documentTypes[4], organizationId: IDS.org, name: 'Contrato Social', category: 'Societário', description: 'Contrato social e alterações', validityDays: null, required: false },
      }),
    ])

    // ══════════════════════════════════════════════════════
    // 9. CLIENTS (20)
    // ══════════════════════════════════════════════════════
    const clientsData = [
      { id: IDS.clients[0], name: 'Tech Solutions Ltda', tradeName: 'TechSol', cnpj: '11.222.333/0001-44', ie: '123.456.789.111', cnae: '6201-5/01', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Tecnologia', email: 'contato@techsol.com.br', phone: '(11) 3456-1234', city: 'São Paulo', state: 'SP', openDate: '2015-03-15', status: 'active', serviceStartDate: '2023-01-15' },
      { id: IDS.clients[1], name: 'Comércio Vida e Saúde EIRELI', tradeName: 'Vida Saúde', cnpj: '22.333.444/0001-55', ie: '234.567.890.222', cnae: '4771-7/01', taxRegime: 'Simples', companySize: 'ME', segment: 'Comércio', email: 'financeiro@vidasaude.com.br', phone: '(21) 2345-6789', city: 'Rio de Janeiro', state: 'RJ', openDate: '2018-07-20', status: 'active', serviceStartDate: '2023-02-01' },
      { id: IDS.clients[2], name: 'Indústria Forte S.A.', tradeName: 'IndFort', cnpj: '33.444.555/0001-66', ie: '345.678.901.333', cnae: '1719-5/01', taxRegime: 'Lucro Real', companySize: 'Grande Empresa', segment: 'Indústria', email: 'contabil@indforte.com.br', phone: '(31) 3456-7890', city: 'Belo Horizonte', state: 'MG', openDate: '2005-11-03', status: 'active', serviceStartDate: '2022-06-01' },
      { id: IDS.clients[3], name: 'Consultoria Brasil Associados', tradeName: 'ConsulBR', cnpj: '44.555.666/0001-77', ie: '456.789.012.444', cnae: '7020-4/00', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Serviços', email: 'adm@consulbr.com.br', phone: '(41) 3321-4567', city: 'Curitiba', state: 'PR', openDate: '2012-04-10', status: 'active', serviceStartDate: '2023-03-15' },
      { id: IDS.clients[4], name: 'Restaurante Sabor & Arte Ltda', tradeName: 'Sabor & Arte', cnpj: '55.666.777/0001-88', ie: '567.890.123.555', cnae: '5611-2/01', taxRegime: 'Simples', companySize: 'ME', segment: 'Alimentação', email: 'contato@saborarte.com.br', phone: '(51) 3456-1234', city: 'Porto Alegre', state: 'RS', openDate: '2019-08-25', status: 'active', serviceStartDate: '2023-05-01' },
      { id: IDS.clients[5], name: 'Construtora Horizonte Empreendimentos S.A.', tradeName: 'Construtora Horizonte', cnpj: '66.777.888/0001-99', ie: '678.901.234.666', cnae: '4120-4/00', taxRegime: 'Lucro Real', companySize: 'Grande Empresa', segment: 'Construção', email: 'financeiro@horizonte.com.br', phone: '(61) 3345-6789', city: 'Brasília', state: 'DF', openDate: '2008-01-20', status: 'active', serviceStartDate: '2022-01-10' },
      { id: IDS.clients[6], name: 'Clínica Saúde Integral Ltda', tradeName: 'Saúde Integral', cnpj: '77.888.999/0001-11', ie: '789.012.345.777', cnae: '8620-1/01', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Saúde', email: 'adm@saudeintegral.com.br', phone: '(62) 3456-7890', city: 'Goiânia', state: 'GO', openDate: '2016-05-12', status: 'active', serviceStartDate: '2023-07-01' },
      { id: IDS.clients[7], name: 'Logística Rápida Express Ltda', tradeName: 'LogRápida', cnpj: '88.999.111/0001-22', ie: '890.123.456.888', cnae: '4930-2/02', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Logística', email: 'contabil@lograpida.com.br', phone: '(92) 3633-4567', city: 'Manaus', state: 'AM', openDate: '2014-09-30', status: 'active', serviceStartDate: '2023-04-01' },
      { id: IDS.clients[8], name: 'Educação Plus Ensino Ltda', tradeName: 'EduPlus', cnpj: '99.111.222/0001-33', ie: '901.234.567.999', cnae: '8533-3/04', taxRegime: 'Simples', companySize: 'ME', segment: 'Educação', email: 'diretoria@eduplus.com.br', phone: '(71) 3345-6789', city: 'Salvador', state: 'BA', openDate: '2020-02-14', status: 'active', serviceStartDate: '2023-08-01' },
      { id: IDS.clients[9], name: 'Agro Sul Cooperativa', tradeName: 'AgroSul', cnpj: '12.111.222/0001-33', ie: '012.345.678.900', cnae: '0161-1/01', taxRegime: 'Lucro Real', companySize: 'Grande Empresa', segment: 'Agropecuária', email: 'contabil@agrosul.com.br', phone: '(46) 3520-1234', city: 'Londrina', state: 'PR', openDate: '2001-06-18', status: 'active', serviceStartDate: '2022-03-01' },
      { id: IDS.clients[10], name: 'Imobiliária Casa Nova Ltda', tradeName: 'Casa Nova', cnpj: '23.222.333/0001-44', ie: '123.456.789.000', cnae: '6810-2/01', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Imobiliário', email: 'financeiro@casanova.com.br', phone: '(48) 3225-6789', city: 'Florianópolis', state: 'SC', openDate: '2013-10-05', status: 'inactive', serviceStartDate: '2023-01-01' },
      { id: IDS.clients[11], name: 'Mecânica Precisão Auto Ltda', tradeName: 'Precisão Auto', cnpj: '34.333.444/0001-55', ie: '234.567.890.100', cnae: '3314-7/00', taxRegime: 'Simples', companySize: 'ME', segment: 'Automotivo', email: 'contato@precisaoauto.com.br', phone: '(85) 3244-1234', city: 'Fortaleza', state: 'CE', openDate: '2017-03-22', status: 'active', serviceStartDate: '2023-09-15' },
      { id: IDS.clients[12], name: 'Salão Beleza Pura ME', tradeName: 'Beleza Pura', cnpj: '45.444.555/0001-66', ie: '345.678.901.200', cnae: '9611-0/01', taxRegime: 'Simples', companySize: 'ME', segment: 'Beleza', email: 'contato@belezapura.com.br', phone: '(81) 3445-6789', city: 'Recife', state: 'PE', openDate: '2021-01-11', status: 'active', serviceStartDate: '2023-10-01' },
      { id: IDS.clients[13], name: 'Transporte Carga Pesada Ltda', tradeName: 'Carga Pesada', cnpj: '56.555.666/0001-77', ie: '456.789.012.300', cnae: '4930-2/01', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Transporte', email: 'adm@cargapesada.com.br', phone: '(92) 3633-5678', city: 'Manaus', state: 'AM', openDate: '2010-07-14', status: 'archived', serviceStartDate: '2022-05-01' },
      { id: IDS.clients[14], name: 'Joalheria Ouro Fino Ltda', tradeName: 'Ouro Fino', cnpj: '67.666.777/0001-88', ie: '567.890.123.400', cnae: '3211-8/00', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Varejo', email: 'contabil@ourofino.com.br', phone: '(11) 3456-5678', city: 'São Paulo', state: 'SP', openDate: '2011-12-20', status: 'active', serviceStartDate: '2023-06-15' },
      { id: IDS.clients[15], name: 'Padaria Pão Quente ME', tradeName: 'Pão Quente', cnpj: '78.777.888/0001-99', ie: '678.901.234.500', cnae: '1091-1/01', taxRegime: 'Simples', companySize: 'ME', segment: 'Alimentação', email: 'paoquente@email.com', phone: '(21) 2345-0987', city: 'Niterói', state: 'RJ', openDate: '2022-05-30', status: 'active', serviceStartDate: '2024-01-01' },
      { id: IDS.clients[16], name: 'Farmácia Vida Bem Estar Ltda', tradeName: 'Farmácia Vida', cnpj: '89.888.999/0001-11', ie: '789.012.345.600', cnae: '4771-7/02', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Saúde', email: 'farmacia@vidabemestar.com.br', phone: '(41) 3321-8765', city: 'Curitiba', state: 'PR', openDate: '2016-08-08', status: 'active', serviceStartDate: '2023-03-01' },
      { id: IDS.clients[17], name: 'Oficina Mecânica Express Ltda', tradeName: 'Mecânica Express', cnpj: '90.999.111/0001-22', ie: '890.123.456.700', cnae: '3314-7/00', taxRegime: 'Simples', companySize: 'ME', segment: 'Automotivo', email: 'oficina@expresso.com.br', phone: '(51) 3456-2345', city: 'Caxias do Sul', state: 'RS', openDate: '2019-11-15', status: 'inactive', serviceStartDate: '2023-07-01' },
      { id: IDS.clients[18], name: 'Mercado Bom Preço Ltda', tradeName: 'Bom Preço', cnpj: '01.111.222/0001-33', ie: '901.234.567.800', cnae: '4712-1/00', taxRegime: 'Lucro Presumido', companySize: 'PME', segment: 'Varejo', email: 'adm@bompreco.com.br', phone: '(62) 3456-3456', city: 'Anápolis', state: 'GO', openDate: '2009-04-25', status: 'active', serviceStartDate: '2022-09-01' },
      { id: IDS.clients[19], name: 'Estúdio Design Criativo Ltda', tradeName: 'Design Criativo', cnpj: '02.222.333/0001-44', ie: '012.345.678.900', cnae: '7311-4/00', taxRegime: 'Simples', companySize: 'ME', segment: 'Design', email: 'hello@designcriativo.com.br', phone: '(11) 3456-7891', city: 'São Paulo', state: 'SP', openDate: '2023-01-05', status: 'active', serviceStartDate: '2024-02-01' },
    ]

    const clients = await Promise.all(
      clientsData.map((c) =>
        db.client.upsert({
          where: { id: c.id },
          update: {},
          create: {
            organizationId: IDS.org,
            responsibleId: IDS.members[0],
            portalAccess: c.status === 'active',
            ...c,
          },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 10. CONTACTS (1-3 per client)
    // ══════════════════════════════════════════════════════
    const contactsData = [
      // Tech Solutions - 2 contacts
      { clientId: IDS.clients[0], name: 'Ricardo Mendes', email: 'ricardo@techsol.com.br', phone: '(11) 98765-1234', role: 'Sócio-Administrador', hasPortalAccess: true },
      { clientId: IDS.clients[0], name: 'Fernanda Lima', email: 'fernanda@techsol.com.br', phone: '(11) 98765-5678', role: 'Financeiro', hasPortalAccess: true },
      // Comércio Vida
      { clientId: IDS.clients[1], name: 'Marcos Oliveira', email: 'marcos@vidasaude.com.br', phone: '(21) 99876-1234', role: 'Proprietário', hasPortalAccess: true },
      // Indústria Forte - 3 contacts
      { clientId: IDS.clients[2], name: 'Roberto Almeida', email: 'roberto@indforte.com.br', phone: '(31) 99876-2345', role: 'Diretor Financeiro', hasPortalAccess: true },
      { clientId: IDS.clients[2], name: 'Cláudia Souza', email: 'claudia@indforte.com.br', phone: '(31) 99876-3456', role: 'Gerente Contábil', hasPortalAccess: true },
      { clientId: IDS.clients[2], name: 'Paulo Henrique', email: 'paulo@indforte.com.br', phone: '(31) 99876-4567', role: 'RH', hasPortalAccess: false },
      // Consultoria Brasil
      { clientId: IDS.clients[3], name: 'Patrícia Costa', email: 'patricia@consulbr.com.br', phone: '(41) 99876-5678', role: 'Sócia', hasPortalAccess: true },
      { clientId: IDS.clients[3], name: 'Lucas Ferreira', email: 'lucas@consulbr.com.br', phone: '(41) 99876-6789', role: 'Gerente', hasPortalAccess: false },
      // Restaurante
      { clientId: IDS.clients[4], name: 'Juliana Santos', email: 'juliana@saborarte.com.br', phone: '(51) 99876-7890', role: 'Proprietária', hasPortalAccess: true },
      // Construtora
      { clientId: IDS.clients[5], name: 'Eduardo Nascimento', email: 'eduardo@horizonte.com.br', phone: '(61) 99876-8901', role: 'Diretor', hasPortalAccess: true },
      { clientId: IDS.clients[5], name: 'Beatriz Cardoso', email: 'beatriz@horizonte.com.br', phone: '(61) 99876-9012', role: 'Financeiro', hasPortalAccess: true },
      // Clínica
      { clientId: IDS.clients[6], name: 'Dr. André Martins', email: 'andre@saudeintegral.com.br', phone: '(62) 99876-0123', role: 'Diretor', hasPortalAccess: true },
      // Logística
      { clientId: IDS.clients[7], name: 'Carlos Eduardo', email: 'carlos@lograpida.com.br', phone: '(92) 99876-1234', role: 'Gerente Operacional', hasPortalAccess: true },
      // Educação
      { clientId: IDS.clients[8], name: 'Professora Maria Lúcia', email: 'marialucia@eduplus.com.br', phone: '(71) 99876-2345', role: 'Diretora', hasPortalAccess: true },
      // Agro Sul
      { clientId: IDS.clients[9], name: 'José Antônio', email: 'joseantonio@agrosul.com.br', phone: '(46) 99876-3456', role: 'Presidente', hasPortalAccess: true },
      { clientId: IDS.clients[9], name: 'Ana Paula', email: 'anapaula@agrosul.com.br', phone: '(46) 99876-4567', role: 'Contador interno', hasPortalAccess: false },
      // Remaining: 1 contact each
      { clientId: IDS.clients[10], name: 'Renato Gomes', email: 'renato@casanova.com.br', phone: '(48) 99876-5678', role: 'Proprietário', hasPortalAccess: false },
      { clientId: IDS.clients[11], name: 'Rodrigo Pinto', email: 'rodrigo@precisaoauto.com.br', phone: '(85) 99876-6789', role: 'Dono', hasPortalAccess: true },
      { clientId: IDS.clients[12], name: 'Camila Rodrigues', email: 'camila@belezapura.com.br', phone: '(81) 99876-7890', role: 'Proprietária', hasPortalAccess: true },
      { clientId: IDS.clients[13], name: 'Fernando Costa', email: 'fernando@cargapesada.com.br', phone: '(92) 99876-8901', role: 'Diretor', hasPortalAccess: false },
      { clientId: IDS.clients[14], name: 'Isabela Ferreira', email: 'isabela@ourofino.com.br', phone: '(11) 99876-9012', role: 'Sócia', hasPortalAccess: true },
      { clientId: IDS.clients[15], name: 'Antônio Carlos', email: 'antonio@paoquente.com.br', phone: '(21) 99876-0123', role: 'Padeiro/Dono', hasPortalAccess: true },
      { clientId: IDS.clients[16], name: 'Dr. Sérgio Menezes', email: 'sergio@vidabemestar.com.br', phone: '(41) 99876-1234', role: 'Farmacêutico', hasPortalAccess: true },
      { clientId: IDS.clients[17], name: 'Márcio Souza', email: 'marcio@expresso.com.br', phone: '(51) 99876-2345', role: 'Mecânico/Dono', hasPortalAccess: false },
      { clientId: IDS.clients[18], name: 'Adriana Pereira', email: 'adriana@bompreco.com.br', phone: '(62) 99876-3456', role: 'Gerente', hasPortalAccess: true },
      { clientId: IDS.clients[19], name: 'Thiago Design', email: 'thiago@designcriativo.com.br', phone: '(11) 99876-4567', role: 'Diretor Criativo', hasPortalAccess: true },
    ]

    await db.contact.createMany({ data: contactsData })

    // ══════════════════════════════════════════════════════
    // 11. TEMPLATES (3) with stage/task structures
    // ══════════════════════════════════════════════════════

    const templateMensal = {
      id: IDS.templates[0],
      organizationId: IDS.org,
      code: 'MENSAL-CONTABIL',
      name: 'Mensal Contábil',
      description: 'Rotina contábil mensal completa com conciliação bancária, escrituração e emissão de relatórios.',
      purpose: 'Garantir que todas as obrigações contábeis mensais sejam cumpridas com qualidade e dentro do prazo.',
      category: 'Contábil',
      color: '#3b82f6',
      icon: 'BarChart3',
      departmentId: IDS.departments[1],
      responsibleId: IDS.members[1],
      instructions: 'Iniciar pela conciliação bancária. Após confirmar saldos, prosseguir com a escrituração. Finalizar com relatórios gerenciais.',
      defaultPeriodicity: 'monthly',
      status: 'published',
      currentVersion: 1,
      stages: JSON.stringify([
        {
          name: 'Conciliação Bancária',
          order: 0,
          tasks: [
            { title: 'Obter extratos bancários', description: 'Baixar extratos de todas as contas bancárias do cliente', priority: 'high', estimatedMinutes: 15, dueDateRule: 'D+5', checklist: ['Conta corrente principal', 'Conta investimento', 'Cartão de crédito'], documents: ['Extrato bancário'] },
            { title: 'Conciliar movimentações', description: 'Conferir e classificar todas as movimentações bancárias', priority: 'high', estimatedMinutes: 60, dueDateRule: 'D+8', checklist: ['Receitas conciliadas', 'Despesas conciliadas', 'Transferências verificadas', 'Saldos conferidos'], documents: [] },
            { title: 'Registrar divergências', description: 'Documentar e comunicar qualquer divergência encontrada', priority: 'medium', estimatedMinutes: 20, dueDateRule: 'D+8', checklist: ['Divergências listadas', 'Cliente notificado'], documents: [] },
          ],
        },
        {
          name: 'Escrituração',
          order: 1,
          tasks: [
            { title: 'Lançar recibos e notas fiscais de entrada', description: 'Registrar todas as NF-e de entrada no sistema contábil', priority: 'high', estimatedMinutes: 90, dueDateRule: 'D+12', checklist: ['NF-e de serviços', 'NF-e de produtos', 'Cupons fiscais', 'Notas de energia/telecom'], documents: ['Nota Fiscal'] },
            { title: 'Lançar notas fiscais de saída', description: 'Registrar todas as NF-e de saída emitidas pelo cliente', priority: 'high', estimatedMinutes: 60, dueDateRule: 'D+12', checklist: ['Todas as NF-e do mês registradas', 'ICMS e IPI calculados'], documents: [] },
            { title: 'Apurar impostos', description: 'Calcular PIS, COFINS, IRPJ e CSLL do período', priority: 'high', estimatedMinutes: 45, dueDateRule: 'D+15', checklist: ['PIS apurado', 'COFINS apurado', 'IRPJ calculado', 'CSLL calculado'], documents: ['DARF'] },
            { title: 'Fechar balancete de verificação', description: 'Gerar e conferir balancete do período', priority: 'medium', estimatedMinutes: 30, dueDateRule: 'D+18', checklist: ['Balancete gerado', 'Saldo anterior confere', 'Lançamentos revisados'], documents: ['Balancete'] },
          ],
        },
        {
          name: 'Relatórios',
          order: 2,
          tasks: [
            { title: 'Gerar DRE', description: 'Emitir Demonstrativo do Resultado do Exercício', priority: 'medium', estimatedMinutes: 30, dueDateRule: 'D+20', checklist: ['DRE gerado', 'Receitas verificadas', 'Despesas categorizadas', 'Resultado líquido calculado'], documents: [] },
            { title: 'Enviar relatórios ao cliente', description: 'Compartilhar relatórios gerenciais com o cliente via portal', priority: 'low', estimatedMinutes: 15, dueDateRule: 'D+22', checklist: ['DRE enviado', 'Balanço patrimonial enviado', 'Fluxo de caixa enviado'], documents: [] },
          ],
        },
      ]),
    }

    const templateFiscais = {
      id: IDS.templates[1],
      organizationId: IDS.org,
      code: 'OBRIGACOES-FISCAIS',
      name: 'Obrigações Fiscais Mensais',
      description: 'Template para controle de todas as obrigações fiscais mensais: SPED Fiscal, guias de pagamento e DARF.',
      purpose: 'Garantir o cumprimento de todas as obrigações acessórias e tributárias mensais.',
      category: 'Fiscal',
      color: '#ef4444',
      icon: 'FileText',
      departmentId: IDS.departments[0],
      responsibleId: IDS.members[2],
      instructions: 'Verificar prazo de entrega de cada obrigação. Priorizar SPED Fiscal. Confirmar valores das guias antes do pagamento.',
      warning: 'Atenção: multas por atraso na entrega do SPED Fiscal podem chegar a 1% da receita. Prazos são intransferríveis.',
      defaultPeriodicity: 'monthly',
      status: 'published',
      currentVersion: 1,
      stages: JSON.stringify([
        {
          name: 'SPED Fiscal',
          order: 0,
          tasks: [
            { title: 'Exportar SPED Fiscal (ICMS/IPI)', description: 'Gerar arquivo EFD ICMS/IPI no formato exigido pela Receita', priority: 'high', estimatedMinutes: 120, dueDateRule: 'D+20', checklist: ['Registros 0000 a 9999 preenchidos', 'Blocos C e D verificados', 'Validação sem erros', 'Arquivo .txt gerado'], documents: ['SPED Fiscal'] },
            { title: 'Transmitir SPED Fiscal', description: 'Enviar o arquivo ao ambiente SPED da Receita Federal', priority: 'high', estimatedMinutes: 30, dueDateRule: 'D+20', checklist: ['Transmissão realizada', 'Recibo salvo', 'Sem pendências'], documents: [] },
            { title: 'Verificar SPED Contribuições (PIS/COFINS)', description: 'Gerar e transmitir o EFD Contribuições quando aplicável', priority: 'high', estimatedMinutes: 90, dueDateRule: 'D+15', checklist: ['EFD Contribuições gerado', 'Apuração conferida', 'Transmitido com sucesso'], documents: [] },
          ],
        },
        {
          name: 'Guias',
          order: 1,
          tasks: [
            { title: 'Gerar guia de ICMS', description: 'Calcular e emitir guia de ICMS do período', priority: 'high', estimatedMinutes: 30, dueDateRule: 'D+15', checklist: ['Apuração ICMS-ST (se aplicável)', 'Créditos calculados', 'Débitos calculados', 'Guia gerada'], documents: [] },
            { title: 'Gerar guia de ISS', description: 'Calcular e emitir guia de ISS quando devido', priority: 'medium', estimatedMinutes: 20, dueDateRule: 'D+15', checklist: ['Notas de serviço verificadas', 'ISS calculado', 'Guia gerada'], documents: [] },
          ],
        },
        {
          name: 'DARF',
          order: 2,
          tasks: [
            { title: 'Gerar DARF de PIS', description: 'Emitir DARF de PIS sobre faturamento', priority: 'high', estimatedMinutes: 15, dueDateRule: 'D+25', checklist: ['Base de cálculo verificada', 'Alíquota correta', 'DARF gerado'], documents: ['DARF'] },
            { title: 'Gerar DARF de COFINS', description: 'Emitir DARF de COFINS sobre faturamento', priority: 'high', estimatedMinutes: 15, dueDateRule: 'D+25', checklist: ['Base de cálculo verificada', 'Alíquota correta', 'DARF gerado'], documents: ['DARF'] },
            { title: 'Gerar DARF de IRPJ e CSLL', description: 'Calcular e emitir DARFs de IRPJ e CSLL estimados/trimestrais', priority: 'high', estimatedMinutes: 30, dueDateRule: 'D+25', checklist: ['IRPJ calculado', 'CSLL calculado', 'Adicional de IRPJ (se aplicável)', 'DARFs gerados'], documents: ['DARF'] },
          ],
        },
      ]),
    }

    const templateAnual = {
      id: IDS.templates[2],
      organizationId: IDS.org,
      code: 'ENCERRAMENTO-ANUAL',
      name: 'Encerramento Anual',
      description: 'Template completo para o encerramento fiscal e contábil anual: balanço patrimonial, DCTF, ECF, IRPJ/CSLL anual.',
      purpose: 'Garantir que todas as obrigações anuais sejam cumpridas, incluindo balanço, ECF e declarações finais.',
      category: 'Contábil',
      color: '#f59e0b',
      icon: 'Calendar',
      departmentId: IDS.departments[1],
      responsibleId: IDS.members[0],
      instructions: 'Este é o processo mais crítico do ano. Iniciar em dezembro com o inventário. O balanço deve ser aprovado até 31 de março.',
      warning: 'Atraso na entrega da ECF sujeita a multa mínima de R$ 500. O balanço patrimonial deve ser aprovado em assembleia até março.',
      defaultPeriodicity: 'yearly',
      status: 'published',
      currentVersion: 1,
      stages: JSON.stringify([
        {
          name: 'Balanço',
          order: 0,
          tasks: [
            { title: 'Levantar inventário de estoque', description: 'Realizar contagem física e valorização do estoque em 31/12', priority: 'high', estimatedMinutes: 180, dueDateRule: 'D+31 (dez)', checklist: ['Contagem física realizada', 'Valorização pelo critério fiscal', 'Divergências investigadas', 'Relatório de inventário gerado'], documents: [] },
            { title: 'Conciliar saldos contábeis', description: 'Verificar todos os saldos das contas patrimoniais', priority: 'high', estimatedMinutes: 120, dueDateRule: 'D+60 (jan)', checklist: ['Bancos conciliados', 'Contas a receber/pagar conferidas', 'Imobilizado depreciado', 'Provisões calculadas'], documents: ['Balancete'] },
            { title: 'Elaborar balanço patrimonial', description: 'Preparar o balanço patrimonial e DRE do exercício', priority: 'high', estimatedMinutes: 180, dueDateRule: 'D+90 (mar)', checklist: ['Ativo verificado', 'Passivo verificado', 'Patrimônio líquido calculado', 'DRE elaborado', 'DLPA elaborado'], documents: [] },
            { title: 'Obter aprovação do balanço', description: 'Submeter o balanço para aprovação dos sócios em assembleia', priority: 'high', estimatedMinutes: 60, dueDateRule: 'D+90 (mar)', checklist: ['Assembleia convocada', 'Balanço aprovado', 'Ata assinada'], documents: ['Contrato Social'] },
          ],
        },
        {
          name: 'DCTF',
          order: 1,
          tasks: [
            { title: 'Consolidar impostos do ano', description: 'Reunir todas as informações de impostos pagos no ano', priority: 'high', estimatedMinutes: 120, dueDateRule: 'D+90 (mar)', checklist: ['IRPJ mensal/trimestral consolidado', 'CSLL consolidada', 'PIS/COFINS consolidados', 'IPI consolidado (se aplicável)'], documents: ['DARF'] },
            { title: 'Transmitir DCTF', description: 'Gerar e transmitir a Declaração de Débitos e Créditos Tributários Federais', priority: 'high', estimatedMinutes: 60, dueDateRule: 'D+90 (mar)', checklist: ['DCTF preenchida', 'Valores conferidos', 'Transmitida com sucesso', 'Recibo salvo'], documents: [] },
          ],
        },
        {
          name: 'ECF',
          order: 2,
          tasks: [
            { title: 'Preparar dados para ECF', description: 'Consolidar todas as informações contábeis do ano-calendário', priority: 'high', estimatedMinutes: 180, dueDateRule: 'D+120 (abr)', checklist: ['Livro Diário completo', 'Livro Razão completo', 'Balancetes mensais', 'Participações societárias verificadas'], documents: [] },
            { title: 'Gerar e validar ECF', description: 'Criar o arquivo ECF e executar validação oficial', priority: 'high', estimatedMinutes: 240, dueDateRule: 'D+120 (abr)', checklist: ['Blocos A a X preenchidos', 'Validação sem erros', 'Alertas verificados', 'Arquivo .txt gerado'], documents: [] },
            { title: 'Transmitir ECF', description: 'Enviar a ECF ao SPED da Receita Federal', priority: 'high', estimatedMinutes: 30, dueDateRule: 'D+120 (abr)', checklist: ['Transmissão realizada', 'Recibo salvo', 'Pendências verificadas'], documents: [] },
          ],
        },
        {
          name: 'IRPJ/CSLL',
          order: 3,
          tasks: [
            { title: 'Apurar IRPJ e CSLL anual', description: 'Calcular o ajuste anual do IRPJ e CSLL com base no balanço', priority: 'high', estimatedMinutes: 120, dueDateRule: 'D+120 (abr)', checklist: ['Lucro contábil ajustado', 'Adições realizadas', 'Exclusões realizadas', 'Compensações de prejuízos aplicadas', 'IRPJ devido calculado', 'CSLL devida calculada'], documents: [] },
            { title: 'Gerar DARFs de ajuste anual', description: 'Emitir DARFs complementares de IRPJ e CSLL', priority: 'high', estimatedMinutes: 30, dueDateRule: 'D+120 (abr)', checklist: ['DARF IRPJ gerado', 'DARF CSLL gerado', 'Valores conferidos com ECF'], documents: ['DARF'] },
          ],
        },
      ]),
    }

    await db.template.upsert({
      where: { id: IDS.templates[0] }, update: {}, create: templateMensal,
    })
    await db.template.upsert({
      where: { id: IDS.templates[1] }, update: {}, create: templateFiscais,
    })
    await db.template.upsert({
      where: { id: IDS.templates[2] }, update: {}, create: templateAnual,
    })

    // ══════════════════════════════════════════════════════
    // 12. TEMPLATE VERSIONS (5) — publish each template
    // ══════════════════════════════════════════════════════
    await Promise.all([
      db.templateVersion.upsert({
        where: { id: IDS.templateVersions[0] }, update: {},
        create: { id: IDS.templateVersions[0], organizationId: IDS.org, templateId: IDS.templates[0], versionNumber: 1, name: 'Mensal Contábil v1.0', description: 'Versão inicial do template mensal contábil', stages: templateMensal.stages, publishedAt: todayPlus(-90), publishedBy: IDS.users[0], isCurrent: true },
      }),
      db.templateVersion.upsert({
        where: { id: IDS.templateVersions[1] }, update: {},
        create: { id: IDS.templateVersions[1], organizationId: IDS.org, templateId: IDS.templates[1], versionNumber: 1, name: 'Obrigações Fiscais v1.0', description: 'Versão inicial do template de obrigações fiscais', stages: templateFiscais.stages, publishedAt: todayPlus(-85), publishedBy: IDS.users[0], isCurrent: true },
      }),
      db.templateVersion.upsert({
        where: { id: IDS.templateVersions[2] }, update: {},
        create: { id: IDS.templateVersions[2], organizationId: IDS.org, templateId: IDS.templates[2], versionNumber: 1, name: 'Encerramento Anual v1.0', description: 'Versão inicial do template de encerramento anual', stages: templateAnual.stages, publishedAt: todayPlus(-80), publishedBy: IDS.users[0], isCurrent: true },
      }),
      db.templateVersion.upsert({
        where: { id: IDS.templateVersions[3] }, update: {},
        create: { id: IDS.templateVersions[3], organizationId: IDS.org, templateId: IDS.templates[0], versionNumber: 2, name: 'Mensal Contábil v2.0', description: 'Adicionada tarefa de revisão de lançamentos', stages: templateMensal.stages, publishedAt: todayPlus(-10), publishedBy: IDS.users[1], isCurrent: false },
      }),
      db.templateVersion.upsert({
        where: { id: IDS.templateVersions[4] }, update: {},
        create: { id: IDS.templateVersions[4], organizationId: IDS.org, templateId: IDS.templates[1], versionNumber: 2, name: 'Obrigações Fiscais v2.0', description: 'Atualizado para nova versão do SPED', stages: templateFiscais.stages, publishedAt: todayPlus(-5), publishedBy: IDS.users[2], isCurrent: false },
      }),
    ])

    // ══════════════════════════════════════════════════════
    // 13. TEMPLATE APPLICATIONS (10)
    // ══════════════════════════════════════════════════════
    const applicationsData = [
      { id: IDS.applications[0], templateId: IDS.templates[0], templateVersionId: IDS.templateVersions[0], clientId: IDS.clients[0], baseDate: daysAgo(30), appliedBy: IDS.users[1] },
      { id: IDS.applications[1], templateId: IDS.templates[0], templateVersionId: IDS.templateVersions[0], clientId: IDS.clients[1], baseDate: daysAgo(30), appliedBy: IDS.users[1] },
      { id: IDS.applications[2], templateId: IDS.templates[0], templateVersionId: IDS.templateVersions[0], clientId: IDS.clients[2], baseDate: daysAgo(30), appliedBy: IDS.users[0] },
      { id: IDS.applications[3], templateId: IDS.templates[1], templateVersionId: IDS.templateVersions[1], clientId: IDS.clients[0], baseDate: daysAgo(30), appliedBy: IDS.users[2] },
      { id: IDS.applications[4], templateId: IDS.templates[1], templateVersionId: IDS.templateVersions[1], clientId: IDS.clients[1], baseDate: daysAgo(30), appliedBy: IDS.users[2] },
      { id: IDS.applications[5], templateId: IDS.templates[1], templateVersionId: IDS.templateVersions[1], clientId: IDS.clients[3], baseDate: daysAgo(30), appliedBy: IDS.users[4] },
      { id: IDS.applications[6], templateId: IDS.templates[1], templateVersionId: IDS.templateVersions[1], clientId: IDS.clients[4], baseDate: daysAgo(30), appliedBy: IDS.users[4] },
      { id: IDS.applications[7], templateId: IDS.templates[1], templateVersionId: IDS.templateVersions[1], clientId: IDS.clients[5], baseDate: daysAgo(30), appliedBy: IDS.users[2] },
      { id: IDS.applications[8], templateId: IDS.templates[2], templateVersionId: IDS.templateVersions[2], clientId: IDS.clients[0], baseDate: daysAgo(365), appliedBy: IDS.users[0] },
      { id: IDS.applications[9], templateId: IDS.templates[2], templateVersionId: IDS.templateVersions[2], clientId: IDS.clients[2], baseDate: daysAgo(365), appliedBy: IDS.users[0] },
    ]

    await Promise.all(
      applicationsData.map((a) =>
        db.templateApplication.upsert({
          where: { id: a.id }, update: {},
          create: { ...a, organizationId: IDS.org, status: 'active', variables: '{}' },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 14. TASKS (80) from applications
    // ══════════════════════════════════════════════════════
    const taskDefs: Array<{
      id: string; appIdx: number; stageIdx: number; taskIdx: number;
      title: string; status: string; priority: string; assignedTo: string;
      dueOffset: number; completedOffset?: number;
      checklist: string[];
    }> = [
      // App 0: Mensal Contábil → Tech Solutions (mostly completed)
      { id: 't001', appIdx: 0, stageIdx: 0, taskIdx: 0, title: 'Obter extratos bancários', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -25, completedOffset: -26, checklist: ['Conta corrente principal', 'Conta investimento', 'Cartão de crédito'] },
      { id: 't002', appIdx: 0, stageIdx: 0, taskIdx: 1, title: 'Conciliar movimentações', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -22, completedOffset: -23, checklist: ['Receitas conciliadas', 'Despesas conciliadas', 'Transferências verificadas', 'Saldos conferidos'] },
      { id: 't003', appIdx: 0, stageIdx: 0, taskIdx: 2, title: 'Registrar divergências', status: 'concluida', priority: 'medium', assignedTo: 'Ana Costa', dueOffset: -22, completedOffset: -24, checklist: ['Divergências listadas', 'Cliente notificado'] },
      { id: 't004', appIdx: 0, stageIdx: 1, taskIdx: 0, title: 'Lançar recibos e notas fiscais de entrada', status: 'concluida', priority: 'high', assignedTo: 'Maria Oliveira', dueOffset: -18, completedOffset: -19, checklist: ['NF-e de serviços', 'NF-e de produtos', 'Cupons fiscais', 'Notas de energia/telecom'] },
      { id: 't005', appIdx: 0, stageIdx: 1, taskIdx: 1, title: 'Lançar notas fiscais de saída', status: 'concluida', priority: 'high', assignedTo: 'Maria Oliveira', dueOffset: -18, completedOffset: -20, checklist: ['Todas as NF-e do mês registradas', 'ICMS e IPI calculados'] },
      { id: 't006', appIdx: 0, stageIdx: 1, taskIdx: 2, title: 'Apurar impostos', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -15, completedOffset: -16, checklist: ['PIS apurado', 'COFINS apurado', 'IRPJ calculado', 'CSLL calculado'] },
      { id: 't007', appIdx: 0, stageIdx: 1, taskIdx: 3, title: 'Fechar balancete de verificação', status: 'concluida', priority: 'medium', assignedTo: 'Ana Costa', dueOffset: -12, completedOffset: -13, checklist: ['Balancete gerado', 'Saldo anterior confere', 'Lançamentos revisados'] },
      { id: 't008', appIdx: 0, stageIdx: 2, taskIdx: 0, title: 'Gerar DRE', status: 'concluida', priority: 'medium', assignedTo: 'Carlos Silva', dueOffset: -8, completedOffset: -9, checklist: ['DRE gerado', 'Receitas verificadas', 'Despesas categorizadas', 'Resultado líquido calculado'] },
      { id: 't009', appIdx: 0, stageIdx: 2, taskIdx: 1, title: 'Enviar relatórios ao cliente', status: 'concluida', priority: 'low', assignedTo: 'Ana Costa', dueOffset: -5, completedOffset: -6, checklist: ['DRE enviado', 'Balanço patrimonial enviado', 'Fluxo de caixa enviado'] },

      // App 1: Mensal Contábil → Comércio Vida (in progress)
      { id: 't010', appIdx: 1, stageIdx: 0, taskIdx: 0, title: 'Obter extratos bancários', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -25, completedOffset: -27, checklist: ['Conta corrente principal', 'Conta investimento'] },
      { id: 't011', appIdx: 1, stageIdx: 0, taskIdx: 1, title: 'Conciliar movimentações', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -22, completedOffset: -24, checklist: ['Receitas conciliadas', 'Despesas conciliadas'] },
      { id: 't012', appIdx: 1, stageIdx: 0, taskIdx: 2, title: 'Registrar divergências', status: 'a_fazer', priority: 'medium', assignedTo: 'Ana Costa', dueOffset: -22, checklist: ['Divergências listadas', 'Cliente notificado'] },
      { id: 't013', appIdx: 1, stageIdx: 1, taskIdx: 0, title: 'Lançar recibos e notas fiscais de entrada', status: 'em_andamento', priority: 'high', assignedTo: 'Maria Oliveira', dueOffset: -18, checklist: ['NF-e de serviços', 'NF-e de produtos', 'Cupons fiscais'] },
      { id: 't014', appIdx: 1, stageIdx: 1, taskIdx: 1, title: 'Lançar notas fiscais de saída', status: 'a_fazer', priority: 'high', assignedTo: 'Maria Oliveira', dueOffset: -18, checklist: ['Todas as NF-e do mês registradas'] },
      { id: 't015', appIdx: 1, stageIdx: 1, taskIdx: 2, title: 'Apurar impostos', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -15, checklist: ['PIS apurado', 'COFINS apurado'] },
      { id: 't016', appIdx: 1, stageIdx: 1, taskIdx: 3, title: 'Fechar balancete de verificação', status: 'a_fazer', priority: 'medium', assignedTo: 'Ana Costa', dueOffset: -12, checklist: ['Balancete gerado'] },
      { id: 't017', appIdx: 1, stageIdx: 2, taskIdx: 0, title: 'Gerar DRE', status: 'a_fazer', priority: 'medium', assignedTo: 'Carlos Silva', dueOffset: -8, checklist: ['DRE gerado'] },
      { id: 't018', appIdx: 1, stageIdx: 2, taskIdx: 1, title: 'Enviar relatórios ao cliente', status: 'a_fazer', priority: 'low', assignedTo: 'Ana Costa', dueOffset: -5, checklist: [] },

      // App 2: Mensal Contábil → Indústria Forte (overdue)
      { id: 't019', appIdx: 2, stageIdx: 0, taskIdx: 0, title: 'Obter extratos bancários', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -28, completedOffset: -29, checklist: [] },
      { id: 't020', appIdx: 2, stageIdx: 0, taskIdx: 1, title: 'Conciliar movimentações', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -25, completedOffset: -26, checklist: [] },
      { id: 't021', appIdx: 2, stageIdx: 1, taskIdx: 0, title: 'Lançar recibos e notas fiscais de entrada', status: 'em_andamento', priority: 'high', assignedTo: 'João Lima', dueOffset: -20, checklist: ['NF-e de produtos'] },
      { id: 't022', appIdx: 2, stageIdx: 1, taskIdx: 1, title: 'Lançar notas fiscais de saída', status: 'a_fazer', priority: 'high', assignedTo: 'João Lima', dueOffset: -20, checklist: [] },
      { id: 't023', appIdx: 2, stageIdx: 1, taskIdx: 2, title: 'Apurar impostos', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -17, checklist: [] },
      { id: 't024', appIdx: 2, stageIdx: 1, taskIdx: 3, title: 'Fechar balancete de verificação', status: 'a_fazer', priority: 'medium', assignedTo: 'Ana Costa', dueOffset: -14, checklist: [] },
      { id: 't025', appIdx: 2, stageIdx: 2, taskIdx: 0, title: 'Gerar DRE', status: 'a_fazer', priority: 'medium', assignedTo: 'Carlos Silva', dueOffset: -10, checklist: [] },
      { id: 't026', appIdx: 2, stageIdx: 2, taskIdx: 1, title: 'Enviar relatórios ao cliente', status: 'a_fazer', priority: 'low', assignedTo: 'Ana Costa', dueOffset: -7, checklist: [] },

      // App 3: Obrigações Fiscais → Tech Solutions (completed)
      { id: 't027', appIdx: 3, stageIdx: 0, taskIdx: 0, title: 'Exportar SPED Fiscal (ICMS/IPI)', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -12, completedOffset: -14, checklist: [] },
      { id: 't028', appIdx: 3, stageIdx: 0, taskIdx: 1, title: 'Transmitir SPED Fiscal', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -12, completedOffset: -13, checklist: [] },
      { id: 't029', appIdx: 3, stageIdx: 0, taskIdx: 2, title: 'Verificar SPED Contribuições (PIS/COFINS)', status: 'concluida', priority: 'high', assignedTo: 'João Lima', dueOffset: -17, completedOffset: -18, checklist: [] },
      { id: 't030', appIdx: 3, stageIdx: 1, taskIdx: 0, title: 'Gerar guia de ICMS', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -17, completedOffset: -18, checklist: [] },
      { id: 't031', appIdx: 3, stageIdx: 1, taskIdx: 1, title: 'Gerar guia de ISS', status: 'concluida', priority: 'medium', assignedTo: 'João Lima', dueOffset: -17, completedOffset: -19, checklist: [] },
      { id: 't032', appIdx: 3, stageIdx: 2, taskIdx: 0, title: 'Gerar DARF de PIS', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -7, completedOffset: -8, checklist: [] },
      { id: 't033', appIdx: 3, stageIdx: 2, taskIdx: 1, title: 'Gerar DARF de COFINS', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -7, completedOffset: -9, checklist: [] },
      { id: 't034', appIdx: 3, stageIdx: 2, taskIdx: 2, title: 'Gerar DARF de IRPJ e CSLL', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -7, completedOffset: -8, checklist: [] },

      // App 4: Obrigações Fiscais → Comércio Vida (in progress)
      { id: 't035', appIdx: 4, stageIdx: 0, taskIdx: 0, title: 'Exportar SPED Fiscal (ICMS/IPI)', status: 'em_andamento', priority: 'high', assignedTo: 'João Lima', dueOffset: -10, checklist: [] },
      { id: 't036', appIdx: 4, stageIdx: 0, taskIdx: 1, title: 'Transmitir SPED Fiscal', status: 'a_fazer', priority: 'high', assignedTo: 'João Lima', dueOffset: -10, checklist: [] },
      { id: 't037', appIdx: 4, stageIdx: 0, taskIdx: 2, title: 'Verificar SPED Contribuições (PIS/COFINS)', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -15, completedOffset: -16, checklist: [] },
      { id: 't038', appIdx: 4, stageIdx: 1, taskIdx: 0, title: 'Gerar guia de ICMS', status: 'a_fazer', priority: 'high', assignedTo: 'João Lima', dueOffset: -15, checklist: [] },
      { id: 't039', appIdx: 4, stageIdx: 2, taskIdx: 0, title: 'Gerar DARF de PIS', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -5, checklist: [] },
      { id: 't040', appIdx: 4, stageIdx: 2, taskIdx: 1, title: 'Gerar DARF de COFINS', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -5, checklist: [] },
      { id: 't041', appIdx: 4, stageIdx: 2, taskIdx: 2, title: 'Gerar DARF de IRPJ e CSLL', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -5, checklist: [] },

      // App 5: Fiscais → Consultoria Brasil (some done)
      { id: 't042', appIdx: 5, stageIdx: 0, taskIdx: 0, title: 'Exportar SPED Fiscal (ICMS/IPI)', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -14, completedOffset: -15, checklist: [] },
      { id: 't043', appIdx: 5, stageIdx: 0, taskIdx: 1, title: 'Transmitir SPED Fiscal', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -14, completedOffset: -15, checklist: [] },
      { id: 't044', appIdx: 5, stageIdx: 1, taskIdx: 0, title: 'Gerar guia de ICMS', status: 'a_fazer', priority: 'high', assignedTo: 'João Lima', dueOffset: -14, checklist: [] },
      { id: 't045', appIdx: 5, stageIdx: 2, taskIdx: 0, title: 'Gerar DARF de PIS', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -4, checklist: [] },
      { id: 't046', appIdx: 5, stageIdx: 2, taskIdx: 1, title: 'Gerar DARF de COFINS', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -4, checklist: [] },
      { id: 't047', appIdx: 5, stageIdx: 2, taskIdx: 2, title: 'Gerar DARF de IRPJ e CSLL', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -4, checklist: [] },

      // App 6: Fiscais → Restaurante
      { id: 't048', appIdx: 6, stageIdx: 0, taskIdx: 0, title: 'Exportar SPED Fiscal (ICMS/IPI)', status: 'em_andamento', priority: 'high', assignedTo: 'João Lima', dueOffset: -9, checklist: [] },
      { id: 't049', appIdx: 6, stageIdx: 0, taskIdx: 1, title: 'Transmitir SPED Fiscal', status: 'a_fazer', priority: 'high', assignedTo: 'João Lima', dueOffset: -9, checklist: [] },
      { id: 't050', appIdx: 6, stageIdx: 1, taskIdx: 0, title: 'Gerar guia de ISS', status: 'a_fazer', priority: 'medium', assignedTo: 'João Lima', dueOffset: -14, checklist: [] },
      { id: 't051', appIdx: 6, stageIdx: 2, taskIdx: 0, title: 'Gerar DARF de PIS', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -3, checklist: [] },
      { id: 't052', appIdx: 6, stageIdx: 2, taskIdx: 1, title: 'Gerar DARF de COFINS', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -3, checklist: [] },
      { id: 't053', appIdx: 6, stageIdx: 2, taskIdx: 2, title: 'Gerar DARF de IRPJ e CSLL', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -3, checklist: [] },

      // App 7: Fiscais → Construtora
      { id: 't054', appIdx: 7, stageIdx: 0, taskIdx: 0, title: 'Exportar SPED Fiscal (ICMS/IPI)', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -8, checklist: [] },
      { id: 't055', appIdx: 7, stageIdx: 0, taskIdx: 1, title: 'Transmitir SPED Fiscal', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -8, checklist: [] },
      { id: 't056', appIdx: 7, stageIdx: 1, taskIdx: 0, title: 'Gerar guia de ICMS', status: 'a_fazer', priority: 'high', assignedTo: 'João Lima', dueOffset: -13, checklist: [] },
      { id: 't057', appIdx: 7, stageIdx: 2, taskIdx: 0, title: 'Gerar DARF de PIS', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -2, checklist: [] },
      { id: 't058', appIdx: 7, stageIdx: 2, taskIdx: 1, title: 'Gerar DARF de COFINS', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -2, checklist: [] },
      { id: 't059', appIdx: 7, stageIdx: 2, taskIdx: 2, title: 'Gerar DARF de IRPJ e CSLL', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -2, checklist: [] },

      // App 8: Anual → Tech Solutions (all done)
      { id: 't060', appIdx: 8, stageIdx: 0, taskIdx: 0, title: 'Levantar inventário de estoque', status: 'concluida', priority: 'high', assignedTo: 'Carlos Silva', dueOffset: -340, completedOffset: -345, checklist: [] },
      { id: 't061', appIdx: 8, stageIdx: 0, taskIdx: 1, title: 'Conciliar saldos contábeis', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -310, completedOffset: -312, checklist: [] },
      { id: 't062', appIdx: 8, stageIdx: 0, taskIdx: 2, title: 'Elaborar balanço patrimonial', status: 'concluida', priority: 'high', assignedTo: 'Carlos Silva', dueOffset: -280, completedOffset: -285, checklist: [] },
      { id: 't063', appIdx: 8, stageIdx: 0, taskIdx: 3, title: 'Obter aprovação do balanço', status: 'concluida', priority: 'high', assignedTo: 'Carlos Silva', dueOffset: -280, completedOffset: -282, checklist: [] },
      { id: 't064', appIdx: 8, stageIdx: 1, taskIdx: 0, title: 'Consolidar impostos do ano', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -270, completedOffset: -275, checklist: [] },
      { id: 't065', appIdx: 8, stageIdx: 1, taskIdx: 1, title: 'Transmitir DCTF', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -260, completedOffset: -262, checklist: [] },
      { id: 't066', appIdx: 8, stageIdx: 2, taskIdx: 0, title: 'Preparar dados para ECF', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -250, completedOffset: -253, checklist: [] },
      { id: 't067', appIdx: 8, stageIdx: 2, taskIdx: 1, title: 'Gerar e validar ECF', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -245, completedOffset: -248, checklist: [] },
      { id: 't068', appIdx: 8, stageIdx: 2, taskIdx: 2, title: 'Transmitir ECF', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -240, completedOffset: -241, checklist: [] },
      { id: 't069', appIdx: 8, stageIdx: 3, taskIdx: 0, title: 'Apurar IRPJ e CSLL anual', status: 'concluida', priority: 'high', assignedTo: 'Carlos Silva', dueOffset: -240, completedOffset: -243, checklist: [] },
      { id: 't070', appIdx: 8, stageIdx: 3, taskIdx: 1, title: 'Gerar DARFs de ajuste anual', status: 'concluida', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -235, completedOffset: -237, checklist: [] },

      // App 9: Anual → Indústria Forte (some overdue)
      { id: 't071', appIdx: 9, stageIdx: 0, taskIdx: 0, title: 'Levantar inventário de estoque', status: 'concluida', priority: 'high', assignedTo: 'Carlos Silva', dueOffset: -350, completedOffset: -355, checklist: [] },
      { id: 't072', appIdx: 9, stageIdx: 0, taskIdx: 1, title: 'Conciliar saldos contábeis', status: 'concluida', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -320, completedOffset: -322, checklist: [] },
      { id: 't073', appIdx: 9, stageIdx: 0, taskIdx: 2, title: 'Elaborar balanço patrimonial', status: 'em_andamento', priority: 'high', assignedTo: 'Carlos Silva', dueOffset: -290, checklist: [] },
      { id: 't074', appIdx: 9, stageIdx: 0, taskIdx: 3, title: 'Obter aprovação do balanço', status: 'a_fazer', priority: 'high', assignedTo: 'Carlos Silva', dueOffset: -290, checklist: [] },
      { id: 't075', appIdx: 9, stageIdx: 1, taskIdx: 0, title: 'Consolidar impostos do ano', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -280, checklist: [] },
      { id: 't076', appIdx: 9, stageIdx: 1, taskIdx: 1, title: 'Transmitir DCTF', status: 'a_fazer', priority: 'high', assignedTo: 'Pedro Santos', dueOffset: -270, checklist: [] },
      { id: 't077', appIdx: 9, stageIdx: 2, taskIdx: 0, title: 'Preparar dados para ECF', status: 'a_fazer', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -260, checklist: [] },
      { id: 't078', appIdx: 9, stageIdx: 2, taskIdx: 1, title: 'Gerar e validar ECF', status: 'a_fazer', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -250, checklist: [] },
      { id: 't079', appIdx: 9, stageIdx: 2, taskIdx: 2, title: 'Transmitir ECF', status: 'a_fazer', priority: 'high', assignedTo: 'Ana Costa', dueOffset: -250, checklist: [] },
      { id: 't080', appIdx: 9, stageIdx: 3, taskIdx: 0, title: 'Apurar IRPJ e CSLL anual', status: 'a_fazer', priority: 'high', assignedTo: 'Carlos Silva', dueOffset: -250, checklist: [] },
    ]

    // Create tasks and checklists
    for (const td of taskDefs) {
      const app = applicationsData[td.appIdx]
      const dueDate = td.dueOffset !== undefined ? todayPlus(td.dueOffset) : null
      const completedAt = td.status === 'concluida' && td.completedOffset !== undefined ? todayPlus(td.completedOffset) : null

      await db.task.upsert({
        where: { id: td.id },
        update: {},
        create: {
          id: td.id,
          organizationId: IDS.org,
          clientId: app.clientId,
          title: td.title,
          status: td.status,
          priority: td.priority,
          assignedTo: td.assignedTo,
          templateId: app.templateId,
          templateVersionId: app.templateVersionId,
          templateApplicationId: app.id,
          templateStageIndex: td.stageIdx,
          templateTaskIndex: td.taskIdx,
          dueDate,
          completedAt,
          category: 'template_task',
          departmentId: td.appIdx <= 2 ? IDS.departments[1] : IDS.departments[0],
          checklist: {
            create: td.checklist.map((text, idx) => ({
              text,
              done: td.status === 'concluida',
              required: idx < 2,
              order: idx,
            })),
          },
        },
      })
    }

    // ══════════════════════════════════════════════════════
    // 15. DOCUMENTS (30)
    // ══════════════════════════════════════════════════════
    const docStatuses = ['approved', 'pending', 'approved', 'approved', 'rejected', 'pending', 'approved', 'pending']
    const docMonths = ['01/2025', '01/2025', '12/2024', '01/2025', '01/2025', '02/2025', '12/2024', '01/2025']
    const docsData = [
      { id: 'doc-001', clientId: IDS.clients[0], typeId: IDS.documentTypes[0], name: 'NF-e Entrada - Fornecedor ABC', status: 'approved', competence: '01/2025' },
      { id: 'doc-002', clientId: IDS.clients[0], typeId: IDS.documentTypes[1], name: 'Balancete Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-003', clientId: IDS.clients[0], typeId: IDS.documentTypes[2], name: 'DARF PIS Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-004', clientId: IDS.clients[0], typeId: IDS.documentTypes[2], name: 'DARF COFINS Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-005', clientId: IDS.clients[1], typeId: IDS.documentTypes[0], name: 'NF-e Compras Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-006', clientId: IDS.clients[1], typeId: IDS.documentTypes[1], name: 'Balancete Dez/2024', status: 'approved', competence: '12/2024' },
      { id: 'doc-007', clientId: IDS.clients[2], typeId: IDS.documentTypes[0], name: 'NF-e Industrial Dez/2024', status: 'approved', competence: '12/2024' },
      { id: 'doc-008', clientId: IDS.clients[2], typeId: IDS.documentTypes[2], name: 'DARF IRPJ Estimativa Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-009', clientId: IDS.clients[2], typeId: IDS.documentTypes[2], name: 'DARF CSLL Estimativa Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-010', clientId: IDS.clients[2], typeId: IDS.documentTypes[1], name: 'Balancete Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-011', clientId: IDS.clients[3], typeId: IDS.documentTypes[0], name: 'NF-e Serviços Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-012', clientId: IDS.clients[3], typeId: IDS.documentTypes[2], name: 'DARF IRPJ Trimestral 4º/2024', status: 'approved', competence: '12/2024' },
      { id: 'doc-013', clientId: IDS.clients[4], typeId: IDS.documentTypes[0], name: 'Cupons Fiscais Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-014', clientId: IDS.clients[4], typeId: IDS.documentTypes[1], name: 'Balancete Jan/2025', status: 'rejected', competence: '01/2025' },
      { id: 'doc-015', clientId: IDS.clients[5], typeId: IDS.documentTypes[0], name: 'NF-e Material Construção', status: 'pending', competence: '01/2025' },
      { id: 'doc-016', clientId: IDS.clients[5], typeId: IDS.documentTypes[2], name: 'DARF PIS Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-017', clientId: IDS.clients[6], typeId: IDS.documentTypes[3], name: 'Guia INSS Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-018', clientId: IDS.clients[6], typeId: IDS.documentTypes[1], name: 'Balancete Dez/2024', status: 'approved', competence: '12/2024' },
      { id: 'doc-019', clientId: IDS.clients[7], typeId: IDS.documentTypes[0], name: 'NF-e Combustíveis Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-020', clientId: IDS.clients[8], typeId: IDS.documentTypes[1], name: 'Balancete Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-021', clientId: IDS.clients[9], typeId: IDS.documentTypes[0], name: 'Nota Fiscal Venda Grãos', status: 'approved', competence: '01/2025' },
      { id: 'doc-022', clientId: IDS.clients[9], typeId: IDS.documentTypes[2], name: 'DARF FUNRURAL Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-023', clientId: IDS.clients[11], typeId: IDS.documentTypes[0], name: 'NF-e Peças Automotivas', status: 'approved', competence: '01/2025' },
      { id: 'doc-024', clientId: IDS.clients[14], typeId: IDS.documentTypes[0], name: 'Nota Fiscal Compra Ouro', status: 'approved', competence: '01/2025' },
      { id: 'doc-025', clientId: IDS.clients[15], typeId: IDS.documentTypes[1], name: 'Balancete Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-026', clientId: IDS.clients[16], typeId: IDS.documentTypes[3], name: 'Guia FGTS Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-027', clientId: IDS.clients[18], typeId: IDS.documentTypes[0], name: 'NF-e Compras Mercado Jan/2025', status: 'approved', competence: '01/2025' },
      { id: 'doc-028', clientId: IDS.clients[19], typeId: IDS.documentTypes[1], name: 'Balancete Jan/2025', status: 'pending', competence: '01/2025' },
      { id: 'doc-029', clientId: IDS.clients[0], typeId: IDS.documentTypes[4], name: 'Contrato Social Atualizado', status: 'approved', competence: null },
      { id: 'doc-030', clientId: IDS.clients[2], typeId: IDS.documentTypes[4], name: 'Alteração Contratual 2024', status: 'approved', competence: null },
    ]

    await Promise.all(
      docsData.map((d) =>
        db.document.upsert({
          where: { id: d.id }, update: {},
          create: {
            ...d,
            organizationId: IDS.org,
            issueDate: d.competence ? `01/${d.competence}` : daysAgo(180),
            portalVisible: d.status === 'approved',
            fileSize: Math.floor(Math.random() * 500000) + 50000,
            mimeType: 'application/pdf',
          },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 16. DOCUMENT REQUESTS (10)
    // ══════════════════════════════════════════════════════
    const docRequestsData = [
      { id: 'dreq-001', clientId: IDS.clients[0], title: 'Extratos bancários Fevereiro/2025', status: 'solicitado', requestedBy: IDS.users[1], dueDate: daysFromNow(5) },
      { id: 'dreq-002', clientId: IDS.clients[1], title: 'Notas de energia elétrica Jan/2025', status: 'recebido', requestedBy: IDS.users[3], dueDate: daysFromNow(3) },
      { id: 'dreq-003', clientId: IDS.clients[2], title: 'Relatório de estoque Fevereiro', status: 'solicitado', requestedBy: IDS.users[2], dueDate: daysFromNow(10) },
      { id: 'dreq-004', clientId: IDS.clients[3], title: 'Contratos de prestação de serviço', status: 'aprovado', requestedBy: IDS.users[1], dueDate: daysAgo(10) },
      { id: 'dreq-005', clientId: IDS.clients[5], title: 'Notas fiscais de compra de material', status: 'solicitado', requestedBy: IDS.users[4], dueDate: daysFromNow(7) },
      { id: 'dreq-006', clientId: IDS.clients[6], title: 'Folha de pagamento Jan/2025', status: 'recebido', requestedBy: IDS.users[3], dueDate: daysFromNow(2) },
      { id: 'dreq-007', clientId: IDS.clients[8], title: 'Comprovantes de pagamento mensalidades', status: 'rejeitado', rejectionReason: 'Documento ilegível. Favor reenviar.', requestedBy: IDS.users[3], dueDate: daysAgo(5) },
      { id: 'dreq-008', clientId: IDS.clients[9], title: 'Notas de venda de grãos Safra 2024/25', status: 'solicitado', requestedBy: IDS.users[2], dueDate: daysFromNow(15) },
      { id: 'dreq-009', clientId: IDS.clients[11], title: 'Notas fiscais de compra de peças', status: 'recebido', requestedBy: IDS.users[4], dueDate: daysFromNow(4) },
      { id: 'dreq-010', clientId: IDS.clients[14], title: 'Notas fiscais de compra de ouro', status: 'aprovado', requestedBy: IDS.users[1], dueDate: daysAgo(3) },
    ]

    await Promise.all(
      docRequestsData.map((dr) =>
        db.documentRequest.upsert({
          where: { id: dr.id }, update: {},
          create: {
            ...dr,
            organizationId: IDS.org,
            instructions: 'Por favor, envie o documento em formato PDF de boa qualidade.',
          },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 17. CALENDAR EVENTS (5)
    // ══════════════════════════════════════════════════════
    const calendarEvents = [
      { id: 'cal-001', title: 'Entrega SPED Fiscal - Jan/2025', description: 'Prazo final para entrega do SPED Fiscal referente a janeiro/2025', startDate: new Date('2025-02-20T23:59:00'), color: '#ef4444', type: 'deadline', createdById: IDS.users[0] },
      { id: 'cal-002', title: 'Reunião com Tech Solutions', description: 'Revisão mensal de resultados e planejamento', startDate: new Date('2025-02-15T10:00:00'), endDate: new Date('2025-02-15T11:30:00'), color: '#3b82f6', type: 'meeting', createdById: IDS.users[1] },
      { id: 'cal-003', title: 'Vencimento DARF PIS/COFINS', description: 'Vencimento dos DARFs de PIS e COFINS - Janeiro/2025', startDate: new Date('2025-02-25T23:59:00'), color: '#f59e0b', type: 'deadline', createdById: IDS.users[2] },
      { id: 'cal-004', title: 'Treinamento interno - Novo SPED', description: 'Treinamento da equipe sobre atualizações do SPED Fiscal 2025', startDate: new Date('2025-02-18T14:00:00'), endDate: new Date('2025-02-18T16:00:00'), color: '#10b981', type: 'internal', createdById: IDS.users[0] },
      { id: 'cal-005', title: 'Entrega ECD - Exercício 2024', description: 'Prazo final para entrega da Escrituração Contábil Digital', startDate: new Date('2025-06-30T23:59:00'), color: '#ef4444', type: 'deadline', createdById: IDS.users[0] },
    ]

    await Promise.all(
      calendarEvents.map((e) =>
        db.calendarEvent.upsert({
          where: { id: e.id }, update: {},
          create: { ...e, organizationId: IDS.org },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 18. HOLIDAYS 2026 (5)
    // ══════════════════════════════════════════════════════
    const holidays = [
      { id: 'hol-001', name: 'Confraternização Universal', date: '2026-01-01' },
      { id: 'hol-002', name: 'Carnaval', date: '2026-02-17' },
      { id: 'hol-003', name: 'Sexta-feira Santa', date: '2026-04-03' },
      { id: 'hol-004', name: 'Tiradentes', date: '2026-04-21' },
      { id: 'hol-005', name: 'Dia do Trabalho', date: '2026-05-01' },
    ]

    await Promise.all(
      holidays.map((h) =>
        db.holiday.upsert({
          where: { id: h.id }, update: {},
          create: { ...h, organizationId: IDS.org },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 19. NOTIFICATIONS (20 for user 1)
    // ══════════════════════════════════════════════════════
    const notificationsData = [
      { title: 'Tarefa concluída', message: 'Ana Costa concluiu "Conciliar movimentações" para Tech Solutions', type: 'task_completed', priority: 'normal', link: '/app/tarefas?id=t002', read: true },
      { title: 'Prazo próximo', message: 'SPED Fiscal - Jan/2025 vence em 2 dias', type: 'deadline', priority: 'high', link: '/app/calendario', read: true },
      { title: 'Documento recebido', message: 'Novo documento recebido de Comércio Vida e Saúde', type: 'document', priority: 'normal', link: '/app/documentos', read: true },
      { title: 'Novo cliente cadastrado', message: 'Estúdio Design Criativo foi adicionado à base', type: 'client', priority: 'normal', link: '/app/empresas?id=client-estudio-design', read: true },
      { title: 'Tarefa atribuída', message: 'Pedro Santos atribuiu "Exportar SPED Fiscal" a você', type: 'task_assigned', priority: 'normal', link: '/app/tarefas?id=t035', read: true },
      { title: 'Template publicado', message: 'O template "Obrigações Fiscais Mensais" foi publicado', type: 'template', priority: 'low', link: '/app/templates?id=tmpl-obrigacoes-fiscais', read: true },
      { title: 'DARF vencendo', message: 'DARF PIS de Tech Solutions vence amanhã', type: 'deadline', priority: 'high', link: '/app/tarefas', read: false },
      { title: 'Tarefa atrasada', message: '"Lançar notas fiscais" para Indústria Forte está atrasada há 5 dias', type: 'overdue', priority: 'high', link: '/app/tarefas?id=t021', read: false },
      { title: 'Solicitação de documento', message: 'Carlos Silva solicitou extratos bancários de Tech Solutions', type: 'document_request', priority: 'normal', link: '/app/documentos/solicitar', read: false },
      { title: 'Membro da equipe', message: 'João Lima acessou a plataforma pela primeira vez', type: 'team', priority: 'low', link: '/app/equipe', read: false },
      { title: 'Relatório disponível', message: 'Relatório mensal de produtividade de Janeiro já está disponível', type: 'report', priority: 'normal', link: '/app/relatorios', read: false },
      { title: 'Cliente inadimplente', message: 'Construtora Horizonte tem pagamento pendente há 15 dias', type: 'billing', priority: 'high', link: '/app/empresas?id=client-construtora-horizonte', read: false },
      { title: 'Novo comentário', message: 'Pedro Santos comentou em "Gerar guia de ICMS" para Tech Solutions', type: 'comment', priority: 'normal', link: '/app/tarefas?id=t030', read: false },
      { title: 'Checklist atualizado', message: 'Maria Oliveira completou 3 itens em "Lançar NF-e de entrada"', type: 'task_update', priority: 'normal', link: '/app/tarefas?id=t013', read: false },
      { title: 'Tarefa concluída', message: 'Pedro Santos concluiu "Transmitir DCTF" para Tech Solutions', type: 'task_completed', priority: 'normal', link: '/app/tarefas?id=t065', read: false },
      { title: 'SPED transmitido', message: 'SPED Fiscal de Tech Solutions transmitido com sucesso', type: 'sped', priority: 'normal', link: '/app/tarefas', read: false },
      { title: 'Reunião agendada', message: 'Reunião com Tech Solutions em 15/02 às 10h', type: 'calendar', priority: 'normal', link: '/app/calendario', read: false },
      { title: 'Assinatura renovada', message: 'Assinatura Profissional renovada com sucesso', type: 'billing', priority: 'normal', link: '/app/assinatura', read: true },
      { title: 'Novo modelo disponível', message: 'Template "Encerramento Anual" está pronto para uso', type: 'template', priority: 'normal', link: '/app/templates', read: true },
      { title: 'Aviso do sistema', message: 'Atualização do sistema agendada para sábado às 02h', type: 'system', priority: 'low', link: null, read: true },
    ]

    await Promise.all(
      notificationsData.map((n, i) =>
        db.userNotification.upsert({
          where: { id: `notif-${String(i + 1).padStart(3, '0')}` },
          update: {},
          create: {
            id: `notif-${String(i + 1).padStart(3, '0')}`,
            userId: IDS.users[0],
            readAt: n.read ? todayPlus(-i) : null,
            createdAt: todayPlus(-(i * 2)),
            ...n,
          },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 20. AUDIT LOG (10)
    // ══════════════════════════════════════════════════════
    const auditData = [
      { action: 'user.login', entity: 'User', entityId: IDS.users[0], userName: 'Carlos Silva', detail: 'Login realizado' },
      { action: 'client.create', entity: 'Client', entityId: IDS.clients[19], userName: 'Ana Costa', detail: 'Cliente Estúdio Design Criativo criado' },
      { action: 'template.publish', entity: 'Template', entityId: IDS.templates[1], userName: 'Carlos Silva', detail: 'Template Obrigações Fiscais publicado (v1.0)' },
      { action: 'task.complete', entity: 'Task', entityId: 't002', userName: 'Ana Costa', detail: 'Tarefa concluída: Conciliar movimentações' },
      { action: 'document.upload', entity: 'Document', entityId: 'doc-003', userName: 'Pedro Santos', detail: 'DARF PIS Jan/2025 enviado' },
      { action: 'member.invite', entity: 'OrgMember', entityId: IDS.members[4], userName: 'Carlos Silva', detail: 'João Lima convidado para a equipe' },
      { action: 'template.apply', entity: 'TemplateApplication', entityId: IDS.applications[8], userName: 'Carlos Silva', detail: 'Encerramento Anual aplicado a Tech Solutions' },
      { action: 'settings.update', entity: 'Organization', entityId: IDS.org, userName: 'Carlos Silva', detail: 'Configurações da organização atualizadas' },
      { action: 'document.request', entity: 'DocumentRequest', entityId: 'dreq-001', userName: 'Ana Costa', detail: 'Solicitação de extratos bancários criada' },
      { action: 'org.onboarding.complete', entity: 'Organization', entityId: IDS.org, userName: 'Carlos Silva', detail: 'Onboarding concluído' },
    ]

    await Promise.all(
      auditData.map((a, i) =>
        db.auditLog.upsert({
          where: { id: `audit-${String(i + 1).padStart(3, '0')}` },
          update: {},
          create: {
            id: `audit-${String(i + 1).padStart(3, '0')}`,
            userId: IDS.users[0],
            organizationId: IDS.org,
            createdAt: todayPlus(-(i * 5 + 1)),
            ...a,
          },
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // 21. FAQS (5)
    // ══════════════════════════════════════════════════════
    const faqs = [
      { id: 'faq-001', question: 'O que é o Company Radar?', answer: 'O Company Radar é uma plataforma SaaS completa para escritórios de contabilidade. Ele centraliza a gestão de clientes, tarefas, documentos, templates e obrigações acessórias em um só lugar, aumentando a produtividade e reduzindo o risco de multas por atraso.', order: 1 },
      { id: 'faq-002', question: 'Como funcionam os Templates?', answer: 'Os Templates são modelos de trabalho que definem as etapas e tarefas necessárias para cumprir obrigações contábeis e fiscais. Você pode criar templates personalizados com estágios, tarefas com checklist, prazos e documentos obrigatórios. Ao aplicar um template a um cliente, todas as tarefas são geradas automaticamente.', order: 2 },
      { id: 'faq-003', question: 'O que é o Portal do Cliente?', answer: 'O Portal do Cliente é uma área exclusiva onde seus clientes podem acompanhar o andamento das tarefas, visualizar e enviar documentos, acessar relatórios e cronogramas. Isso reduz a troca de e-mails e melhora a transparência no atendimento.', order: 3 },
      { id: 'faq-004', question: 'Quais planos estão disponíveis?', answer: 'Oferecemos 5 planos: Essencial (R$99/mês) para até 25 clientes, Profissional (R$199/mês) para até 100 clientes, Gestão (R$399/mês) para até 300 clientes, Escala (R$699/mês) para até 1.000 clientes e Enterprise (R$999/mês) para clientes ilimitados. Todos incluem suporte e atualizações.', order: 4 },
      { id: 'faq-005', question: 'Meus dados estão seguros?', answer: 'Sim. Utilizamos criptografia de ponta a ponta, backups diários e servidores em data centers certificados. Nosso sistema segue as melhores práticas de segurança da informação e está em conformidade com a LGPD. Seus dados são de sua propriedade e podem ser exportados a qualquer momento.', order: 5 },
    ]

    await Promise.all(
      faqs.map((f) =>
        db.fAQ.upsert({
          where: { id: f.id }, update: {},
          create: f,
        })
      )
    )

    // ══════════════════════════════════════════════════════
    // DONE
    // ══════════════════════════════════════════════════════
    const counts = {
      plans: plans.length,
      org: 1,
      users: users.length,
      departments: departments.length,
      tags: tags.length,
      documentTypes: docTypes.length,
      clients: clients.length,
      contacts: contactsData.length,
      templates: 3,
      templateVersions: 5,
      applications: applicationsData.length,
      tasks: taskDefs.length,
      documents: docsData.length,
      documentRequests: docRequestsData.length,
      calendarEvents: calendarEvents.length,
      holidays: holidays.length,
      notifications: notificationsData.length,
      auditLogs: auditData.length,
      faqs: faqs.length,
    }

    return NextResponse.json({ success: true, message: 'Seed completo', counts })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao executar seed', detail: String(error) },
      { status: 500 }
    )
  }
}
