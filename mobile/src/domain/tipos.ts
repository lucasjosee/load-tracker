// Tipos do domínio (§5 e §7). TypeScript puro: o motor, as métricas e os
// textos dependem só daqui, nunca do banco ou das telas.

// As listas vêm primeiro e os tipos saem delas (`as const` + `[number]`).
// Assim existe uma fonte só: a mesma lista serve para o compilador recusar
// um valor errado e para a tela montar as opções de escolha.
export const GRUPOS_MUSCULARES = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'antebraco',
  'trapezio',
  'abdomen',
  'quadriceps',
  'posterior',
  'gluteos',
  'panturrilha',
] as const;
export type GrupoMuscular = (typeof GRUPOS_MUSCULARES)[number];

export const EQUIPAMENTOS = ['halter', 'barra', 'maquina', 'polia', 'peso_corporal', 'outro'] as const;
export type Equipamento = (typeof EQUIPAMENTOS)[number];

// `Record<GrupoMuscular, string>` obriga a ter um nome para cada grupo: se um
// grupo novo entrar na lista e faltar aqui, o código não compila.
export const NOMES_DOS_GRUPOS: Record<GrupoMuscular, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebraco: 'Antebraço',
  trapezio: 'Trapézio',
  abdomen: 'Abdômen',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior',
  gluteos: 'Glúteos',
  panturrilha: 'Panturrilha',
};

export const NOMES_DOS_EQUIPAMENTOS: Record<Equipamento, string> = {
  halter: 'Halter',
  barra: 'Barra',
  maquina: 'Máquina',
  polia: 'Polia',
  peso_corporal: 'Peso corporal',
  outro: 'Outro',
};

// Regras de progressão de um exercício (§5.1). `limiteFalhas` não tem coluna
// no banco: no MVP é sempre o padrão.
export interface ConfigExercicio {
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  incrementoKg: number;
  limiteFalhas: number;
}

// A meta atual do exercício: o que o app manda fazer na próxima sessão.
export interface EstadoProgressao {
  cargaKg: number;
  repsAlvo: number;
  falhas: number; // sessões seguidas sem bater a meta
}

// O que a pessoa fez numa sessão. `reps` tem uma posição por série:
// [10, 9, 8] = 3 séries. 'PULOU' é o botão "Pulei".
export type Realizado = { cargaKg: number; reps: number[] } | 'PULOU';

// Por que a meta mudou (§5.3).
export type Evento = 'aumento_reps' | 'aumento_carga' | 'manteve' | 'deload' | 'sem_mudanca';

// Uma mudança de meta, como fica gravada na tabela `evento`: a meta de antes
// e a de depois. `De` é null no primeiro registro do exercício, quando ainda
// não havia meta.
export interface MudancaDeMeta {
  tipo: Evento;
  cargaDe: number | null;
  cargaPara: number;
  repsDe: number | null;
  repsPara: number;
}

// §5.2: quanto a carga sobe de uma vez, por equipamento. Cada exercício pode
// ter o seu; estes são só o valor inicial do formulário.
export const INCREMENTO_PADRAO_KG: Record<Equipamento, number> = {
  halter: 2,
  barra: 2,
  maquina: 5,
  polia: 5,
  peso_corporal: 0,
  outro: 2,
};

export const REPS_MIN_PADRAO = 8;
export const REPS_MAX_PADRAO = 12;
export const SERIES_ALVO_PADRAO = 3;
export const LIMITE_FALHAS_PADRAO = 3;

// Configuração inicial de um exercício novo daquele equipamento (§5.1, §5.2).
export function configPadrao(equipamento: Equipamento): ConfigExercicio {
  return {
    repsMin: REPS_MIN_PADRAO,
    repsMax: REPS_MAX_PADRAO,
    seriesAlvo: SERIES_ALVO_PADRAO,
    incrementoKg: INCREMENTO_PADRAO_KG[equipamento],
    limiteFalhas: LIMITE_FALHAS_PADRAO,
  };
}

// Para validar valores que chegam de fora (banco, IA, backup) antes de
// tratá-los como GrupoMuscular. É um "type guard": depois de um `if` com ele,
// o compilador já sabe o tipo exato.
export function ehGrupoMuscular(valor: string): valor is GrupoMuscular {
  return (GRUPOS_MUSCULARES as readonly string[]).includes(valor);
}

export function ehEquipamento(valor: string): valor is Equipamento {
  return (EQUIPAMENTOS as readonly string[]).includes(valor);
}
