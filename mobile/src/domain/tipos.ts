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

// Perfil da pessoa, perguntado no onboarding (§3.1). O objetivo escolhe a
// faixa de reps padrão; o tempo de treino fica só registrado.
export const OBJETIVOS = ['forca', 'hipertrofia'] as const;
export type Objetivo = (typeof OBJETIVOS)[number];

export const NOMES_DOS_OBJETIVOS: Record<Objetivo, string> = {
  forca: 'Força',
  hipertrofia: 'Hipertrofia',
};

export const TEMPOS_DE_TREINO = ['menos_de_1_ano', 'de_1_a_3_anos', 'mais_de_3_anos'] as const;
export type TempoDeTreino = (typeof TEMPOS_DE_TREINO)[number];

export const NOMES_DOS_TEMPOS_DE_TREINO: Record<TempoDeTreino, string> = {
  menos_de_1_ano: 'Menos de 1 ano',
  de_1_a_3_anos: '1 a 3 anos',
  mais_de_3_anos: 'Mais de 3 anos',
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

// Como o registro é guardado no banco (coluna `registro.resultado`).
export type Resultado = 'bateu' | 'nao_bateu' | 'pulou';

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

export interface FaixaDeReps {
  repsMin: number;
  repsMax: number;
}

// §5.1: a faixa de reps com que um exercício novo nasce, conforme o objetivo.
// Tabela fixa: a IA registra o objetivo, mas quem escolhe a faixa é o app.
export const FAIXA_DE_REPS_POR_OBJETIVO: Record<Objetivo, FaixaDeReps> = {
  forca: { repsMin: 4, repsMax: 6 },
  hipertrofia: { repsMin: REPS_MIN_PADRAO, repsMax: REPS_MAX_PADRAO },
};

// Sem objetivo informado, vale a faixa padrão (8–12).
export function faixaDeReps(objetivo: Objetivo | null): FaixaDeReps {
  return objetivo === null ? { repsMin: REPS_MIN_PADRAO, repsMax: REPS_MAX_PADRAO } : FAIXA_DE_REPS_POR_OBJETIVO[objetivo];
}

// Configuração inicial de um exercício novo: o incremento vem do equipamento
// (§5.2) e a faixa de reps, do objetivo da pessoa (§5.1).
export function configPadrao(equipamento: Equipamento, objetivo: Objetivo | null): ConfigExercicio {
  const faixa = faixaDeReps(objetivo);
  return {
    repsMin: faixa.repsMin,
    repsMax: faixa.repsMax,
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

export function ehObjetivo(valor: string): valor is Objetivo {
  return (OBJETIVOS as readonly string[]).includes(valor);
}
