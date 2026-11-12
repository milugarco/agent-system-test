# Banco de dados e transações

- SQL sempre parametrizado.
- `NUMERIC` para valores financeiros.
- Transações usam um único `PoolClient`.
- `ROLLBACK` em falhas e `release` em `finally`.
- Constraints no banco são obrigatórias para invariantes persistentes.
- Migrations incrementais e versionadas.
- Não apagar registros confirmados de vendas, estoque ou financeiro.
- Mudanças em schema devem incluir plano de migração e testes.
