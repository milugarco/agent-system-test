# Sistema Comercial

Aplicação desktop comercial construída com Electron, React, TypeScript e PostgreSQL.

## Stack

- Electron: processo principal e janela desktop
- React + TypeScript + Vite: renderer
- IPC tipado via preload: fronteira renderer/main
- Node.js + `pg`: acesso ao PostgreSQL no processo principal
- Zod: validação de payloads nas fronteiras
- Vitest: testes unitários e de integração
- SQL versionado: migrations explícitas

## Pré-requisitos

- Node.js LTS
- npm
- Docker Desktop (para PostgreSQL local) ou PostgreSQL 17 acessível
- Git
- Claude Code

## Inicialização

```bash
git clone <URL_DO_REPOSITORIO>
cd sistema-comercial
cp .env.example .env
docker compose up -d postgres
npm install
```

O scaffold inicial ainda não contém a aplicação executável nem os scripts npm. A próxima etapa é implementar o bootstrap Electron/Vite e o primeiro módulo vertical.

## Diretrizes arquiteturais

- Renderer não importa `pg`, módulos Node ou código do processo principal.
- `contextIsolation: true`, `nodeIntegration: false` e sandbox habilitado.
- O preload expõe somente métodos de negócio explicitamente permitidos.
- IPC valida todos os argumentos no processo principal.
- Serviços de aplicação orquestram casos de uso; repositórios encapsulam SQL.
- Transações pertencem à camada de aplicação/serviço e usam uma única conexão `pg`.
- Estoque é um livro de movimentações; saldo é derivado ou mantido como projeção transacional.
- Venda confirmada, itens, movimentações de estoque e títulos financeiros devem ser persistidos atomicamente.
- Registros financeiros e movimentações confirmadas não são apagados para simular cancelamento; usar estornos auditáveis.
- Valores monetários usam `NUMERIC` no PostgreSQL e representação decimal segura na aplicação. Nunca usar `number` para cálculos monetários sem estratégia explícita de precisão.

## Agentes Claude

Os agentes em `.claude/agents/` são especializados. Consulte `CLAUDE.md` antes de qualquer alteração.
