// Tokens e custo de uma rodada de eval. A API devolve em cada resposta
// quantos tokens entraram e saíram (`usage`); aqui só somamos.

import type { ClienteLLM } from '../src/llm/cliente';

// Preço do Claude Haiku 5.5 em dólares por milhão de tokens (prompts de até
// 100 mil tokens). Mudou o modelo em src/llm/cliente.ts? Mude aqui também.
export const PRECO_POR_MILHAO = { entrada: 0.1, saida: 0.5 };

export interface Uso {
  chamadas: number;
  entrada: number; // tokens
  saida: number;
}

export function custoEmDolares(uso: Uso): number {
  return (uso.entrada * PRECO_POR_MILHAO.entrada + uso.saida * PRECO_POR_MILHAO.saida) / 1_000_000;
}

export function resumoDoUso(uso: Uso): string {
  return `${uso.chamadas} chamadas · ${uso.entrada} tokens de entrada · ${uso.saida} de saída · US$ ${custoEmDolares(uso).toFixed(4)}`;
}

// Embrulha o cliente: cada chamada passa adiante igual, e o uso vai sendo
// somado em `uso`. Conta também a segunda tentativa de chamarFerramenta().
export function comMedidor(cliente: ClienteLLM): { cliente: ClienteLLM; uso: Uso } {
  const uso: Uso = { chamadas: 0, entrada: 0, saida: 0 };
  const medido: ClienteLLM = {
    messages: {
      async create(parametros) {
        const resposta = await cliente.messages.create(parametros);
        uso.chamadas += 1;
        uso.entrada += resposta.usage?.input_tokens ?? 0;
        uso.saida += resposta.usage?.output_tokens ?? 0;
        return resposta;
      },
    },
  };
  return { cliente: medido, uso };
}
