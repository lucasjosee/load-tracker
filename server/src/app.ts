// Rotas HTTP do servidor (Hono). O mesmo `app` roda local (dev.ts) e na
// AWS Lambda (lambda.ts): só muda quem entrega as requisições a ele.

import { timingSafeEqual } from 'node:crypto';

import { Hono } from 'hono';

import { pedidoInterpretar, type PedidoInterpretar, type RespostaDeErro, type RespostaInterpretar } from './contrato';
import type { ResultadoDaIA } from './llm/ferramenta';

// O que o app precisa para responder. As funções da IA entram por aqui para
// que os testes passem versões falsas, sem chamar a Anthropic.
export interface Dependencias {
  appToken: string;
  interpretarRegistro: (pedido: PedidoInterpretar) => Promise<ResultadoDaIA<RespostaInterpretar>>;
}

// 422: a IA respondeu, mas nada aproveitável; 502: a IA nem respondeu. Nos
// dois casos o app oferece o formulário manual (§8.2).
function erroDaIA(motivo: 'resposta_invalida' | 'indisponivel') {
  return motivo === 'resposta_invalida'
    ? { status: 422 as const, corpo: { erro: 'Não consegui interpretar o texto.' } }
    : { status: 502 as const, corpo: { erro: 'A IA está indisponível agora.' } };
}

// Lê o corpo como JSON sem estourar exceção quando ele não é JSON.
async function lerJson(requisicao: Request): Promise<unknown> {
  try {
    return await requisicao.json();
  } catch {
    return undefined;
  }
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

  app.post('/v1/registro/interpretar', async (c) => {
    const pedido = pedidoInterpretar.safeParse(await lerJson(c.req.raw));
    if (!pedido.success) {
      return c.json<RespostaDeErro>({ erro: 'Pedido inválido.' }, 400);
    }
    const resultado = await dependencias.interpretarRegistro(pedido.data);
    if (!resultado.ok) {
      const { status, corpo } = erroDaIA(resultado.motivo);
      return c.json<RespostaDeErro>(corpo, status);
    }
    return c.json<RespostaInterpretar>(resultado.valor);
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
