# ADR 0001: API central Fastify entre desktop e PostgreSQL

- **Status:** Aprovado
- **Data:** 2026-11-12

## Contexto

O scaffold documentava acesso direto do processo Electron ao PostgreSQL e não previa uma API. A implementação solicitada estabelece um monorepo npm com uma API Node/Fastify central, PostgreSQL central e comunicação desktop→API via HTTP. Essa decisão altera as fronteiras descritas anteriormente.

## Decisão

- O desktop usa Electron, React, TypeScript e Vite.
- O renderer não acessa rede, banco ou APIs Node; expõe-se somente uma API pequena e explícita pelo preload.
- O processo Main usa HTTP para chamar a API Fastify. O Main não importa `pg`, lê credenciais de banco nem executa SQL.
- A API Fastify é a única camada que acessa o PostgreSQL via `pg`, SQL parametrizado e migrations SQL versionadas.
- O repositório usa npm workspaces: `apps/desktop`, `apps/api` e `packages/contracts`.
- A API inicia vinculada a `127.0.0.1` por padrão. Um deployment em rede deve configurar TLS na borda e autenticação/autorização antes de receber tráfego além de endpoints operacionais.
- Migrations são executadas por comando explícito, com histórico e checksum; nunca no startup da API.

## Alternativas consideradas

1. Manter o acesso PostgreSQL no processo Electron, conforme o scaffold antigo. Rejeitada por contrariar o requisito de API central e tornar distribuição, atualização e controle de acesso ao banco menos adequados.
2. Criar microserviços ou comunicação HTTP a partir do renderer. Rejeitada: aumenta complexidade e amplia a superfície de ataque do renderer; o Main mantém a fronteira desktop e é o cliente HTTP.

## Consequências

- A API adiciona um deploy e uma fronteira operacional, mas centraliza integridade, credenciais e acesso a dados.
- Contratos compartilhados são versionados em `packages/contracts`.
- A autenticação para usuários e a exposição de rede da API precisam ser definidas antes de endpoints comerciais ou de disponibilizar a API numa rede.
- O `pg` permanece somente em `apps/api`; o desktop não recebe credenciais PostgreSQL.
