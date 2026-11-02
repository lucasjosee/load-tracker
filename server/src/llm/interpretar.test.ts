import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';

import type { PedidoInterpretar, RespostaInterpretar } from '../contrato';

import type { ClienteLLM, RespostaDoModelo } from './cliente';
import { interpretarRegistro, montarConteudo } from './interpretar';

const PEDIDO: PedidoInterpretar = {
  texto: 'supino inclinado 10kg 8,8,7 e crucifixo 14 3x12',
  exercicios: [{ id: 'ex_01', nome: 'Supino inclinado com halteres' }],
};

const VALIDA: RespostaInterpretar = {
  itens: [
    { exercicioId: 'ex_01', nome: 'Supino inclinado com halteres', grupoMuscular: 'peito', equipamento: 'halter', cargaKg: 10, reps: [8, 8, 7], confianca: 'alta' },
    { exercicioId: null, nome: 'Crucifixo com halteres', grupoMuscular: 'peito', equipamento: 'halter', cargaKg: 14, reps: [12, 12, 12], confianca: 'media' },
  ],
  naoEntendido: [],
};

// Uma resposta da API em que o modelo chamou a ferramenta com `input`. Só os
// campos que o servidor lê; o `as` é porque o tipo do SDK tem mais campos.
function chamouFerramenta(input: unknown): RespostaDoModelo {
  return {
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 'toolu_1', name: 'registrar_itens', input }] as Anthropic.ContentBlock[],
  };
}

// Cliente falso: devolve as respostas da lista, uma por chamada.
function clienteFalso(...respostas: (RespostaDoModelo | Error)[]) {
  const create = vi.fn();
  for (const resposta of respostas) {
    if (resposta instanceof Error) {
      create.mockRejectedValueOnce(resposta);
    } else {
      create.mockResolvedValueOnce(resposta);
    }
  }
  const cliente: ClienteLLM = { messages: { create } };
  return { cliente, create };
}

describe('interpretarRegistro', () => {
  it('resposta válida: devolve os itens numa chamada só', async () => {
    const { cliente, create } = clienteFalso(chamouFerramenta(VALIDA));
    expect(await interpretarRegistro(cliente, PEDIDO)).toEqual({ ok: true, valor: VALIDA });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('chama o Haiku com a ferramenta forçada e sem temperature (§8.2)', async () => {
    const { cliente, create } = clienteFalso(chamouFerramenta(VALIDA));
    await interpretarRegistro(cliente, PEDIDO);
    const parametros = create.mock.calls[0]?.[0];
    expect(parametros).toMatchObject({
      model: 'claude-haiku-5-5',
      tool_choice: { type: 'tool', name: 'registrar_itens' },
    });
    expect(parametros).not.toHaveProperty('temperature');
    expect(parametros.tools[0].input_schema).toMatchObject({ type: 'object', required: ['itens', 'naoEntendido'] });
  });

  it('resposta inválida: tenta de novo mostrando o erro, e aceita a segunda', async () => {
    const invalida = { itens: [{ ...VALIDA.itens[0], grupoMuscular: 'braço' }], naoEntendido: [] };
    const { cliente, create } = clienteFalso(chamouFerramenta(invalida), chamouFerramenta(VALIDA));

    expect(await interpretarRegistro(cliente, PEDIDO)).toEqual({ ok: true, valor: VALIDA });
    expect(create).toHaveBeenCalledTimes(2);
    // Na segunda chamada vão: o pedido, a chamada errada e o tool_result de erro.
    const mensagens = create.mock.calls[1]?.[0].messages;
    expect(mensagens).toHaveLength(3);
    expect(mensagens[2].content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'toolu_1', is_error: true });
    expect(mensagens[2].content[0].content).toContain('grupoMuscular');
  });

  it('inválida duas vezes: desiste (vira 422 na rota)', async () => {
    const { cliente, create } = clienteFalso(chamouFerramenta({ itens: 'x' }), chamouFerramenta({}));
    expect(await interpretarRegistro(cliente, PEDIDO)).toEqual({ ok: false, motivo: 'resposta_invalida' });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('modelo recusou ou não chamou a ferramenta: resposta inválida', async () => {
    const { cliente } = clienteFalso({ stop_reason: 'refusal', content: [] });
    expect(await interpretarRegistro(cliente, PEDIDO)).toEqual({ ok: false, motivo: 'resposta_invalida' });
  });

  it('erro da API (timeout, 529, rede): indisponível, sem nova tentativa', async () => {
    const erro = new Anthropic.APIConnectionTimeoutError();
    const { cliente, create } = clienteFalso(erro);
    expect(await interpretarRegistro(cliente, PEDIDO)).toEqual({ ok: false, motivo: 'indisponivel' });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('id que não está na lista enviada vira null', async () => {
    const comIdInventado = { ...VALIDA, itens: [{ ...VALIDA.itens[0], exercicioId: 'ex_99' }] };
    const { cliente } = clienteFalso(chamouFerramenta(comIdInventado));
    const resultado = await interpretarRegistro(cliente, PEDIDO);
    expect(resultado.ok && resultado.valor.itens[0]?.exercicioId).toBeNull();
  });
});

describe('montarConteudo', () => {
  it('lista os exercícios e isola a anotação entre tags', () => {
    expect(montarConteudo(PEDIDO)).toBe(
      'Exercícios cadastrados (id: nome):\n- ex_01: Supino inclinado com halteres\n\n<anotacao>\nsupino inclinado 10kg 8,8,7 e crucifixo 14 3x12\n</anotacao>',
    );
  });

  it('sem exercícios cadastrados, avisa', () => {
    expect(montarConteudo({ texto: 'rosca 10kg 3x10', exercicios: [] })).toContain('(nenhum exercício cadastrado)');
  });
});
