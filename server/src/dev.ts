// Servidor local para desenvolvimento: `npm run dev` (lê o server/.env).
import { serve } from '@hono/node-server';

import { criarApp, lerVariavel } from './app';

const PORTA = Number(process.env.PORT ?? 8787);

const app = criarApp({ appToken: lerVariavel('APP_TOKEN') });

serve({ fetch: app.fetch, port: PORTA }, (info) => {
  console.log(`Servidor em http://localhost:${info.port} (GET /saude para testar)`);
});
