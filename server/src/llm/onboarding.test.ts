import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';

import type { PedidoOnboarding, RespostaOnboarding } from '../contrato';

import type { ClienteLLM } from './cliente';
import { aplicarRegras, contarPerguntas, conversarOnboarding, montarConteudo, PROMPT_ONBOARDING } from './onboarding';

const PEDIDO: PedidoOnboarding = {
  mensagens: [
    { papel: 'assistente', texto: 'Em quais dias você treina e o que treina em cada um?' },
    { papel: 'usuario', texto: 'seg peito e triceps, ter costas e biceps, qua perna' },
  ],
  rascunho: null,
};

const RESPOSTA: RespostaOnboarding = {
  rascunho: {
    nome: null, objetivo: null, tempoDeTreino: null, horarioTreino: null,
    treinos: [
      { nome: 'Peito e tríceps', diasSemana: [1], exercicios: [] },
      { nome: 'Costas e bíceps', diasSemana: [2], exercicios: [] },
      { nome: 'Perna', diasSemana: [3], exercicios: [] },
    ],
  },
  proximaPergunta: 'Quais exercícios você faz no treino de peito e tríceps? Ex.: supino reto 20kg 3x10',
  completo: false,
};

function clienteQueResponde(input: unknown) {
  const create = vi.fn().mockResolvedValue({
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 'toolu_1', name: 'atualizar_rascunho', input }] as Anthropic.ContentBlock[],
  });
  const cliente: ClienteLLM = { messages: { create } };
  return { cliente, create };
}

describe('conversarOnboarding', () => {
  it('devolve o rascunho e a próxima pergunta, com a conversa no pedido à IA', async () => {
    const { cliente, create } = clienteQueResponde(RESPOSTA);
    expect(await conversarOnboarding(cliente, PEDIDO)).toEqual({ ok: true, valor: RESPOSTA });
    const parametros = create.mock.calls[0]?.[0];
    expect(parametros.tool_choice).toEqual({ type: 'tool', name: 'atualizar_rascunho' });
    expect(parametros.messages[0].content).toContain('usuario: seg peito e triceps');
  });

  it('resposta fora do contrato duas vezes: resposta inválida', async () => {
    const { cliente, create } = clienteQueResponde({ rascunho: { treinos: 'x' } });
    expect(await conversarOnboarding(cliente, PEDIDO)).toEqual({ ok: false, motivo: 'resposta_invalida' });
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe('aplicarRegras (§8.4)', () => {
  it('um dia em dois treinos fica só no primeiro, e dia repetido some', () => {
    const duplicado: RespostaOnboarding = {
      ...RESPOSTA,
      rascunho: {
        nome: null, objetivo: null, tempoDeTreino: null, horarioTreino: null,
        treinos: [
          { nome: 'A', diasSemana: [1, 1, 3], exercicios: [] },
          { nome: 'B', diasSemana: [3, 5], exercicios: [] },
        ],
      },
    };
    expect(aplicarRegras(duplicado, 1).rascunho.treinos.map((t) => t.diasSemana)).toEqual([[1, 3], [5]]);
  });

  it('depois de 7 perguntas a conversa termina', () => {
    expect(aplicarRegras(RESPOSTA, 7)).toMatchObject({ completo: true, proximaPergunta: null });
    expect(aplicarRegras(RESPOSTA, 6)).toMatchObject({ completo: false });
  });

  it('completo nunca vem com pergunta, e sem pergunta é completo', () => {
    expect(aplicarRegras({ ...RESPOSTA, completo: true }, 2).proximaPergunta).toBeNull();
    expect(aplicarRegras({ ...RESPOSTA, proximaPergunta: null }, 2).completo).toBe(true);
  });
});

describe('PROMPT_ONBOARDING', () => {
  it('manda registrar o perfil sem insistir e sem decidir a faixa de reps', () => {
    expect(PROMPT_ONBOARDING).toContain('Regras do perfil');
    expect(PROMPT_ONBOARDING).toContain('você não pergunta de novo');
    expect(PROMPT_ONBOARDING).not.toMatch(/faixa de rep/i);
  });
});

describe('montarConteudo e contarPerguntas', () => {
  it('conta só as falas do assistente', () => {
    expect(contarPerguntas(PEDIDO)).toBe(1);
  });

  it('inclui o rascunho atual e a conversa entre tags', () => {
    const texto = montarConteudo({ ...PEDIDO, rascunho: RESPOSTA.rascunho });
    expect(texto).toContain('"nome":"Perna"');
    expect(texto).toContain('Perguntas já feitas: 1 de 7');
    expect(texto).toMatch(/<conversa>\nassistente: .*\nusuario: .*\n<\/conversa>/);
  });
});
