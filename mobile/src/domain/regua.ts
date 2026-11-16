// Régua da faixa de reps do cartão (tarefa 7.3): a dupla progressão desenhada.
// Um ponto por número de reps da faixa, mostrando onde a pessoa está no
// caminho até subir a carga, e qual carga vem depois do topo.
//
// Só desenha o que o motor já decidiu (§5.3); não decide nada.

import { arredondarKg } from './progressao';
import type { ConfigExercicio, EstadoProgressao } from './tipos';

// 'feito' = reps que já ficaram para trás nesta carga; 'alvo' = a meta de
// hoje; 'falta' = o que ainda vem antes de subir a carga.
export type SituacaoDoPonto = 'feito' | 'alvo' | 'falta';

export interface PontoDaRegua {
  reps: number;
  situacao: SituacaoDoPonto;
}

export interface Regua {
  pontos: PontoDaRegua[];
  proximaCargaKg: number; // a carga depois de bater o topo da faixa
}

// Uma faixa como 1–50 viraria 50 bolinhas: acima disto o cartão fica sem régua.
export const MAXIMO_DE_PONTOS = 8;

export function reguaDeReps(
  estado: Pick<EstadoProgressao, 'cargaKg' | 'repsAlvo'>,
  config: Pick<ConfigExercicio, 'repsMin' | 'repsMax' | 'incrementoKg'>,
): Regua | null {
  // Peso corporal não tem topo: a progressão ali é passar do repsMax (§5.3, 5a).
  if (config.incrementoKg === 0) {
    return null;
  }
  const tamanho = config.repsMax - config.repsMin + 1;
  if (tamanho < 1 || tamanho > MAXIMO_DE_PONTOS) {
    return null;
  }
  // Meta fora da faixa só existe por um instante, entre editar a faixa e o
  // motor trazer a meta para dentro dela; não vale desenhar uma régua errada.
  if (estado.repsAlvo < config.repsMin || estado.repsAlvo > config.repsMax) {
    return null;
  }
  const pontos: PontoDaRegua[] = [];
  for (let reps = config.repsMin; reps <= config.repsMax; reps++) {
    pontos.push({ reps, situacao: reps < estado.repsAlvo ? 'feito' : reps === estado.repsAlvo ? 'alvo' : 'falta' });
  }
  return { pontos, proximaCargaKg: arredondarKg(estado.cargaKg + config.incrementoKg) };
}

// "3 de 6 exercícios": quantos cartões já têm check-in (ou "Pulei") hoje.
export function progressoDoTreino(feitos: readonly boolean[]): { feitos: number; total: number } {
  return { feitos: feitos.filter(Boolean).length, total: feitos.length };
}
