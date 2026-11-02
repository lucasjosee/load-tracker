// Rotas HTTP do servidor (Hono). O mesmo `app` roda local (dev.ts) e na
// AWS Lambda (lambda.ts): só muda quem entrega as requisições a ele.

import { timingSafeEqual } from 'node:crypto';

import { Hono } from 'hono';

import type { RespostaDeErro } from './contrato';

export interface Dependencias {
  appToken: string;
}

// Comparar com `===` para assim que acha o primeiro caractere diferente, e
// o tempo de resposta vaza quantos caracteres do token estavam certos.
// timingSafeEqual leva sempre o mesmo tempo.
function tokenConfere(recebido: string | undefined, esperado: string): boolean {
  if (recebido === undefined) {
    return false;
  }
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function criarApp(dependencias: Dependencias) {
  const app = new Hono();

  // Público: serve para conferir se o servidor está de pé.
  app.get('/saude', (c) => c.json({ ok: true }));

  // Tudo em /v1 exige o token do app (§8.6).
  app.use('/v1/*', async (c, proximo) => {
    if (!tokenConfere(c.req.header('x-app-token'), dependencias.appToken)) {
      return c.json<RespostaDeErro>({ erro: 'Token inválido.' }, 401);
    }
    await proximo();
  });

  app.notFound((c) => c.json<RespostaDeErro>({ erro: 'Rota não encontrada.' }, 404));

  // Erro inesperado: registra no log (sem o texto do usuário, §8.6) e
  // devolve uma mensagem genérica.
  app.onError((erro, c) => {
    console.error('Erro inesperado:', erro.message);
    return c.json<RespostaDeErro>({ erro: 'Erro interno.' }, 500);
  });

  return app;
}

// Lê a configuração das variáveis de ambiente. Falta de variável é erro de
// instalação, não de uso: o servidor nem sobe.
export function lerVariavel(nome: string, ambiente: NodeJS.ProcessEnv = process.env): string {
  const valor = ambiente[nome];
  if (valor === undefined || valor.trim() === '') {
    throw new Error(`Variável de ambiente ${nome} não configurada (veja server/.env.example).`);
  }
  return valor;
}
