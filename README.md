# Company Radar

<p align="center">
  <strong>Sistema operacional para escritorios contabeis.</strong><br>
  Padronizacao operacional, controle de prazos, gestao de carteira e portal do cliente.<br>
  <code>Next.js 16 + Django 6 + PostgreSQL + Redis + Celery</code>
</p>

---

## O que e?

O **Company Radar** e um SaaS multi-tenant que funciona como sistema operacional para escritorios contabeis. Cada escritorio cria uma organizacao, cadastra sua equipe e sua carteira de empresas-clientes, transforma procedimentos internos em templates reutilizaveis e aplica esses templates aos clientes.

A aplicacao de um template gera tarefas, checklists, documentos esperados, responsaveis, datas e recorrencias. O sistema acompanha a execucao, cobra pendencias, envia alertas e mantem um historico auditavel.

### O que o MVP e

- Gestor de carteira de empresas-clientes
- Biblioteca privada de templates operacionais
- Gerador de tarefas, prazos, recorrencias e checklists
- Central de documentos e pendencias
- Calendario compartilhado
- Portal simplificado do cliente
- Painel gerencial e trilha de auditoria
- SaaS por assinatura com limites por carteira

### O que o MVP nao e

- Consultoria contabil ou juridica
- Monitor automatico de leis
- Motor oficial de obrigacoes fiscais
- Substituto de ERP contabil
- Emissor de guias, declaracoes ou eventos do eSocial
- Marketplace publico de templates
- Chatbot ou assistente de IA
- Aplicativo movel nativo

---

## Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | Next.js (App Router) | 16.x |
| Linguagem Frontend | TypeScript | 5.x |
| UI Components | shadcn/ui + Radix UI | latest |
| Estilo | Tailwind CSS v4 | 4.x |
| Tabelas | TanStack Table | 8.x |
| Estado | Zustand | 5.x |
| Dados no cliente | TanStack React Query | 5.x |
| Formularios | React Hook Form + Zod | 7.x / 4.x |
| Editor Markdown | MDXEditor | 3.x |
| Backend | Django | 6.x |
| Linguagem Backend | Python | 3.12 |
| Banco de dados | PostgreSQL | 17+ |
| Cache/Broker | Redis | 7+ |
| API REST | Django REST Framework | 3.15+ |
| Tasks async | Celery + django-celery-beat | 5.4+ |
| Auth | django-allauth | 65.0+ |
| Billing | Stripe | 11.0+ |
| Storage | S3 / MinIO / Cloudflare R2 | 1.14+ |
| Gerenciador Python | uv | latest |
| Gerenciador JS | Bun | latest |

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│  Next.js Frontend (porta 3000)                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  App Router / 44 paginas / shadcn/ui              │  │
│  │  apiClient (src/lib/api.ts) -> proxy para Django   │  │
│  │  src/app/api/v1/[...path]/route.ts (catch-all)    │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  Django Backend (porta 8000)                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Company Core (24 apps transversais)               │  │
│  │  + 7 apps do dominio Radar                         │  │
│  │  DRF API: /api/v1/radar/                           │  │
│  │  HTMX Templates: /radar/                           │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  Infraestrutura (PostgreSQL, Redis, Celery, S3)         │
└──────────────────────────────────────────────────────────┘
```

### Multitenancy

- Todo modelo de negocio herda `TenantMixin` (FK para `Organization`)
- `TenantMiddleware` injeta `request.tenant` a partir da sessao
- Thread-local para tasks async: `get_current_tenant()`

---

## Modulos do Radar (7 apps de dominio)

| App | Descricao |
|-----|-----------|
| `clients` | Carteira de empresas-clientes (CRUD, arquivamento, CNPJ, setor, status) |
| `radar_templates` | Biblioteca de templates operacionais (versoes, publicacao, comparacao, aplicacao) |
| `radar_tasks` | Tarefas geradas por templates (kanban, fila pessoal, recorrencia, checklist) |
| `radar_documents` | Central de documentos (tipos, upload, solicitacoes, vinculacao a tarefas) |
| `radar_calendar` | Calendario compartilhido (eventos, feriados, visao mes/semana, configuracao) |
| `radar_portal` | Portal do cliente (cronograma, pendencias, comunicados, perfil) |
| `radar_reports` | Relatorios gerenciais (produtividade, portfolio, exportacao) |

---

## Paginas do Frontend (Next.js)

### Paginas Publicas

| Rota | Descricao |
|------|-----------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Registro |
| `/forgot-password` | Recuperar senha |
| `/reset-password` | Redefinir senha |
| `/verify-email` | Verificacao de e-mail |
| `/aceitar-convite` | Aceite de convite |
| `/selecionar-organizacao` | Selecao de organizacao |
| `/planos` | Planos e precos |
| `/checkout` | Checkout de assinatura |
| `/checkout/confirmacao` | Confirmacao de compra |
| `/como-funciona` | Como funciona |
| `/recursos` | Recursos do produto |
| `/faq` | Perguntas frequentes |
| `/terms` | Termos de uso |
| `/privacy` | Politica de privacidade |

### App Principal (autenticado)

| Rota | Descricao |
|------|-----------|
| `/app` | Dashboard principal |
| `/app/empresas` | Lista de empresas-clientes |
| `/app/empresas/nova` | Nova empresa |
| `/app/empresas/[id]` | Detalhe da empresa |
| `/app/empresas/[id]/editar` | Editar empresa |
| `/app/empresas/[id]/aplicar-template` | Aplicar template a empresa |
| `/app/templates` | Biblioteca de templates |
| `/app/templates/novo` | Novo template |
| `/app/templates/[id]` | Detalhe do template |
| `/app/templates/[id]/publicar` | Publicar template |
| `/app/tarefas` | Lista de tarefas |
| `/app/tarefas/nova` | Nova tarefa |
| `/app/tarefas/[id]` | Detalhe da tarefa |
| `/app/tarefas/minha-fila` | Minha fila de trabalho |
| `/app/documentos` | Central de documentos |
| `/app/documentos/solicitar` | Solicitar documento |
| `/app/calendario` | Calendario compartilhado |
| `/app/relatorios` | Relatorios gerenciais |
| `/app/notificacoes` | Notificacoes |
| `/app/notificacoes/preferencias` | Preferencias de notificacao |
| `/app/equipe` | Gestao de equipe |
| `/app/configuracoes` | Configuracoes da organizacao |
| `/app/assinatura` | Gestao de assinatura |
| `/app/onboarding` | Onboarding guiado |
| `/app/admin` | Administracao |
| `/app/ajuda` | Central de ajuda |
| `/app/meu-trabalho` | Visao pessoal de trabalho |

### Portal do Cliente

| Rota | Descricao |
|------|-----------|
| `/portal` | Home do portal |
| `/portal/cronograma` | Cronograma de tarefas |
| `/portal/pendencias` | Pendencias e documentos |
| `/portal/documentos` | Documentos compartilhados |
| `/portal/comunicados` | Comunicados do escritorio |
| `/portal/perfil` | Perfil do cliente |

---

## Estrutura de Diretorios

```
company-radar/
├── src/                         # Next.js frontend
│   ├── app/                     # App Router (44 paginas)
│   │   ├── (public)/            # Paginas publicas (17)
│   │   ├── app/                 # App autenticado (27)
│   │   ├── portal/              # Portal do cliente (6)
│   │   ├── api/                 # API proxy routes
│   │   │   ├── v1/[...path]/    # Proxy para Django API
│   │   │   ├── auth/[...path]/  # Proxy auth
│   │   │   └── account/[...path]/ # Proxy allauth
│   │   ├── layout.tsx           # Layout raiz
│   │   └── globals.css          # Estilos globais (Tailwind v4)
│   ├── components/ui/           # shadcn/ui components (44)
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilitarios
│   │   ├── api.ts               # API client tipado
│   │   └── utils.ts             # Helpers
│   └── public/                  # Assets estaticos
├── company-core/                # Django backend
│   ├── company_core/            # Config do projeto Django
│   │   ├── settings/            # base.py, development.py, production.py, test.py
│   │   ├── urls.py              # Router principal
│   │   └── celery.py            # Config do Celery
│   ├── apps/                    # 24 apps transversais + 7 apps Radar
│   │   ├── common/              # Mixins, excecoes, helpers
│   │   ├── users/               # Autenticacao (allauth)
│   │   ├── organizations/       # Multi-tenancy, memberships
│   │   ├── permissions/         # RBAC completo
│   │   ├── billing/             # Stripe, planos, invoices
│   │   ├── clients/             # [Radar] Carteira de empresas
│   │   ├── radar_templates/     # [Radar] Templates operacionais
│   │   ├── radar_tasks/         # [Radar] Tarefas e checklists
│   │   ├── radar_documents/     # [Radar] Central de documentos
│   │   ├── radar_calendar/      # [Radar] Calendario
│   │   ├── radar_portal/        # [Radar] Portal do cliente
│   │   ├── radar_reports/       # [Radar] Relatorios
│   │   └── ... (17+ apps transversais)
│   ├── templates/               # Django templates (HTMX + DaisyUI)
│   ├── docs/                    # Documentacao tecnica
│   ├── pyproject.toml           # Dependencias Python
│   ├── docker-compose.yml       # Docker (Postgres, Redis, MinIO, Celery)
│   ├── Dockerfile
│   └── Makefile
├── package.json                 # Dependencias Node.js
├── next.config.ts               # Config Next.js
├── tsconfig.json
├── tailwind.config.ts
├── eslint.config.mjs
├── Caddyfile                    # Reverse proxy (producao)
└── bun.lock
```

---

## Como Rodar

### Pre-requisitos

- **Python 3.12** com [uv](https://docs.astral.sh/uv/)
- **Bun** (Node.js runtime)
- **PostgreSQL 17** e **Redis 7** (ou Docker)

### Opcao A: Desenvolvimento local

```bash
# 1. Clonar o repositorio
git clone https://github.com/alc-br/company-radar.git
cd company-radar

# 2. Setup do backend (Django)
cd company-core
uv sync --all-extras
cp .env.example .env
# Editar .env com:
#   SECRET_KEY=sua-chave
#   DEBUG=True
#   DATABASE_URL=postgres://user:pass@localhost:5432/company_radar
#   REDIS_URL=redis://localhost:6379/0
uv run python manage.py migrate
uv run python manage.py createsuperuser

# 3. Iniciar servicos de infra (PostgreSQL + Redis)
docker run -d --name cr-postgres \
  -e POSTGRES_DB=company_radar -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:17
docker run -d --name cr-redis -p 6379:6379 redis:7

# 4. Rodar o backend (terminal 1)
cd company-core
uv run python manage.py runserver

# 5. Rodar o Celery (terminal 2)
cd company-core
uv run celery -A company_core.celery worker -l info \
  -Q default,billing,ai,webhooks,workflows,analytics,notifications
uv run celery -A company_core.celery beat -l info

# 6. Setup do frontend (Next.js)
cd ..
bun install

# 7. Rodar o frontend (terminal 3)
bun run dev
```

Acesse:
- **App:** http://localhost:3000/
- **API Django:** http://localhost:8000/api/v1/radar/
- **Admin Django:** http://localhost:8000/admin/
- **Health:** http://localhost:8000/health/

### Opcao B: Docker Compose (producao)

```bash
git clone https://github.com/alc-br/company-radar.git
cd company-radar/company-core
cp .env.example .env
# Editar .env com credenciais reais
docker compose up -d
docker compose exec app python manage.py migrate
docker compose exec app python manage.py createsuperuser
docker compose exec app python manage.py collectstatic --noinput
```

---

## API

Todas as endpoints seguem o prefixo `/api/v1/radar/`:

### Principais endpoints

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/api/v1/radar/clients/` | GET, POST | Lista/cria empresas-clientes |
| `/api/v1/radar/templates/` | GET, POST | Lista/cria templates |
| `/api/v1/radar/templates/{id}/apply/` | POST | Aplica template a empresa |
| `/api/v1/radar/tasks/` | GET, POST | Lista/cria tarefas |
| `/api/v1/radar/tasks/my-queue/` | GET | Fila pessoal do usuario |
| `/api/v1/radar/documents/` | GET, POST | Lista/cria documentos |
| `/api/v1/radar/calendar/events/` | GET, POST | Eventos do calendario |
| `/api/v1/radar/portal/` | GET | Dados do portal do cliente |
| `/api/v1/radar/reports/` | GET | Relatorios gerenciais |

### Autenticacao

- **Session auth** via django-allauth (frontend Next.js)
- **API Key auth** (prefixo `cc_live_`) para integracoes externas
- **Token auth** para acesso programatico

### Resposta padronizada

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 100,
    "total_pages": 5,
    "total_items": 420
  }
}
```

---

## Plano de Assinatura

| Plano | Empresas | Usuarios | Templates | Preco |
|-------|----------|----------|-----------|-------|
| Gratuita | 5 | 2 | 3 | R$ 0/mes |
| Essencial | 30 | 5 | 15 | R$ 97/mes |
| Profissional | 100 | 15 | 50 | R$ 247/mes |
| Escritorio | Ilimitado | 50 | Ilimitado | R$ 497/mes |

---

## Perfis de Usuario

| Papel | Descricao |
|------|-----------|
| Administrador | Acesso total a organizacao, configuracoes e billing |
| Gestor | Gerencia equipe, templates e carteira de clientes |
| Operador | Executa tarefas, gerencia documentos do dia a dia |
| Cliente (portal) | Acessa cronograma, pendencias e comunicados |

---

## Comandos Uteis

### Frontend (Next.js)

```bash
bun install                  # Instalar dependencias
bun run dev                  # Servidor de desenvolvimento (porta 3000)
bun run build                # Build de producao
bun run start                # Servidor de producao
bun run lint                 # Lint com ESLint
```

### Backend (Django)

```bash
cd company-core
uv sync --all-extras                       # Instalar dependencias
uv run python manage.py migrate            # Aplicar migrations
uv run python manage.py makemigrations     # Gerar migrations
uv run python manage.py runserver          # Servidor dev (porta 8000)
uv run python manage.py createsuperuser   # Criar admin
uv run python manage.py check             # Verificacao de saude
uv run pytest apps/ --no-cov -v            # Rodar testes
uv run ruff check apps/                    # Lint Python
uv run ruff format apps/                   # Formatador Python
```

### Celery

```bash
cd company-core
uv run celery -A company_core.celery worker -l info \
  -Q default,billing,ai,webhooks,workflows,analytics,notifications
uv run celery -A company_core.celery beat -l info
```

---

## Variaveis de Ambiente (.env)

```env
# === Obrigatorias ===
SECRET_KEY=sua-chave-secreta
DATABASE_URL=postgres://user:pass@localhost:5432/company_radar
REDIS_URL=redis://localhost:6379/0

# === App ===
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# === Next.js ===
NEXT_PUBLIC_API_URL=http://localhost:8000
DJANGO_API_URL=http://localhost:8000

# === Email ===
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# === Celery ===
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# === Storage ===
STORAGE_BACKEND=local
# STORAGE_BACKEND=s3

# === Stripe ===
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Licenca

MIT. Veja [LICENSE](company-core/LICENSE) para detalhes.
