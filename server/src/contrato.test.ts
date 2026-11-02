import { describe, expect, it } from 'vitest';

import { pedidoInterpretar, pedidoOnboarding, respostaInterpretar, respostaOnboarding } from './contrato';

// Os exemplos da especificação têm que passar no contrato tal como estão.
describe('contrato: exemplos da §8.3', () => {
  it('pedido de interpretar', () => {
    const pedido = {
      texto: 'supino inclinado 10kg 8,8,7 e crucifixo 14 3x12',
      exercicios: [{ id: 'ex_01', nome: 'Supino inclinado com halteres' }],
    };
    expect(pedidoInterpretar.parse(pedido)).toEqual(pedido);
  });

  it('resposta de interpretar', () => {
    const resposta = {
      itens: [
        {
          exercicioId: 'ex_01',
          nome: 'Supino inclinado com halteres',
          grupoMuscular: 'peito',
          equipamento: 'halter',
          cargaKg: 10,
          reps: [8, 8, 7],
          confianca: 'alta',
        },
        {
          exercicioId: null,
          nome: 'Crucifixo com halteres',
          grupoMuscular: 'peito',
          equipamento: 'halter',
          cargaKg: 14,
          reps: [12, 12, 12],
          confianca: 'media',
        },
      ],
      naoEntendido: [],
    };
    expect(respostaInterpretar.parse(resposta)).toEqual(resposta);
  });

  it('recusa texto vazio, longo demais e grupo fora da lista', () => {
    expect(pedidoInterpretar.safeParse({ texto: '  ', exercicios: [] }).success).toBe(false);
    expect(pedidoInterpretar.safeParse({ texto: 'a'.repeat(1001), exercicios: [] }).success).toBe(false);
    const item = { exercicioId: null, nome: 'Rosca', grupoMuscular: 'braço', equipamento: 'halter', cargaKg: 10, reps: [8], confianca: 'alta' };
    expect(respostaInterpretar.safeParse({ itens: [item], naoEntendido: [] }).success).toBe(false);
  });

  it('recusa carga negativa e item sem séries', () => {
    const base = { exercicioId: null, nome: 'Rosca', grupoMuscular: 'biceps', equipamento: 'halter', confianca: 'alta' };
    expect(respostaInterpretar.safeParse({ itens: [{ ...base, cargaKg: -1, reps: [8] }], naoEntendido: [] }).success).toBe(false);
    expect(respostaInterpretar.safeParse({ itens: [{ ...base, cargaKg: 10, reps: [] }], naoEntendido: [] }).success).toBe(false);
  });
});

describe('contrato: exemplos da §8.4', () => {
  it('pedido e resposta do onboarding', () => {
    const pedido = {
      mensagens: [
        { papel: 'assistente', texto: 'Em quais dias você treina e o que treina em cada um?' },
        { papel: 'usuario', texto: 'seg peito e triceps, ter costas e biceps, qua perna' },
      ],
      rascunho: null,
    };
    expect(pedidoOnboarding.parse(pedido)).toEqual(pedido);

    const resposta = {
      rascunho: {
        horarioTreino: null,
        treinos: [
          { nome: 'Peito e tríceps', diasSemana: [1], exercicios: [] },
          { nome: 'Costas e bíceps', diasSemana: [2], exercicios: [] },
          { nome: 'Perna', diasSemana: [3], exercicios: [] },
        ],
      },
      proximaPergunta: 'Quais exercícios você faz no treino de peito e tríceps, com carga e repetições?',
      completo: false,
    };
    expect(respostaOnboarding.parse(resposta)).toEqual(resposta);
  });

  it('recusa horário fora de HH:MM, dia 7 e mais de 20 mensagens', () => {
    const vazio = { horarioTreino: null, treinos: [] };
    expect(respostaOnboarding.safeParse({ rascunho: { ...vazio, horarioTreino: '18h' }, proximaPergunta: null, completo: true }).success).toBe(false);
    const comDia7 = { horarioTreino: null, treinos: [{ nome: 'A', diasSemana: [7], exercicios: [] }] };
    expect(respostaOnboarding.safeParse({ rascunho: comDia7, proximaPergunta: null, completo: true }).success).toBe(false);
    const mensagens = Array.from({ length: 21 }, () => ({ papel: 'usuario', texto: 'oi' }));
    expect(pedidoOnboarding.safeParse({ mensagens, rascunho: null }).success).toBe(false);
  });
});
