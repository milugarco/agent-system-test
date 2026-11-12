# Migrations SQL

Adicione migrations incrementais com nomes `NNNN_descricao.sql`, em ordem crescente.

O comando `npm run db:migrate` cria a tabela de histórico, adquire um advisory lock, confere o SHA-256 de migrations já aplicadas e executa cada migration e seu registro na mesma transação. Uma migration aplicada não pode ser editada; crie outra migration para corrigir o schema.

`npm run db:status` lista migrations aplicadas e pendentes sem alterar o banco. Migrations não são executadas ao iniciar a API. O diretório está vazio enquanto nenhum schema comercial foi aprovado.
