// Ponto de entrada na AWS Lambda (Function URL). As variáveis de ambiente
// são configuradas na própria Lambda, nunca no código (regra 4).
import { handle } from 'hono/aws-lambda';

import { criarApp, lerVariavel } from './app';
import { criarClienteAnthropic } from './llm/cliente';
import { interpretarRegistro } from './llm/interpretar';
import { conversarOnboarding } from './llm/onboarding';

const cliente = criarClienteAnthropic(lerVariavel('ANTHROPIC_API_KEY'));
const app = criarApp({
  appToken: lerVariavel('APP_TOKEN'),
  interpretarRegistro: (pedido) => interpretarRegistro(cliente, pedido),
  conversarOnboarding: (pedido) => conversarOnboarding(cliente, pedido),
});

export const handler = handle(app);
