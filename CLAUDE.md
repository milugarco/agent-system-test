# Sistema Comercial — Instruções para Claude Code

## Objetivo

Construir um sistema comercial confiável e auditável com desktop Electron, API central e PostgreSQL, com:
- Cadastro de clientes
- Cadastro de produtos
- Vendas
- Controle de estoque
- Financeiro básico (contas a pagar/receber, pagamentos/recebimentos e caixa)

Não implementar fiscal/NF-e, multiempresa, controle de permissões complexo, integração bancária ou recursos fora do escopo sem decisão explícita.

## Stack e decisões fixas

- Desktop Electron + React + TypeScript + Vite
- API central Node.js + Fastify + TypeScript
- PostgreSQL central, acessado exclusivamente pela API
- Driver `pg`; SQL explícito e migrations SQL versionadas em `database/migrations/`
- npm workspaces em `apps/desktop`, `apps/api` e `packages/contracts`
- Zod para validar entradas nas fronteiras
- Vitest para testes
- Monólito modular na API; não criar microserviços
- Comunicação desktop→API por HTTP iniciada no processo Electron Main
- Renderer isolado do Node, da rede e do banco

Mudanças nessas decisões exigem proposta documentada em `docs/architecture/decisions/` e aprovação do usuário. A mudança aprovada para API central está em `docs/architecture/decisions/0001-central-api.md`.

## Arquitetura e fronteiras

### Renderer
- React cuida de apresentação, interação e estado de tela.
- Não importar `node:*`, `electron`, `pg`, filesystem, credenciais ou módulos de infraestrutura.
- Comunicar-se exclusivamente por métodos explícitos expostos pelo preload; o preload encaminha chamadas IPC permitidas ao Main.
- Não fazer chamadas HTTP diretamente: o Main é o cliente HTTP da API.
- Não colocar regra de negócio crítica no frontend.

### Preload
- `contextBridge.exposeInMainWorld` com uma API pequena, explícita e tipada.
- Não expor `ipcRenderer`, `send`, `invoke` genérico ou objetos Electron inteiros.
- Cada método deve mapear para um canal IPC específico.

### Main / aplicação
- Registrar poucos handlers IPC e validar `sender`/frame.
- Handlers IPC são adaptadores finos; fazem chamadas HTTP específicas à API.
- O Main não implementa regras comerciais, SQL ou acesso PostgreSQL.
- Regras de negócio e serviços da API não devem depender de Electron.
- Não retornar erros internos, SQL, stack traces ou segredos ao renderer.

### Persistência
- `pg` somente em `apps/api`.
- A API valida entradas com Zod e aplica regras de negócio no servidor.
- Usar parâmetros SQL (`$1`, `$2`...), nunca interpolar valores do usuário.
- Toda transação usa um único `PoolClient`: `BEGIN`, operações, `COMMIT`; em falha `ROLLBACK`; sempre `release` em `finally`.
- Definir constraints, foreign keys, índices e `NOT NULL` no banco; validação da aplicação não substitui integridade do banco.
- Migrations são imutáveis após aplicadas em ambientes compartilhados. Criar nova migration para corrigir schema.
- Nunca executar DDL automaticamente em cada inicialização do aplicativo.

## Organização de código esperada

A implementação deve evoluir para módulos por domínio, mantendo dependências apontando para dentro:

```text
apps/
  desktop/
    electron/
      main.ts
      preload.ts
    src/
      ui/
  api/
    src/
      modules/
      infrastructure/
        database/
          pool.ts
          migration-runner.ts
packages/
  contracts/
    src/
database/
  migrations/
apps/api/src/modules/
    customers/
      domain/
      application/
      infrastructure/
    products/
    sales/
    inventory/
    finance/
```

A estrutura pode ser ajustada quando o bootstrap real for criado, mas não misturar UI, casos de uso e SQL no mesmo arquivo.

## Regras de negócio obrigatórias

### Clientes e produtos
- Preferir identificadores internos UUID.
- CPF/CNPJ, quando informado, deve ter normalização e unicidade definida conscientemente; não assumir que todo cliente tem documento.
- Produtos inativos não podem ser incluídos em novas vendas, mas permanecem no histórico.
- Definir política de precisão e arredondamento para preço, desconto e quantidade antes da implementação.

### Vendas
- Estados mínimos propostos: `draft`, `confirmed`, `cancelled` (validar nomenclatura no domínio antes de codificar).
- Uma venda confirmada não pode ser editada destrutivamente.
- Confirmação deve validar cliente/produtos ativos, preço aplicado, quantidade disponível e regras de desconto.
- Persistir cabeçalho, itens, movimentos de estoque e títulos/recebíveis na mesma transação quando fizerem parte do mesmo caso de uso.
- Cancelamento gera operações compensatórias auditáveis; nunca apagar venda confirmada ou movimentações.
- Evitar dupla confirmação com controle de estado/concorrência e constraints apropriadas.

### Estoque
- Tratar movimentações como fonte de auditoria: entrada, saída, ajuste e estorno.
- Saldo não pode ficar negativo, salvo decisão explícita documentada.
- Proteger concorrência: bloquear/atualizar saldo de forma transacional; não confiar em `SELECT` seguido de `UPDATE` sem lock/condição atômica.
- Toda movimentação referencia origem, data, quantidade, produto e motivo.
- Não permitir alteração ou exclusão silenciosa de movimentação confirmada.

### Financeiro
- Separar contas a receber, contas a pagar e liquidações (recebimentos/pagamentos).
- Uma venda pode gerar um ou mais títulos a receber conforme condições de pagamento aprovadas.
- Liquidações parciais precisam ser modeladas ou explicitamente excluídas do MVP por decisão.
- Cancelamentos e estornos financeiros devem preservar trilha de auditoria.
- Não chamar faturamento de fluxo de caixa: caixa registra entradas/saídas efetivas.

## Segurança Electron

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true` quando compatível com a configuração escolhida
- CSP restritiva
- Validar `sender`/origem dos IPC quando aplicável
- Não carregar conteúdo remoto arbitrário
- Não armazenar credenciais no renderer nem versionar `.env`
- Evitar `shell.openExternal` sem allowlist/validação
- Desabilitar DevTools em builds de produção, salvo decisão explícita de diagnóstico
- A API inicia em `127.0.0.1` por padrão. Antes de expô-la em rede, definir autenticação/autorização, TLS e política de origem/rate limit adequadas ao deployment.
- O renderer não acessa a API diretamente; a política CSP limita `connect-src` e o Main valida origem e remetente do IPC.

## Qualidade

- TypeScript strict; evitar `any` e casts sem justificativa.
- Funções pequenas e coesas, nomes de domínio explícitos.
- Erros de domínio tipados; não usar exceções genéricas como fluxo normal.
- Testar regras de negócio sem Electron e sem banco sempre que possível.
- Testes de integração para transações, constraints e concorrência de estoque.
- Não considerar tarefa concluída sem testes relevantes e revisão do diff.
- Não adicionar dependência sem explicar benefício, custo e alternativa.
- Não implementar abstrações especulativas ou generic repositories sem caso concreto.

## Workflow dos agentes

1. `architect` define/valida fronteiras e registra decisões relevantes.
2. `database` propõe schema, constraints e migrations quando houver persistência.
3. `backend` implementa domínio, casos de uso, rotas HTTP e repositórios PostgreSQL na API.
4. `frontend` implementa telas usando somente contratos compartilhados e métodos explícitos do preload, que encaminham operações HTTP específicas.
5. `qa` cria/roda testes e identifica lacunas.
6. `code-reviewer` revisa diff, segurança, integridade e regressões.

Não delegar tarefas concorrentes que editem os mesmos arquivos. Antes de alterar contratos compartilhados, alinhar com `architect` e comunicar os consumidores. O agente principal integra e resolve conflitos.

## Git

- Branch principal: `main`
- Branches curtas: `feat/<assunto>`, `fix/<assunto>`, `chore/<assunto>`, `docs/<assunto>`
- Commits em Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Não fazer commit de `.env`, credenciais, dumps ou dados reais.
- Não reescrever histórico compartilhado sem autorização.
- Não executar `git push`, criar PR ou publicar release sem solicitação explícita do usuário.

## Antes de começar qualquer tarefa

1. Ler este arquivo e as regras relevantes em `.claude/rules/`.
2. Inspecionar o estado atual do repositório; não presumir que arquivos estão vazios.
3. Identificar contratos, módulos e testes afetados.
4. Propor plano curto quando a tarefa tocar mais de um módulo ou schema.
5. Implementar o menor conjunto coeso.
6. Rodar testes/lint/typecheck disponíveis.
7. Resumir arquivos alterados, decisões, comandos executados e riscos restantes.

## Fora de escopo sem autorização

- NF-e, NFC-e, SPED ou qualquer obrigação fiscal
- Integração com adquirentes/bancos
- Sincronização em nuvem
- Multi-tenant
- Controle de permissões complexo
- Contabilidade completa
