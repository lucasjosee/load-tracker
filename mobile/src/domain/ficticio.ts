// Histórico de mentira para testar as telas de evolução sem esperar semanas
// de treino (botão da aba Divisão, só em desenvolvimento).
//
// Aqui só se inventa o que a pessoa "fez" em cada dia. A meta seguinte
// continua saindo do motor (regra 2), então o histórico gerado é igual ao que
// o uso real produziria.

import type { EstadoProgressao, Realizado } from './tipos';

export const CHANCE_DE_FALTAR = 0.1; // dias de treino em que a pessoa não foi
const CHANCE_DE_PULAR = 0.05; // exercícios pulados num dia em que ela foi
const CHANCE_DE_NAO_BATER = 0.3; // somada à de pular: 25% dos exercícios

// Gerador de números "aleatórios" que repete a mesma sequência para a mesma
// semente (algoritmo mulberry32). Com `Math.random()` o histórico mudaria a
// cada toque no botão e os testes não teriam o que conferir.
// Devolve uma função que dá um número em [0, 1) a cada chamada.
export function sorteador(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// O que a pessoa fez num exercício, dada a meta do dia e um sorteio em [0, 1):
// pulou, ficou devendo reps nas últimas séries, ou bateu a meta em todas.
export function realizadoFicticio(
  meta: Pick<EstadoProgressao, 'cargaKg' | 'repsAlvo'>,
  seriesAlvo: number,
  sorteio: number,
): Realizado {
  if (sorteio < CHANCE_DE_PULAR) {
    return 'PULOU';
  }
  const reps = Array.from({ length: seriesAlvo }, () => meta.repsAlvo);
  if (sorteio < CHANCE_DE_NAO_BATER) {
    // O cansaço aparece no fim: a última série perde 2 reps e a penúltima, 1.
    const ultima = reps.length - 1;
    reps[ultima] = Math.max(1, meta.repsAlvo - 2);
    if (ultima > 0) {
      reps[ultima - 1] = Math.max(1, meta.repsAlvo - 1);
    }
  }
  return { cargaKg: meta.cargaKg, reps };
}
