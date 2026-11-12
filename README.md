# Sistema Comercial

Monorepo para um sistema comercial desktop com Electron, React e TypeScript, uma API central Fastify e PostgreSQL. Esta etapa entrega somente o bootstrap da infraestrutura; nenhum módulo comercial foi iniciado.

## Organização

- `apps/desktop`: Electron Main/Preload e renderer React/Vite. O Main é cliente HTTP da API; o renderer conversa somente por métodos explícitos do preload.
- `apps/api`: API Fastify, validação Zod, pool `pg` e execução explícita das migrations.
- `packages/contracts`: contratos e schemas Zod compartilhados.
- `database/migrations`: migrations SQL versionadas.
- `compose.yaml`: PostgreSQL 17 local para desenvolvimento.

O `pg` e as credenciais PostgreSQL pertencem exclusivamente à API. Não há ORM. O processo Electron não contém acesso ao banco.

## Pré-requisitos

- Node.js 22.12+ e npm 10.9+
- Docker Desktop com Docker Compose, ou PostgreSQL 17 acessível

## Desenvolvimento

```sh
cp .env.example .env
docker compose up -d postgres
npm install
npm run dev
```

`npm run dev` inicia a API e o desktop. A tela inicial contém somente um teste de conectividade com `/health/live`.

Comandos separados:

```sh
npm run dev:api
npm run dev:desktop
```

## Build, testes e tipos

```sh
npm run typecheck
npm test
npm run build
```

## Banco de dados

Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` e `DB_POOL_MAX` no `.env` da raiz. A senha de exemplo serve somente para desenvolvimento local.

```sh
npm run db:status
npm run db:migrate
```

As migrations são explícitas e não rodam na inicialização da API. Não existem migrations de domínio nesta etapa.

## API e segurança

- `API_HOST` usa `127.0.0.1` por padrão; `API_PORT` usa `3000`.
- `API_BASE_URL` configura o destino HTTP chamado pelo processo Main.
- Renderer e Preload têm sandbox, context isolation e Node integration desabilitado.
- Antes de vincular a API a uma interface de rede ou publicar endpoints comerciais, definir autenticação/autorização e TLS no deployment.

## Decisões arquiteturais

Esta arquitetura substitui a proposta inicial de conexão PostgreSQL dentro do Electron. A decisão aprovada está registrada em [ADR 0001](docs/architecture/decisions/0001-central-api.md). Regras e invariantes de domínio ainda pendentes estão listadas em [Regras de negócio](docs/business-rules/README.md).
