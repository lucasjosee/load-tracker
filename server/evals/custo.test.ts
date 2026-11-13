import { describe, expect, it } from 'vitest';

import type { ClienteLLM } from '../src/llm/cliente';

import { comMedidor, custoEmDolares, resumoDoUso } from './custo';

describe('custoEmDolares', () => {
  it('cobra entrada e saída pelos preços do Haiku 5.5', () => {
    // 1 milhão de entrada (US$ 0,10) + 1 milhão de saída (US$ 0,50)
    expect(custoEmDolares({ chamadas: 1, entrada: 1_000_000, saida: 1_000_000 })).toBeCloseTo(0.6);
    expect(custoEmDolares({ chamadas: 0, entrada: 0, saida: 0 })).toBe(0);
  });
});

describe('comMedidor', () => {
  const falso = (entrada?: number, saida?: number): ClienteLLM => ({
    messages: {
      create: async () => ({
        content: [],
        stop_reason: 'tool_use',
        ...(entrada === undefined || saida === undefined ? {} : { usage: { input_tokens: entrada, output_tokens: saida } }),
      }),
    },
  });
  const parametros = { model: 'm', max_tokens: 1, messages: [] };

  it('soma os tokens de todas as chamadas e devolve a resposta sem mexer', async () => {
    const { cliente, uso } = comMedidor(falso(1000, 100));
    const resposta = await cliente.messages.create(parametros);
    await cliente.messages.create(parametros);

    expect(resposta.stop_reason).toBe('tool_use');
    expect(uso).toEqual({ chamadas: 2, entrada: 2000, saida: 200 });
    expect(resumoDoUso(uso)).toBe('2 chamadas · 2000 tokens de entrada · 200 de saída · US$ 0.0003');
  });

  it('resposta sem usage conta a chamada, com zero tokens', async () => {
    const { cliente, uso } = comMedidor(falso());
    await cliente.messages.create(parametros);
    expect(uso).toEqual({ chamadas: 1, entrada: 0, saida: 0 });
  });
});
