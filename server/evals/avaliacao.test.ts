import { describe, expect, it } from 'vitest';

import type { ItemInterpretado } from '../src/contrato';

import { arquivoDeFrases, avaliarFrase, somarPlacar } from './avaliacao';
import frases from './frases.json';

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
