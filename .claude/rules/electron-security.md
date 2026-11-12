# Regras de segurança Electron

- Renderer sem Node integration.
- `contextIsolation` sempre habilitado.
- Preload expõe métodos específicos, nunca APIs genéricas de IPC.
- Validar todo payload IPC no processo principal e validar respostas HTTP antes de expô-las ao renderer.
- Validar origem/sender quando aplicável.
- Não carregar HTML remoto arbitrário.
- CSP restritiva e sem `unsafe-eval` em produção.
- O Main pode guardar configuração do endpoint HTTP da API, mas não recebe credenciais PostgreSQL nem importa `pg`.
- Credenciais PostgreSQL e acesso ao banco existem somente na API.
- Renderer não faz chamadas de rede; o Main é o cliente HTTP.
- Revisar qualquer uso de `shell`, filesystem, child process ou navegação externa.
