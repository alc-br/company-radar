# Company Radar

## Especificação funcional e técnica completa do MVP vendável

**Versão:** 1.0  
**Data:** 30 de julho de 2026  
**Público inicial:** escritórios contábeis  
**Base obrigatória:** Company Core  
**Produto:** SaaS multitenant de padronização operacional e controle de prazos

---

## 1. Decisão fundamental e instrução obrigatória

> **REQUISITO OBRIGATÓRIO E NÃO NEGOCIÁVEL:** o desenvolvimento do Company Radar deve começar clonando o repositório existente:
>
> `git clone https://github.com/alc-br/company-core.git`
>
> O agente não deve criar outro projeto do zero, substituir a fundação nem reconstruir autenticação, organizações, permissões, planos, cobranças, cotas, notificações, auditoria, armazenamento, API, filas ou infraestrutura já disponíveis no Company Core.

Depois do clone:

1. entrar em `company-core`;
2. criar branch própria de desenvolvimento;
3. instalar as dependências conforme o `README.md`;
4. executar migrações e testes existentes;
5. mapear os serviços transversais já fornecidos;
6. implementar o domínio do Company Radar em novos apps, mantendo o padrão `models → services → selectors → views/API → tasks`;
7. preservar compatibilidade com os testes e módulos existentes.

O Company Core verificado possui Django 6, Python 3.12, PostgreSQL, Redis, Celery, Django REST Framework, HTMX, Alpine.js, Tailwind/DaisyUI, Stripe, armazenamento S3 compatível, multitenancy, RBAC, auditoria, notificações, cotas, feature flags, API keys e serviços de IA. O MVP reutilizará essa base, mas **não incluirá IA nem monitoramento automático de legislação**.

## 2. Resumo executivo

O Company Radar será um sistema operacional para escritórios contábeis. Cada escritório cria uma organização, cadastra sua equipe e sua carteira de empresas-clientes, transforma procedimentos internos em templates reutilizáveis e aplica esses templates aos clientes.

A aplicação de um template gera tarefas, checklists, documentos esperados, responsáveis, datas e recorrências. O sistema acompanha a execução, cobra pendências, envia alertas e mantém um histórico auditável.

O MVP será vendável porque resolve uma operação completa: substitui planilhas, agendas pessoais, cobranças dispersas e processos dependentes da memória de cada colaborador. A retenção virá do acúmulo de templates próprios, documentos, histórico, rotinas recorrentes e participação cotidiana da equipe e dos clientes.

O produto não afirmará que descobre automaticamente obrigações legais. No MVP, as regras são cadastradas pelo próprio escritório. Isso reduz risco jurídico e permite lançar uma solução confiável.

## 3. Posicionamento

### 3.1 Promessa principal

**Padronize a operação do escritório. Nenhum cliente sem processo, nenhum vencimento esquecido e nenhum documento perdido.**

### 3.2 Resultado prometido

Reduzir para menos de cinco minutos o tempo necessário para estruturar operacionalmente um novo cliente, aplicando templates que criam as rotinas necessárias.

### 3.3 O que o MVP é

- gestor de carteira de empresas-clientes;
- biblioteca privada de templates operacionais;
- gerador de tarefas, prazos, recorrências e checklists;
- central de documentos e pendências;
- calendário compartilhado;
- portal simplificado do cliente;
- painel gerencial e trilha de auditoria;
- SaaS por assinatura com limites por carteira.

### 3.4 O que o MVP não é

- consultoria contábil ou jurídica;
- monitor automático de leis;
- motor oficial de obrigações fiscais;
- substituto de ERP contábil;
- emissor de guias, declarações ou eventos do eSocial;
- marketplace público de templates;
- chatbot ou assistente de IA;
- aplicativo móvel nativo.

### 3.5 Aviso jurídico obrigatório

No cadastro, rodapé, portal e páginas de templates deve constar que o Company Radar é uma ferramenta de organização operacional. Conteúdos, datas e procedimentos são definidos pelo escritório usuário, que permanece responsável por sua validação técnica, legal e contábil.

## 4. Público, usuários e estrutura organizacional

### 4.1 Comprador

Escritórios contábeis, BPOs financeiros, consultorias empresariais e operações semelhantes que administram múltiplos CNPJs.

### 4.2 Hierarquia multitenant

1. **Plataforma Company Radar:** ambiente global administrado pelo operador do SaaS.
2. **Organização:** um escritório assinante e seu isolamento de dados.
3. **Unidade:** filial, sede ou divisão opcional do escritório.
4. **Departamento:** Fiscal, Pessoal, Contábil, Societário, Legalização, SST ou outro.
5. **Equipe:** usuários internos vinculados à organização.
6. **Empresa-cliente:** CNPJ atendido pelo escritório.
7. **Contato do cliente:** pessoa com acesso opcional ao portal.

Uma pessoa pode participar de mais de uma organização, mas deve selecionar uma organização ativa. Toda consulta, gravação, arquivo, busca, tarefa assíncrona e exportação deve ser filtrada pela organização ativa.

### 4.3 Papéis

| Papel | Finalidade |
|---|---|
| Operador da plataforma | Administra planos, organizações, suporte, métricas e configurações globais |
| Proprietário | Titular da assinatura e controle total do escritório |
| Administrador | Configura organização, equipe, templates, clientes e integrações |
| Gestor | Administra carteira, distribui tarefas e consulta relatórios |
| Colaborador | Executa tarefas e acessa apenas o que sua permissão autorizar |
| Financeiro | Consulta assinatura, faturas e cobrança |
| Cliente do escritório | Acessa somente o portal e as empresas explicitamente vinculadas |

Permissões devem ser granulares no padrão `recurso.ação`, incluindo `client.view`, `client.create`, `client.edit`, `client.archive`, `template.publish`, `task.assign`, `document.download`, `billing.manage`, `report.export` e `audit.view`.

## 5. Escopo funcional do MVP

O MVP deverá conter:

1. site público e páginas comerciais;
2. cadastro, login, recuperação, verificação de e-mail e aceite de termos;
3. criação e configuração da organização;
4. convite e gestão de equipe;
5. cadastro e importação de empresas-clientes;
6. contatos e acessos ao portal;
7. departamentos, cargos, equipes, tags e tipos de documentos;
8. editor, publicação, clonagem e versionamento de templates;
9. aplicação de templates aos clientes;
10. tarefas avulsas e geradas, subtarefas/checklists, comentários e anexos;
11. recorrências e regras de data;
12. central de documentos;
13. calendário;
14. dashboard executivo e operacional;
15. central de notificações e preferências;
16. e-mails transacionais e lembretes;
17. portal do cliente;
18. planos, checkout, assinatura, faturas, limites e upgrade;
19. busca global;
20. relatórios e exportações;
21. auditoria;
22. painel administrativo da plataforma;
23. API interna versionada e webhooks essenciais;
24. jobs assíncronos e rotinas agendadas.

## 6. Navegação

### 6.1 Área pública

- Início
- Como funciona
- Recursos
- Planos
- Perguntas frequentes
- Entrar
- Começar agora
- Termos de uso
- Privacidade

### 6.2 Área autenticada

- Visão geral
- Empresas-clientes
- Templates
- Tarefas
- Calendário
- Documentos
- Relatórios
- Equipe
- Notificações
- Assinatura
- Configurações
- Ajuda

### 6.3 Portal do cliente

- Início
- Pendências
- Documentos
- Cronograma
- Comunicados
- Perfil e segurança

## 7. Catálogo completo de telas

### 7.1 Site público

#### PUB-01 — Página inicial

Apresenta proposta de valor, problema resolvido, fluxo “template → cliente → tarefas”, recursos, prova social preparada para futura inclusão, planos resumidos, perguntas frequentes e CTAs. Os CTAs levam ao cadastro ou checkout.

#### PUB-02 — Recursos

Explica carteira, templates, tarefas, documentos, calendário, alertas, portal, relatórios, segurança e separação entre organização operacional e aconselhamento legal.

#### PUB-03 — Planos

Alternância mensal/anual, cartões de planos, limites, recursos comuns, comparação, perguntas frequentes, teste gratuito quando habilitado e CTA de contratação. Os preços devem vir do banco, nunca fixos no HTML.

#### PUB-04 — Checkout

Resumo do plano, periodicidade, preço, impostos quando aplicável, cupom, dados do comprador e redirecionamento seguro ao Stripe Checkout. Não armazenar dados completos de cartão.

#### PUB-05 — Confirmação de compra

Exibe sucesso, plano, próximo passo e botão para criar/configurar a organização. Se o webhook ainda estiver processando, mostrar estado “confirmando pagamento” com atualização segura.

### 7.2 Autenticação

#### AUTH-01 — Cadastro

Campos: nome, sobrenome, e-mail profissional, senha, confirmação, aceite dos Termos e Política. Valida e-mail único, força mínima da senha, consentimentos versionados e captcha configurável.

#### AUTH-02 — Login

E-mail, senha, “lembrar”, recuperação e SSO futuro oculto por feature flag.

#### AUTH-03 — Verificação de e-mail

Reenvio com limite, expiração do token e orientação clara.

#### AUTH-04 — Recuperação e redefinição

Fluxo neutro para não revelar contas existentes; token de uso único e expiração.

#### AUTH-05 — Convite

Apresenta escritório, papel, prazo do convite e criação/entrada na conta.

#### AUTH-06 — Seleção de organização

Exibida somente para usuário pertencente a várias organizações.

### 7.3 Onboarding do escritório

#### ONB-01 — Boas-vindas

Explica quatro passos e mostra progresso salvável.

#### ONB-02 — Dados do escritório

Razão social, nome fantasia, CNPJ, CRC opcional, telefone, e-mail, endereço, fuso horário, logotipo e cor principal.

#### ONB-03 — Estrutura

Criação assistida de departamentos e equipes. Sugestões iniciais: Fiscal, Contábil, Pessoal, Societário e Atendimento.

#### ONB-04 — Importar carteira

Upload CSV/XLSX ou pular. Fornece modelo, pré-visualização, mapeamento de colunas, validação, deduplicação e relatório de erros.

#### ONB-05 — Primeiro template

Escolher template inicial fornecido pela plataforma ou criar vazio. Templates iniciais são exemplos operacionais, não regras oficiais.

#### ONB-06 — Conclusão

Checklist de ativação: escritório configurado, cliente cadastrado, template aplicado, equipe convidada e alertas configurados.

### 7.4 Dashboard

#### DASH-01 — Visão geral

Filtros por período, unidade, departamento, responsável, cliente e tag.

Indicadores:

- empresas ativas;
- tarefas abertas;
- tarefas vencendo hoje;
- atrasadas;
- sem responsável;
- documentos aguardando cliente;
- taxa de conclusão no prazo;
- clientes com maior quantidade de pendências.

Widgets:

- “O que exige atenção hoje”;
- tarefas críticas;
- próximos sete dias;
- atrasos por departamento;
- pendências de documentos;
- atividade recente;
- novos clientes sem template;
- atalhos rápidos.

Cada cartão é clicável e abre a lista já filtrada. Indicadores respeitam permissões.

#### DASH-02 — Meu trabalho

Mostra apenas tarefas do usuário: hoje, atrasadas, próximas, aguardando terceiro e concluídas recentemente.

### 7.5 Empresas-clientes

#### CLI-01 — Lista

Busca, filtros, colunas configuráveis, ordenação, paginação, seleção em massa, exportação e ações: cadastrar, importar, aplicar template, alterar responsável, adicionar tag e arquivar.

Colunas padrão: nome fantasia, CNPJ, regime, responsável, templates ativos, tarefas atrasadas, próxima data e status.

#### CLI-02 — Novo/editar

Campos:

- razão social e nome fantasia;
- CNPJ com validação de dígitos;
- inscrição estadual e municipal;
- CNAE principal e secundários como informação;
- regime tributário;
- porte;
- segmento;
- data de abertura;
- status;
- unidade do escritório;
- responsável principal;
- departamentos responsáveis;
- contatos;
- endereço;
- tags;
- observações internas;
- data de início do atendimento.

O MVP não consulta Receita Federal automaticamente. CNPJ pode ser repetido em organizações diferentes, mas não dentro da mesma organização enquanto o registro estiver ativo.

#### CLI-03 — Perfil do cliente

Cabeçalho com identidade, status, responsáveis, saúde operacional e ações. Abas:

1. Resumo;
2. Tarefas;
3. Templates aplicados;
4. Documentos;
5. Calendário;
6. Contatos;
7. Comentários;
8. Histórico;
9. Configurações do portal.

#### CLI-04 — Aplicar template

Wizard:

1. selecionar template e versão publicada;
2. informar data-base e variáveis;
3. mapear papéis/departamentos para usuários;
4. revisar datas e recorrências;
5. revisar itens que serão criados;
6. confirmar.

Exibe número de etapas, tarefas, checklists, documentos e primeira/última data. Permite desmarcar itens opcionais, nunca editar silenciosamente a versão original.

#### CLI-05 — Arquivar cliente

Exibe impactos: tarefas abertas, portal, documentos e cobrança de cota. Arquivar bloqueia novas recorrências e acesso do cliente, mas preserva histórico. Reativação exige permissão e disponibilidade de cota.

#### CLI-06 — Importação

Upload, mapeamento, prévia, validação, confirmação, processamento assíncrono e relatório final. Nenhuma linha inválida deve impedir as válidas quando a importação parcial for escolhida.

### 7.6 Templates operacionais

#### TMP-01 — Biblioteca

Cards ou tabela com nome, categoria, versão publicada, quantidade de usos, responsável, atualização e status: rascunho, publicado, arquivado.

Filtros por categoria, tag, autor e status. Ações: criar, clonar, visualizar, editar rascunho, publicar, arquivar e exportar.

#### TMP-02 — Criar/editar metadados

Nome, código interno, descrição, finalidade, categoria, cor, ícone, tags, responsável técnico, instruções, aviso, periodicidade padrão e variáveis solicitadas na aplicação.

#### TMP-03 — Editor

Estrutura hierárquica:

`Template → Etapas → Tarefas → Checklist → Documentos esperados`

Editor com reordenação, duplicação e recolhimento de blocos. Cada etapa possui nome, descrição, ordem e condição opcional manual.

Cada tarefa do template possui:

- título e descrição;
- categoria;
- prioridade;
- departamento ou papel responsável;
- revisor opcional;
- regra de data;
- duração estimada;
- recorrência;
- status inicial;
- bloqueios/dependências;
- checklist;
- documentos esperados;
- instruções para equipe;
- instruções visíveis ao cliente;
- visibilidade no portal;
- lembretes;
- item obrigatório ou opcional.

#### TMP-04 — Regras de data

Opções:

- na data-base;
- N dias antes/depois da data-base;
- N dias após aplicação;
- N dias após conclusão de outra tarefa;
- dia fixo do mês;
- primeiro ou último dia útil;
- dia da semana;
- data informada por variável;
- sem prazo.

Calendário de dias úteis do MVP considera fins de semana e feriados cadastrados manualmente por organização. Não haverá fonte oficial automática de feriados.

#### TMP-05 — Recorrência

Diária, semanal, mensal, bimestral, trimestral, semestral, anual ou personalizada. Define início, fim, limite de ocorrências, política para fim de semana e antecedência de geração.

#### TMP-06 — Pré-visualização

Simula aplicação com uma data-base, exibe linha do tempo e alerta para tarefas sem responsável, dependências circulares, datas impossíveis e campos incompletos.

#### TMP-07 — Publicação

Publicar cria versão imutável. Exige nome, ao menos uma etapa e uma tarefa, validações aprovadas e confirmação. Nova alteração cria rascunho da próxima versão.

#### TMP-08 — Comparação de versões

Mostra itens adicionados, removidos e alterados. Clientes permanecem na versão aplicada. Atualização em massa é ação explícita com simulação.

#### TMP-09 — Usos

Lista clientes e instâncias que utilizam cada versão.

### 7.7 Tarefas

#### TASK-01 — Lista

Visualizações: tabela, quadro por status e agrupamento por cliente/responsável. Filtros persistentes e favoritos.

Colunas: título, cliente, etapa, responsável, prioridade, prazo, status, origem, progresso do checklist e indicador de bloqueio.

#### TASK-02 — Detalhe

Cabeçalho, descrição, cliente, template de origem, prazo, recorrência, responsáveis, seguidores e status.

Abas/blocos:

- checklist;
- documentos;
- comentários e menções;
- dependências;
- ocorrências recorrentes;
- histórico.

Ações: iniciar, concluir, reabrir, cancelar, alterar prazo, delegar, solicitar documento, comentar e duplicar.

#### TASK-03 — Nova tarefa avulsa

Campos semelhantes ao editor, vinculada ou não a cliente. Uma tarefa avulsa não altera template.

#### TASK-04 — Edição em massa

Responsável, departamento, prioridade, status, prazo e tags. Exige confirmação e registra auditoria item a item ou lote rastreável.

#### TASK-05 — Minha fila

Fila priorizada por atraso, data e prioridade, com conclusão rápida e filtros.

### 7.8 Documentos

#### DOC-01 — Central

Busca e filtros por cliente, tipo, status, tarefa, data, responsável e origem. Colunas: documento, cliente, categoria, validade, situação e última versão.

#### DOC-02 — Upload

Arrastar/selecionar; informar cliente, tipo, tarefa, competência, emissão, validade, observações e visibilidade no portal. Validar extensão, tamanho, malware por integração preparada e cota.

#### DOC-03 — Detalhe

Metadados, versões, vínculo, downloads, validade, comentários e histórico. O download usa URL temporária assinada.

#### DOC-04 — Solicitação

Cria uma pendência para o cliente com título, instruções, prazo, formatos aceitos e lembretes. O envio pelo portal muda o estado para “recebido”; um colaborador aprova ou rejeita.

#### DOC-05 — Tipos de documento

Configuração por organização: nome, categoria, prazo de validade opcional, formatos e tamanho máximo.

### 7.9 Calendário

#### CAL-01 — Calendário geral

Mês, semana, dia e agenda. Exibe tarefas, vencimentos documentais e eventos manuais com cores e filtros.

Arrastar uma tarefa para outra data exige permissão, confirmação e escolha entre “somente esta ocorrência” ou “série futura” quando recorrente.

#### CAL-02 — Evento

Detalhe, vínculo, responsáveis, lembretes e histórico.

#### CAL-03 — Calendários e feriados

Fuso horário, início da semana, feriados manuais e política de ajuste para dias não úteis.

### 7.10 Relatórios

#### REP-01 — Produtividade

Concluídas, no prazo, atrasadas, tempo médio e carga por pessoa/departamento.

#### REP-02 — Carteira

Clientes sem template, com atrasos, com documentos pendentes, inativos e por responsável.

#### REP-03 — Prazos

Vencimentos por período, recorrências futuras e atraso acumulado.

#### REP-04 — Documentos

Solicitados, recebidos, rejeitados, pendentes e com validade próxima.

#### REP-05 — Exportações

CSV/XLSX assíncrono, com filtros atuais, aviso por e-mail e link temporário. PDF fica fora do MVP salvo relatório simples já suportado.

### 7.11 Equipe

#### TEAM-01 — Usuários

Nome, e-mail, papel, departamentos, unidade, status e último acesso. Ações: convidar, editar, suspender, reenviar convite e remover.

#### TEAM-02 — Convite

E-mail, papel, unidade, departamentos e escopo opcional de clientes. Convite expira em sete dias.

#### TEAM-03 — Papéis e permissões

Papéis padrão protegidos e papéis personalizados. Alterações críticas pedem confirmação.

#### TEAM-04 — Departamentos e equipes

CRUD, gestor, membros, cor e status. Exclusão somente quando sem vínculos; caso contrário, arquivar.

### 7.12 Notificações

#### NOT-01 — Central

Lidas/não lidas, tipo, prioridade, link de contexto, marcar tudo e filtros.

#### NOT-02 — Preferências

Por evento e canal: interna e e-mail. Configura resumo diário, silêncio, horário e fuso. Alertas críticos administrativos e de cobrança podem ser obrigatórios.

### 7.13 Assinatura

#### BILL-01 — Plano atual

Plano, ciclo, valor, próxima cobrança, estado da assinatura e consumo de empresas, usuários e armazenamento.

#### BILL-02 — Alterar plano

Comparação, cálculo proporcional fornecido pelo Stripe, confirmação e efeito dos novos limites.

#### BILL-03 — Faturas

Data, valor, estado, recibo e download.

#### BILL-04 — Método de pagamento

Redireciona ao portal seguro do Stripe.

#### BILL-05 — Cancelamento

Motivo, consequências, data efetiva e opção de reter até fim do ciclo. Cancelamento não apaga dados imediatamente.

### 7.14 Configurações

#### SET-01 — Organização

Identidade, endereço, fuso, logo, preferências e responsável.

#### SET-02 — Campos e classificações

Tags, categorias, tipos documentais, prioridades e segmentos.

#### SET-03 — Alertas

Antecedências padrão: 30, 15, 7, 3, 1 e 0 dias; escalonamento de atrasos e destinatários.

#### SET-04 — Segurança

Sessões, política de senha, 2FA se suportado pelo Core, histórico de acesso e revogação.

#### SET-05 — Auditoria

Busca por ator, ação, entidade, data e IP; exportação restrita.

#### SET-06 — Dados e privacidade

Exportar dados, política de retenção, solicitações LGPD e encerramento da organização.

### 7.15 Portal do cliente

#### PORT-01 — Entrada e seleção de empresa

Login e empresas às quais o contato foi vinculado.

#### PORT-02 — Início

Pendências urgentes, documentos solicitados, próximos prazos e comunicados.

#### PORT-03 — Pendências

Somente tarefas marcadas como visíveis. Cliente pode enviar documento, comentar e marcar sua ação como realizada; conclusão final permanece com o escritório quando configurado.

#### PORT-04 — Documentos

Enviar, consultar documentos liberados e acompanhar aprovação/rejeição.

#### PORT-05 — Cronograma

Eventos visíveis, sem informações internas.

#### PORT-06 — Perfil

Contato, senha, notificações e aceite.

### 7.16 Administração global

#### ADM-01 — Visão da plataforma

MRR, organizações ativas, trials, cancelamentos, inadimplência, uso e jobs com erro.

#### ADM-02 — Organizações

Plano, status, consumo, proprietário e suporte. Acesso assistido deve ser temporário, consentido, auditado e visualmente identificado.

#### ADM-03 — Planos

Nome, preço mensal/anual, Stripe Price IDs, limites, recursos, ordem, destaque e disponibilidade.

#### ADM-04 — Cupons e trials

Preferencialmente geridos no Stripe e refletidos no sistema.

#### ADM-05 — Templates iniciais

Modelos que uma organização pode copiar. Nunca são aplicados automaticamente.

#### ADM-06 — Saúde operacional

Filas, webhooks, e-mails, armazenamento, integrações e reprocessamento seguro.

## 8. Processos ponta a ponta

### 8.1 Contratação

1. visitante escolhe plano;
2. cria conta ou autentica;
3. checkout é criado pelo BillingSDK;
4. Stripe processa o pagamento;
5. webhook idempotente ativa assinatura;
6. organização é criada ou liberada;
7. proprietário inicia onboarding;
8. e-mail de confirmação é enviado.

Não liberar plano pago apenas pelo retorno do navegador; a fonte de verdade é o webhook validado.

### 8.2 Entrada de novo cliente

1. colaborador cadastra ou importa empresa;
2. escolhe responsável e tags;
3. seleciona template publicado;
4. informa data-base e variáveis;
5. sistema simula;
6. usuário revisa;
7. transação cria instância, etapas, tarefas, checklists, documentos esperados e recorrências;
8. notificações são agendadas;
9. histórico registra autor, versão e parâmetros.

Se falhar, a operação inteira deve ser revertida. Aplicação repetida do mesmo template exige confirmação.

### 8.3 Execução

1. tarefa fica “a fazer”;
2. responsável inicia;
3. checklist e documentos são processados;
4. tarefa pode ficar “aguardando cliente”, “aguardando terceiro” ou “bloqueada”;
5. ao cumprir critérios, conclui;
6. dependências são liberadas;
7. recorrência gera/agrega próxima ocorrência;
8. indicadores são atualizados.

### 8.4 Solicitação documental

1. colaborador cria solicitação;
2. sistema notifica contato;
3. cliente envia arquivo;
4. arquivo passa por validação;
5. colaborador aprova ou rejeita com motivo;
6. aprovação pode concluir item do checklist;
7. rejeição reabre a pendência e notifica o cliente.

### 8.5 Atualização de template

1. usuário cria rascunho a partir da versão publicada;
2. edita e valida;
3. publica nova versão;
4. novos clientes usam a nova versão;
5. clientes existentes permanecem na anterior;
6. gestor pode simular migração;
7. atualização nunca remove silenciosamente tarefas executadas ou documentos.

### 8.6 Inadimplência

1. falha de pagamento gera aviso;
2. assinatura entra em `past_due`;
3. existe período de tolerância configurável;
4. após tolerância, organização fica somente leitura;
5. proprietário ainda acessa cobrança e exportação permitida;
6. regularização restaura acesso;
7. exclusão segue política de retenção, nunca é imediata.

### 8.7 Encerramento

Cancelamento mantém acesso até a data efetiva. Após isso, somente leitura por período configurado. Proprietário pode exportar dados. Exclusão definitiva exige confirmação reforçada e retenções legais.

## 9. Estados e regras de negócio

### 9.1 Cliente

`rascunho → ativo → suspenso → arquivado`

Arquivado não conta para cota apenas após confirmação de que não possui rotinas ativas. Exclusão física não é oferecida na interface comum.

### 9.2 Template

`rascunho → publicado → arquivado`

Versão publicada é imutável. Arquivamento impede novas aplicações, sem afetar instâncias.

### 9.3 Tarefa

`a_fazer → em_andamento → aguardando_cliente/aguardando_terceiro/bloqueada → concluída`

Estados terminais adicionais: `cancelada`. Reabertura de concluída exige motivo.

Regras:

- tarefa bloqueada não pode ser concluída sem permissão excepcional;
- tarefa com checklist obrigatório incompleto não conclui;
- tarefa que exige documento aprovado não conclui antes da aprovação;
- alteração de prazo vencido registra motivo;
- conclusão registra data, autor e evidências;
- atrasada é cálculo derivado, não status persistido independente.

### 9.4 Documento

`solicitado → recebido → em_análise → aprovado/rejeitado → arquivado`

Uma nova versão preserva as anteriores. Exclusão lógica e auditoria são obrigatórias.

### 9.5 Assinatura

`trialing → active → past_due → read_only → canceled`

Estados devem mapear eventos reais do Stripe e permitir reconciliação.

### 9.6 Datas

- armazenar timestamps em UTC;
- exibir conforme fuso da organização;
- datas puras não devem mudar por conversão de fuso;
- política de dia não útil: anterior, posterior ou manter;
- dependências circulares são proibidas;
- alteração na série recorrente não modifica ocorrências concluídas;
- cada job de geração deve ser idempotente.

## 10. Planos e monetização

### 10.1 Planos iniciais sugeridos

| Plano | Empresas ativas | Usuários internos | Armazenamento | Preço mensal sugerido |
|---|---:|---:|---:|---:|
| Essencial | 30 | 5 | 10 GB | R$ 99 |
| Profissional | 100 | 15 | 50 GB | R$ 199 |
| Gestão | 250 | 40 | 150 GB | R$ 399 |
| Escala | 500 | 100 | 500 GB | R$ 699 |
| Enterprise | negociado | negociado | negociado | a partir de R$ 999 |

Os preços são configuração comercial, não regra fixa. Plano anual pode oferecer dois meses equivalentes de desconto.

### 10.2 Recursos

Todos os planos recebem núcleo funcional. Diferenciação principal por carteira, usuários, armazenamento, exportações avançadas, personalização do portal e suporte. Não retirar recursos essenciais de segurança ou auditoria dos planos menores.

### 10.3 Cotas

Chaves sugeridas:

- `active_clients`;
- `internal_users`;
- `storage_bytes`;
- `monthly_exports`;
- `portal_contacts`;
- `active_templates`.

Ao atingir 80%, avisar. Em 100%, bloquear nova criação que aumente consumo, sem bloquear leitura ou conclusão de trabalho existente. Upgrade tem efeito imediato após confirmação de cobrança.

### 10.4 Trial

Opcional de 14 dias, limitado a dez clientes, três usuários e 1 GB. Não exigir cartão é decisão comercial configurável. Enviar avisos no 7º, 12º e 14º dia.

## 11. E-mails e notificações

Cada envio deve possuir template versionado, assunto, pré-cabeçalho, corpo HTML/texto, variáveis, botão, rodapé, preferência e registro de entrega.

| Código | Gatilho | Destinatário | Assunto sugerido |
|---|---|---|---|
| `account_verify` | cadastro | usuário | Confirme seu e-mail no Company Radar |
| `organization_welcome` | organização criada | proprietário | Seu escritório está pronto para ser configurado |
| `team_invitation` | convite | convidado | Você foi convidado para o escritório {{organization}} |
| `client_portal_invitation` | acesso concedido | contato | Acesse suas pendências e documentos |
| `task_assigned` | atribuição | responsável | Nova tarefa: {{task_title}} |
| `task_due_soon` | antecedência | responsável/gestor | Prazo próximo: {{task_title}} |
| `task_overdue` | atraso | responsável | Tarefa atrasada desde {{due_date}} |
| `manager_overdue_digest` | resumo | gestor | {{count}} pendências exigem atenção |
| `document_requested` | solicitação | cliente | Documento solicitado por {{organization}} |
| `document_received` | upload | responsável | Documento recebido de {{client}} |
| `document_rejected` | rejeição | cliente | Precisamos de uma nova versão do documento |
| `document_expiring` | validade | responsável | Documento vence em {{days}} dias |
| `daily_digest` | diário | usuário | Seu resumo do Company Radar |
| `weekly_manager_digest` | semanal | gestor | Resumo semanal da carteira |
| `payment_succeeded` | cobrança | proprietário/financeiro | Pagamento confirmado |
| `payment_failed` | falha | proprietário/financeiro | Não foi possível processar o pagamento |
| `trial_ending` | fim próximo | proprietário | Seu período de teste termina em {{days}} dias |
| `subscription_canceled` | cancelamento | proprietário | Cancelamento programado |
| `export_ready` | exportação | solicitante | Sua exportação está pronta |
| `security_alert` | evento sensível | usuário | Novo acesso ou alteração de segurança |

### 11.1 Regras antirruído

- não enviar repetidamente o mesmo alerta no mesmo dia;
- agrupar lembretes em resumo quando configurado;
- atraso crítico pode escalar ao gestor após N dias;
- respeitar fuso e janela silenciosa;
- permitir cancelamento de comunicações não essenciais;
- links autenticados não devem expor dados sensíveis;
- registrar tentativa, sucesso, falha e reprocessamento.

## 12. Modelo de dados

Todos os modelos de domínio devem herdar `TenantMixin`, `TimestampMixin` e, quando aplicável, `SoftDeleteMixin`.

### 12.1 Entidades

- `BusinessUnit`: unidade do escritório.
- `Department`: departamento.
- `Team`: equipe e membros.
- `ClientCompany`: empresa-cliente.
- `ClientContact`: contato.
- `ClientPortalAccess`: vínculo de acesso.
- `Tag` e `TaggedItem`.
- `Template`: identidade lógica.
- `TemplateVersion`: versão imutável/publicável.
- `TemplateVariable`: parâmetros.
- `TemplateStage`.
- `TemplateTask`.
- `TemplateChecklistItem`.
- `TemplateDocumentRequirement`.
- `TemplateDependency`.
- `TemplateApplication`: aplicação a um cliente.
- `ProcessStageInstance`.
- `Task`: ocorrência executável.
- `TaskAssignment`.
- `TaskDependency`.
- `ChecklistItem`.
- `TaskComment`.
- `TaskFollower`.
- `RecurrenceRule`.
- `DocumentRequest`.
- `Document`: metadados de negócio.
- `DocumentVersion`: referência ao StoredObject do Core.
- `DocumentType`.
- `CalendarEvent`.
- `Holiday`.
- `NotificationPreference`.
- `SavedFilter`.
- `ExportJob`.

### 12.2 Restrições

- unicidade de CNPJ por organização e registros ativos;
- código do template único por organização;
- número da versão único por template;
- nomes de departamentos únicos por organização;
- integridade entre organização de cliente, tarefa, documento e template;
- nenhum FK cruzando organizações;
- índices em organização + status, organização + prazo, organização + cliente e campos de busca;
- exclusão lógica para dados operacionais;
- UUID público para URLs e IDs internos não sequenciais expostos.

## 13. Arquitetura

### 13.1 Reutilização do Company Core

| Necessidade | Componente |
|---|---|
| organizações e membros | `apps.organizations` |
| usuários e autenticação | `apps.users` + allauth |
| RBAC | `apps.permissions` |
| planos e Stripe | `apps.billing` |
| limites | `apps.quotas` |
| arquivos | `apps.storage` |
| e-mails e eventos | `apps.notifications` |
| auditoria | `apps.audit` |
| jobs | `apps.jobs` + Celery |
| uso e métricas | `apps.usage`/`analytics` |
| API keys | `apps.api` |
| busca | `apps.search` |
| flags | `apps.feature_flags` |
| configurações | `apps.settings` |

### 13.2 Apps novos sugeridos

- `apps/clients`;
- `apps/radar_templates`;
- `apps/radar_tasks`;
- `apps/radar_documents`;
- `apps/radar_calendar`;
- `apps/radar_portal`;
- `apps/radar_reports`.

Não criar um único app gigante. Serviços de domínio devem ter transações claras e selectors devem impedir consultas sem tenant.

### 13.3 Camadas

- models: estrutura e invariantes locais;
- services: comandos e transações;
- selectors: leitura otimizada;
- views: orquestração HTTP/HTMX;
- serializers: contrato REST;
- tasks: trabalho assíncrono idempotente;
- policies/permissions: autorização;
- templates: interface acessível.

### 13.4 Eventos de domínio

Exemplos: `client.created`, `template.published`, `template.applied`, `task.assigned`, `task.completed`, `task.overdue`, `document.requested`, `document.received`. Eventos alimentam notificações, auditoria, analytics e webhooks sem acoplar módulos.

## 14. API e conexões

### 14.1 API REST

Prefixo `/api/v1/radar/`.

Recursos:

- `/clients`;
- `/client-contacts`;
- `/templates`;
- `/template-versions`;
- `/template-applications`;
- `/tasks`;
- `/checklist-items`;
- `/document-requests`;
- `/documents`;
- `/calendar-events`;
- `/departments`;
- `/reports`;
- `/exports`.

Usar paginação, filtros, ordenação, throttling, OpenAPI e envelope padrão do Core. Operações como aplicação de template devem ser endpoints de ação, não CRUD artificial.

### 14.2 Stripe

Checkout, portal do cliente Stripe, assinatura, faturas e webhooks assinados. Idempotência, reconciliação diária e tratamento de eventos fora de ordem são obrigatórios.

### 14.3 E-mail

Backend configurável pelo Company Core. MVP precisa de e-mail transacional; WhatsApp, Slack e SMS ficam fora do escopo.

### 14.4 Armazenamento

Produção em S3/R2 compatível. Arquivos privados, criptografia do provedor, URLs temporárias, limites e metadados. Nunca servir diretamente de pasta pública.

### 14.5 Importação/exportação

CSV/XLSX com processamento assíncrono. Arquivo de importação original e relatório de resultado com retenção limitada.

### 14.6 Webhooks de saída

Preparar eventos para clientes Enterprise, inicialmente desabilitados por flag.

## 15. Jobs agendados

- gerar ocorrências recorrentes;
- identificar tarefas próximas e atrasadas;
- identificar documentos a vencer;
- enviar resumos;
- expirar convites;
- processar importações/exportações;
- reconciliar assinatura;
- limpar arquivos temporários;
- recalcular agregações;
- reprocessar notificações elegíveis.

Cada job deve possuir trava, idempotency key, tentativas com backoff, dead-letter operacional ou estado de falha e observabilidade.

## 16. Segurança, LGPD e auditoria

- isolamento multitenant testado;
- princípio do menor privilégio;
- CSRF, XSS, SQL injection e upload seguro;
- senhas por allauth e cookies seguros;
- 2FA quando disponível;
- criptografia em trânsito;
- segredos somente em ambiente;
- logs sem conteúdo sensível;
- backups criptografados e restauração testada;
- retenção configurada;
- exportação e exclusão de titular;
- contratos e consentimentos versionados;
- subprocessadores documentados;
- trilha de criação, edição, conclusão, download, upload, exclusão, permissão e cobrança.

Eventos de auditoria devem registrar organização, ator, ação, alvo, timestamp, IP, user-agent, request ID e diferenças seguras.

## 17. Requisitos não funcionais

### 17.1 Desempenho

- páginas comuns: p95 abaixo de 2 segundos em carga nominal;
- APIs de lista: p95 abaixo de 800 ms sem exportação;
- dashboard com agregações/cache, sem N+1;
- aplicação de template com até 500 tarefas em job ou transação controlada;
- paginação obrigatória.

### 17.2 Disponibilidade

Meta inicial de 99,5% mensal, health/readiness endpoints, deploy sem perda de migração e manutenção comunicada.

### 17.3 Compatibilidade e acessibilidade

Desktop responsivo e celular funcional; navegadores atuais; WCAG 2.1 AA como meta; navegação por teclado, foco, contraste e rótulos.

### 17.4 Observabilidade

Logs estruturados, request ID, métricas, erros centralizados, monitoramento de filas, webhooks, e-mails, storage, banco e uso de cotas.

### 17.5 Backup

Backup diário, retenção mínima de 30 dias, RPO alvo de 24 horas e RTO alvo de 8 horas no MVP. Teste periódico de restauração.

## 18. Experiência e padrões de interface

- interface em português do Brasil;
- datas `dd/mm/aaaa`;
- moeda BRL;
- estados vazios com próximo passo;
- ações destrutivas confirmadas;
- autosave no editor com indicador;
- feedback de carregamento e erro;
- tabelas com filtros preservados;
- atalhos “Novo cliente”, “Aplicar template”, “Nova tarefa” e “Solicitar documento”;
- cores nunca como único indicador;
- ajuda contextual explicando que templates são definidos pelo escritório.

## 19. Métricas de produto

### 19.1 Ativação

Organização ativa quando, em até sete dias:

- cadastrou ou importou ao menos cinco clientes;
- criou/convidou dois usuários;
- publicou ou copiou um template;
- aplicou template;
- concluiu ao menos uma tarefa.

### 19.2 Retenção

- organizações ativas semanalmente;
- tarefas concluídas;
- templates aplicados;
- clientes com rotinas;
- documentos recebidos pelo portal;
- usuários ativos por organização;
- churn e motivo.

### 19.3 Valor

- tempo até primeira aplicação;
- tempo para estruturar cliente;
- percentual de tarefas no prazo;
- redução de pendências;
- adesão ao portal.

## 20. Critérios de aceite por épico

### Fundação

- clone obrigatório executado;
- testes originais permanecem verdes;
- novo domínio segue arquitetura do Core;
- isolamento de tenant coberto por testes.

### Clientes

- CRUD, importação, arquivamento e perfil funcionam;
- CNPJ e cotas validados;
- nenhuma organização acessa cliente de outra.

### Templates

- editor cria estrutura completa;
- publicação gera versão imutável;
- simulação calcula datas;
- aplicação é atômica e auditada;
- versões antigas continuam funcionais.

### Tarefas

- estados e bloqueios respeitados;
- recorrência não duplica ocorrências;
- checklists/documentos obrigatórios bloqueiam conclusão;
- filtros, lote e histórico funcionam.

### Documentos

- upload privado e versionado;
- solicitação, aprovação e rejeição notificam corretamente;
- acesso respeita tenant e portal.

### Calendário

- visualizações e filtros corretos;
- fuso e dia útil respeitados;
- mudança recorrente não corrompe histórico.

### Portal

- cliente vê somente dados liberados;
- upload e comentários funcionam;
- revogação corta acesso imediatamente.

### Billing

- checkout, webhook, upgrade, downgrade, falha e cancelamento testados;
- cotas aplicadas sem perda de dados;
- eventos duplicados não duplicam efeitos.

### Notificações

- templates renderizam;
- preferências e janela silenciosa respeitadas;
- não há duplicação;
- logs e reprocessamento disponíveis.

## 21. Estratégia de testes

- unitários para serviços e regras de datas;
- integração para banco, storage, Stripe e Celery;
- autorização para cada papel;
- testes de isolamento multitenant;
- propriedade para recorrências e datas;
- E2E para contratação, onboarding, template, cliente, execução, portal e cancelamento;
- contrato de API/OpenAPI;
- acessibilidade automatizada e revisão manual;
- carga em dashboard, listas, aplicação de template e jobs;
- segurança de upload, IDs, sessões e webhooks;
- migrações reversíveis quando possível.

Cobertura não substitui cenários; fluxos críticos devem ter testes explícitos.

## 22. Implantação

### 22.1 Ambientes

Desenvolvimento, homologação e produção separados. Produção usa PostgreSQL, Redis, Celery worker/beat, storage privado, SMTP transacional, Stripe live e HTTPS.

### 22.2 Pipeline

1. lint e formatação;
2. testes;
3. verificação de migrações;
4. build;
5. deploy em homologação;
6. smoke tests;
7. aprovação;
8. backup;
9. deploy produção;
10. migração;
11. health checks e observação.

### 22.3 Feature flags

Usar para portal, importações, relatórios, plano anual, trial e recursos Enterprise, permitindo lançamento gradual.

## 23. Fases de entrega

### Fase 0 — Fundação

Clone, execução, auditoria da base, identidade, ambientes, apps e permissões.

### Fase 1 — Núcleo

Organizações, equipe, clientes, departamentos, templates, versões e aplicação.

### Fase 2 — Operação diária

Tarefas, checklist, datas, recorrências, calendário, dashboard e notificações.

### Fase 3 — Retenção

Documentos, portal, importação, relatórios e auditoria acessível.

### Fase 4 — Venda

Site, planos, checkout, cotas, trial, billing, administração e onboarding comercial.

### Fase 5 — Endurecimento

E2E, carga, segurança, LGPD, observabilidade, backups, documentação e piloto.

O desenvolvimento pode ocorrer em frentes paralelas após contratos de dados e permissões, mas integração deve ocorrer continuamente.

## 24. Fora do MVP e evolução

### Nível 2

- integrações contábeis;
- WhatsApp e SMS;
- assinatura eletrônica;
- OCR e extração de validade;
- automações condicionais;
- personalização avançada;
- marketplace privado;
- API pública completa.

### Nível 3

- base regulatória estruturada;
- motor de regras por CNAE/localização;
- monitoramento de fontes oficiais;
- IA assistiva e preventiva;
- score de risco;
- marketplace de prestadores;
- recomendações sujeitas a validação humana.

Essas extensões não devem contaminar o escopo nem a comunicação do MVP.

## 25. Definition of Done do MVP

O MVP estará pronto para venda quando:

1. um escritório contratar sem intervenção técnica;
2. concluir onboarding;
3. importar ao menos 100 clientes;
4. convidar equipe;
5. criar e publicar template;
6. aplicar template em menos de cinco minutos;
7. executar tarefas e recorrências;
8. solicitar e receber documentos;
9. operar calendário e alertas;
10. conceder portal seguro;
11. consultar relatórios e auditoria;
12. alterar plano e pagar;
13. ter dados isolados e recuperáveis;
14. passar pelos testes críticos;
15. possuir documentação de operação, suporte e incidentes.

## 26. Instrução final ao agente

Não iniciar por telas isoladas nem por um projeto vazio. O primeiro comando de obtenção da base deve ser:

`git clone https://github.com/alc-br/company-core.git`

Todo recurso deve ser classificado como:

- **reutilização do Company Core**;
- **extensão controlada do Core**; ou
- **novo domínio Company Radar**.

Antes de implementar, o agente deve produzir mapa de reutilização, modelo de dados, matriz de permissões, contratos de serviços, plano de migrações e sequência de épicos. Nenhuma funcionalidade do MVP pode depender de IA, fonte legislativa externa ou integração contábil ainda inexistente.

O produto deve sair como uma solução completa de organização operacional para escritórios contábeis, com cobrança real, onboarding, rotina diária, portal, documentos, alertas e histórico suficiente para que o cliente incorpore o Company Radar à operação e tenha motivos concretos para continuar assinando.
