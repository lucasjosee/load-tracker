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

// ---------- Onboarding (tarefa 4.6): conversas completas ----------

const treinoEsperado = z.object({
  diasSemana: z.array(z.number().int()),
  exerciciosComCarga: z.number().int(), // quantos exercícios, no mínimo, com carga
});

export const arquivoDeConversas = z.object({
  conversas: z.array(
    z.object({
      nome: z.string(),
      respostas: z.array(z.string()).min(1), // o que a pessoa responde, em ordem
      esperado: z.object({ horarioTreino: z.string().nullable(), treinos: z.array(treinoEsperado) }),
    }),
  ),
});

export type RascunhoEsperado = z.infer<typeof arquivoDeConversas>['conversas'][number]['esperado'];

interface RascunhoObtido {
  horarioTreino: string | null;
  treinos: { nome: string; diasSemana: number[]; exercicios: { cargaKg: number | null }[] }[];
}

const mesmosDias = (a: readonly number[], b: readonly number[]) =>
  iguais([...a].sort((x, y) => x - y), [...b].sort((x, y) => x - y));

// Lista o que ficou diferente do esperado; lista vazia = conversa aprovada.
// O nome do treino não é conferido: "Peito e tríceps" e "Peito/tríceps" valem.
export function avaliarConversa(esperado: RascunhoEsperado, obtido: RascunhoObtido | null): string[] {
  if (obtido === null) {
    return ['a conversa não terminou com um rascunho'];
  }
  const problemas: string[] = [];
  if (obtido.horarioTreino !== esperado.horarioTreino) {
    problemas.push(`horário: esperado ${esperado.horarioTreino}, veio ${obtido.horarioTreino}`);
  }
  if (obtido.treinos.length !== esperado.treinos.length) {
    problemas.push(`treinos: esperado ${esperado.treinos.length}, vieram ${obtido.treinos.length}`);
  }
  for (const treino of esperado.treinos) {
    const achado = obtido.treinos.find((t) => mesmosDias(t.diasSemana, treino.diasSemana));
    if (achado === undefined) {
      problemas.push(`nenhum treino nos dias [${treino.diasSemana}]`);
      continue;
    }
    const comCarga = achado.exercicios.filter((e) => e.cargaKg !== null).length;
    if (comCarga < treino.exerciciosComCarga) {
      problemas.push(`${achado.nome}: ${comCarga} exercícios com carga, esperado ${treino.exerciciosComCarga}`);
    }
  }
  return problemas;
}
