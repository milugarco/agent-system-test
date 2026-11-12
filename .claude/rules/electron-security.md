# Regras de segurança Electron

- Renderer sem Node integration.
- `contextIsolation` sempre habilitado.
- Preload expõe métodos específicos, nunca APIs genéricas de IPC.
- Validar todo payload no processo principal.
- Validar origem/sender quando aplicável.
- Não carregar HTML remoto arbitrário.
- CSP restritiva e sem `unsafe-eval` em produção.
- Segredos e acesso PostgreSQL somente no main.
- Revisar qualquer uso de `shell`, filesystem, child process ou navegação externa.
