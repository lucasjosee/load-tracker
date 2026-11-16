import { describe, expect, it } from 'vitest';

import type { ItemInterpretado } from '../src/contrato';

import { arquivoDeConversas, arquivoDeFrases, avaliarConversa, avaliarFrase, somarPlacar } from './avaliacao';
import frases from './frases.json';
import conversas from './onboarding.json';

function obtido(exercicioId: string | null, cargaKg: number, reps: number[]): ItemInterpretado {
  return { exercicioId, nome: 'X', grupoMuscular: 'peito', equipamento: 'barra', cargaKg, porLado: false, reps, confianca: 'alta' };
}

describe('avaliarFrase', () => {
  it('conta acerto de carga, reps e associação separadamente', () => {
    const esperados = [{ exercicioId: 'supino', cargaKg: 22.5, porLado: false, reps: [9, 9, 8] }];
    expect(avaliarFrase(esperados, [obtido('supino', 22.5, [9, 9, 8])])).toEqual({ itens: 1, carga: 1, reps: 1, associacao: 1 });
    expect(avaliarFrase(esperados, [obtido(null, 22, [9, 9, 8])])).toEqual({ itens: 1, carga: 0, reps: 1, associacao: 0 });
  });

  it('a marca "por lado" faz parte da carga: número certo sem a marca é erro de carga', () => {
    const esperados = [{ exercicioId: 'agachamento', cargaKg: 20, porLado: true, reps: [8, 8] }];
    const comMarca = { ...obtido('agachamento', 20, [8, 8]), porLado: true };
    expect(avaliarFrase(esperados, [comMarca])).toEqual({ itens: 1, carga: 1, reps: 1, associacao: 1 });
    expect(avaliarFrase(esperados, [obtido('agachamento', 20, [8, 8])])).toEqual({ itens: 1, carga: 0, reps: 1, associacao: 1 });
  });

  it('item esperado que não veio é erro nas três métricas', () => {
    const esperados = [
      { exercicioId: 'a', cargaKg: 10, porLado: false, reps: [8] },
      { exercicioId: null, cargaKg: 14, porLado: false, reps: [12, 12, 12] },
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
  const SEM_PERFIL = { nome: null, objetivo: null, tempoDeTreino: null };
  const esperado = {
    ...SEM_PERFIL,
    horarioTreino: '18:00',
    treinos: [
      { diasSemana: [1, 4], exerciciosComCarga: 2 },
      { diasSemana: [2], exerciciosComCarga: 1 },
    ],
  };
  const exercicio = (cargaKg: number | null, porLado = false) => ({ cargaKg, porLado });

  it('aprova com os mesmos dias (em qualquer ordem), cargas e horário', () => {
    const obtido = {
      ...SEM_PERFIL,
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
      ...SEM_PERFIL,
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

  it('com `cargas`, confere a carga de cada exercício na ordem', () => {
    const comCargas = { ...SEM_PERFIL, horarioTreino: null, treinos: [{ diasSemana: [1], exerciciosComCarga: 2, cargas: [45, 18] }] };
    const obtido = (primeira: number) => ({
      ...SEM_PERFIL,
      horarioTreino: null,
      treinos: [{ nome: 'Peito', diasSemana: [1], exercicios: [exercicio(primeira), exercicio(18)] }],
    });
    expect(avaliarConversa(comCargas, obtido(45))).toEqual([]);
    expect(avaliarConversa(comCargas, obtido(22.5))).toEqual(['Peito: cargas [22.5,18], esperado [45,18]']);
  });

  it('com `porLado`, confere a marca de cada exercício na ordem', () => {
    const comMarcas = {
      ...SEM_PERFIL,
      horarioTreino: null,
      treinos: [{ diasSemana: [3], exerciciosComCarga: 2, cargas: [20, 55], porLado: [true, false] }],
    };
    const obtido = (marca: boolean) => ({
      ...SEM_PERFIL,
      horarioTreino: null,
      treinos: [{ nome: 'Perna', diasSemana: [3], exercicios: [exercicio(20, marca), exercicio(55)] }],
    });
    expect(avaliarConversa(comMarcas, obtido(true))).toEqual([]);
    expect(avaliarConversa(comMarcas, obtido(false))).toEqual(['Perna: por lado [false,false], esperado [true,false]']);
  });

  it('confere o perfil, campo a campo', () => {
    const comPerfil = { nome: 'Bia', objetivo: 'forca', tempoDeTreino: null, horarioTreino: null, treinos: [] };
    expect(avaliarConversa(comPerfil, { ...comPerfil })).toEqual([]);
    expect(avaliarConversa(comPerfil, { ...comPerfil, nome: null, tempoDeTreino: 'mais_de_3_anos' })).toEqual([
      'nome: esperado Bia, veio null',
      'tempoDeTreino: esperado null, veio mais_de_3_anos',
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
