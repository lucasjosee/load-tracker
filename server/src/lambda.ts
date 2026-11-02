// Ponto de entrada na AWS Lambda (Function URL). As variáveis de ambiente
// são configuradas na própria Lambda, nunca no código (regra 4).
import { handle } from 'hono/aws-lambda';

import { criarApp, lerVariavel } from './app';

const app = criarApp({ appToken: lerVariavel('APP_TOKEN') });

export const handler = handle(app);
