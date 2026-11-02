// Pontuação dos evals (§8.5). Funções puras, testadas em avaliacao.test.ts;
// quem chama a API de verdade é rodar.ts.

import { z } from 'zod';

import type { ItemInterpretado } from '../src/contrato';

export const META = 0.9; // ≥ 90% em cada métrica (§8.5)

const itemEsperado = z.object({
  exercicioId: z.string().nullable(), // null = exercício que não está na lista
  cargaKg: z.number(),
  reps: z.array(z.number().int()),
});

export const arquivoDeFrases = z.object({
  exercicios: z.array(z.object({ id: z.string(), nome: z.string() })),
  frases: z.array(
    z.object({
      texto: z.string(),
      esperado: z.array(itemEsperado), // na ordem em que aparecem no texto
    }),
  ),
});

export type ItemEsperado = z.infer<typeof itemEsperado>;

export interface Acertos {
  itens: number; // itens esperados
  carga: number;
  reps: number;
  associacao: number;
}

const iguais = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((n, i) => n === b[i]);

// Compara item a item, na ordem. Item esperado que não veio conta como erro
// nas três métricas; item a mais não soma nem tira (ele aparece no relatório).
export function avaliarFrase(esperados: readonly ItemEsperado[], obtidos: readonly ItemInterpretado[]): Acertos {
  const acertos: Acertos = { itens: esperados.length, carga: 0, reps: 0, associacao: 0 };
  esperados.forEach((esperado, indice) => {
    const obtido = obtidos[indice];
    if (obtido === undefined) {
      return;
    }
    acertos.carga += Number(obtido.cargaKg === esperado.cargaKg);
    acertos.reps += Number(iguais(obtido.reps, esperado.reps));
    acertos.associacao += Number(obtido.exercicioId === esperado.exercicioId);
  });
  return acertos;
}

export interface Placar {
  carga: number; // fração de 0 a 1
  reps: number;
  associacao: number;
  passou: boolean;
}

export function somarPlacar(resultados: readonly Acertos[]): Placar {
  const total = resultados.reduce(
    (soma, r) => ({
      itens: soma.itens + r.itens,
      carga: soma.carga + r.carga,
      reps: soma.reps + r.reps,
      associacao: soma.associacao + r.associacao,
    }),
    { itens: 0, carga: 0, reps: 0, associacao: 0 },
  );
  const fracao = (n: number) => (total.itens === 0 ? 0 : n / total.itens);
  const placar = { carga: fracao(total.carga), reps: fracao(total.reps), associacao: fracao(total.associacao) };
  return { ...placar, passou: placar.carga >= META && placar.reps >= META && placar.associacao >= META };
}
