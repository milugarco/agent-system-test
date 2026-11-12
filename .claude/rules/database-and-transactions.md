# Banco de dados e transações

- SQL sempre parametrizado.
- `NUMERIC` para valores financeiros.
- PostgreSQL e `pg` só são usados em `apps/api`; Electron nunca acessa o banco.
- Transações usam um único `PoolClient`.
- `ROLLBACK` em falhas e `release` em `finally`.
- Constraints no banco são obrigatórias para invariantes persistentes.
- Migrations incrementais e versionadas em `database/migrations/`; executar somente por comando explícito, nunca no startup da API.
- Não apagar registros confirmados de vendas, estoque ou financeiro.
- Mudanças em schema devem incluir plano de migração e testes.
