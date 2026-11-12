import { useState } from 'react';
import type { ApiHealthResponse } from '@sistema/contracts';

export function App() {
  const [apiHealth, setApiHealth] = useState<ApiHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkApi(): Promise<void> {
    setChecking(true);
    setError(null);
    try {
      setApiHealth(await window.desktopApi.checkApiHealth());
    } catch {
      setApiHealth(null);
      setError('Não foi possível alcançar a API.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="page">
      <section className="status-card" aria-labelledby="page-title">
        <p className="eyebrow">Infraestrutura</p>
        <h1 id="page-title">Sistema Comercial</h1>
        <p className="description">
          Aplicativo desktop conectado à API central. Os módulos comerciais ainda não foram iniciados.
        </p>
        <button onClick={() => void checkApi()} disabled={checking}>
          {checking ? 'Verificando…' : 'Verificar conexão com a API'}
        </button>
        <p className="result" role="status" aria-live="polite">
          {error ?? (apiHealth ? `API online: ${apiHealth.service}` : 'Conexão ainda não verificada.')}
        </p>
      </section>
    </main>
  );
}
