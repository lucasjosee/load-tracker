// Servidor local para desenvolvimento: `npm run dev` (lê o server/.env).
import { serve } from '@hono/node-server';

import { criarApp, lerVariavel } from './app';
import { criarClienteAnthropic } from './llm/cliente';
import { interpretarRegistro } from './llm/interpretar';
import { conversarOnboarding } from './llm/onboarding';

const PORTA = Number(process.env.PORT ?? 8787);

const cliente = criarClienteAnthropic(lerVariavel('ANTHROPIC_API_KEY'));
const app = criarApp({
  appToken: lerVariavel('APP_TOKEN'),
  interpretarRegistro: (pedido) => interpretarRegistro(cliente, pedido),
  conversarOnboarding: (pedido) => conversarOnboarding(cliente, pedido),
});

serve({ fetch: app.fetch, port: PORTA }, (info) => {
  console.log(`Servidor em http://localhost:${info.port} (GET /saude para testar)`);
});
