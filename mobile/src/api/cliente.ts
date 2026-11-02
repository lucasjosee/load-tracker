// Cliente do servidor (só a IA passa por aqui; o resto do app é offline).
// Toda resposta é validada com o mesmo contrato zod do servidor antes de
// chegar às telas (regra 3).

import type { z } from 'zod';

import {
  respostaInterpretar,
  respostaOnboarding,
  type PedidoInterpretar,
  type PedidoOnboarding,
  type RespostaInterpretar,
  type RespostaOnboarding,
} from './contrato';

// O servidor pode levar 15 s na IA e tentar mais uma vez: 35 s cobre isso.
const TEMPO_LIMITE_MS = 35_000;

export type FalhaDaApi =
  | 'sem_configuracao' // .env sem EXPO_PUBLIC_API_URL: o app segue só com o manual
  | 'sem_conexao' // sem internet, servidor fora ou demorou demais
  | 'nao_entendeu' // 422: a IA não conseguiu interpretar
  | 'erro'; // qualquer outra resposta inesperada

export type RespostaDaApi<T> = { ok: true; valor: T } | { ok: false; falha: FalhaDaApi };

// Variáveis EXPO_PUBLIC_* são copiadas para dentro do app na hora de montar
// o bundle; mudou o .env, reinicie o `expo start`.
const URL_DA_API = process.env.EXPO_PUBLIC_API_URL ?? '';
const TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN ?? '';

export function apiConfigurada(): boolean {
  return URL_DA_API !== '' && TOKEN !== '';
}

async function postar<T>(caminho: string, corpo: unknown, schema: z.ZodType<T>): Promise<RespostaDaApi<T>> {
  if (!apiConfigurada()) {
    return { ok: false, falha: 'sem_configuracao' };
  }
  // AbortController cancela o fetch se passar do tempo limite; sem ele, uma
  // conexão ruim na academia deixaria a tela esperando para sempre.
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(`${URL_DA_API.replace(/\/$/, '')}${caminho}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-app-token': TOKEN },
      body: JSON.stringify(corpo),
      signal: controle.signal,
    });
    if (resposta.status === 422) {
      return { ok: false, falha: 'nao_entendeu' };
    }
    if (resposta.status === 502) {
      return { ok: false, falha: 'sem_conexao' };
    }
    if (!resposta.ok) {
      return { ok: false, falha: 'erro' };
    }
    const validacao = schema.safeParse(await resposta.json());
    return validacao.success ? { ok: true, valor: validacao.data } : { ok: false, falha: 'erro' };
  } catch {
    // fetch só lança exceção quando não houve resposta: rede ou tempo esgotado.
    return { ok: false, falha: 'sem_conexao' };
  } finally {
    clearTimeout(relogio);
  }
}

export function interpretarTexto(pedido: PedidoInterpretar): Promise<RespostaDaApi<RespostaInterpretar>> {
  return postar('/v1/registro/interpretar', pedido, respostaInterpretar);
}

export function conversarOnboarding(pedido: PedidoOnboarding): Promise<RespostaDaApi<RespostaOnboarding>> {
  return postar('/v1/onboarding/conversa', pedido, respostaOnboarding);
}

export function mensagemDaFalha(falha: FalhaDaApi): string {
  switch (falha) {
    case 'sem_configuracao':
      return 'O registro por texto ainda não está configurado. Preencha manualmente.';
    case 'sem_conexao':
      return 'Sem conexão com a IA agora. Preencha manualmente; funciona offline.';
    case 'nao_entendeu':
      return 'Não consegui entender o texto. Preencha manualmente.';
    case 'erro':
      return 'Algo deu errado com a IA. Preencha manualmente.';
  }
}
