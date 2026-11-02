import { describe, expect, it } from 'vitest';

import type { ItemInterpretado } from '../src/contrato';

import { arquivoDeConversas, arquivoDeFrases, avaliarConversa, avaliarFrase, somarPlacar } from './avaliacao';
import frases from './frases.json';
import conversas from './onboarding.json';

function obtido(exercicioId: string | null, cargaKg: number, reps: number[]): ItemInterpretado {
  return { exercicioId, nome: 'X', grupoMuscular: 'peito', equipamento: 'barra', cargaKg, reps, confianca: 'alta' };
}

describe('avaliarFrase', () => {
  it('conta acerto de carga, reps e associação separadamente', () => {
    const esperados = [{ exercicioId: 'supino', cargaKg: 22.5, reps: [9, 9, 8] }];
    expect(avaliarFrase(esperados, [obtido('supino', 22.5, [9, 9, 8])])).toEqual({ itens: 1, carga: 1, reps: 1, associacao: 1 });
    expect(avaliarFrase(esperados, [obtido(null, 22, [9, 9, 8])])).toEqual({ itens: 1, carga: 0, reps: 1, associacao: 0 });
  });

  it('item esperado que não veio é erro nas três métricas', () => {
    const esperados = [
      { exercicioId: 'a', cargaKg: 10, reps: [8] },
      { exercicioId: null, cargaKg: 14, reps: [12, 12, 12] },
    ];
    expect(avaliarFrase(esperados, [obtido('a', 10, [8])])).toEqual({ itens: 2, carga: 1, reps: 1, associacao: 1 });
  });
});

describe('somarPlacar', () => {
  it('passa só com ≥ 90% em cada métrica', () => {
    const nove = Array.from({ length: 9 }, () => ({ itens: 1, carga: 1, reps: 1, associacao: 1 }));
    expect(somarPlacar([...nove, { itens: 1, carga: 1, reps: 1, associacao: 0 }])).toMatchObject({ associacao: 0.9, passou: true });
    expect(somarPlacar([...nove, { itens: 2, carga: 2, reps: 2, associacao: 0 }])).toMatchObject({ passou: false });
  });
});

describe('evals/frases.json', () => {
  it('segue o formato esperado pelo rodar.ts', () => {
    expect(arquivoDeFrases.safeParse(frases).success).toBe(true);
  });

  it('todo id esperado existe na lista de exercícios', () => {
    const ids = new Set(frases.exercicios.map((e) => e.id));
    for (const frase of frases.frases) {
      for (const item of frase.esperado) {
        if (item.exercicioId !== null) {
          expect(ids.has(item.exercicioId)).toBe(true);
        }
      }
    }
  });
});

describe('avaliarConversa', () => {
  const esperado = {
    horarioTreino: '18:00',
    treinos: [
      { diasSemana: [1, 4], exerciciosComCarga: 2 },
      { diasSemana: [2], exerciciosComCarga: 1 },
    ],
  };
  const exercicio = (cargaKg: number | null) => ({ cargaKg });

  it('aprova com os mesmos dias (em qualquer ordem), cargas e horário', () => {
    const obtido = {
      horarioTreino: '18:00',
      treinos: [
        { nome: 'Peito', diasSemana: [4, 1], exercicios: [exercicio(20), exercicio(14), exercicio(null)] },
        { nome: 'Costas', diasSemana: [2], exercicios: [exercicio(30)] },
      ],
    };
    expect(avaliarConversa(esperado, obtido)).toEqual([]);
  });

  it('aponta horário, treino faltando e carga faltando', () => {
    const obtido = {
      horarioTreino: null,
      treinos: [{ nome: 'Peito', diasSemana: [1, 4], exercicios: [exercicio(20), exercicio(null)] }],
    };
    expect(avaliarConversa(esperado, obtido)).toEqual([
      'horário: esperado 18:00, veio null',
      'treinos: esperado 2, vieram 1',
      'Peito: 1 exercícios com carga, esperado 2',
      'nenhum treino nos dias [2]',
    ]);
  });

  it('sem rascunho, reprova', () => {
    expect(avaliarConversa(esperado, null)).toEqual(['a conversa não terminou com um rascunho']);
  });
});

describe('evals/onboarding.json', () => {
  it('segue o formato esperado pelo rodarOnboarding.ts', () => {
    expect(arquivoDeConversas.safeParse(conversas).success).toBe(true);
  });
});
