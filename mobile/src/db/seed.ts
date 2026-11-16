// Seed de desenvolvimento: a divisão gravada quando o banco nasce vazio.
// Só dados, sem acesso ao banco; quem grava é `inicializarBanco()` (banco.ts).
//
// Divisão real do Lucas: Push / Pull / Legs / Upper / Lower, descanso na
// quinta e no domingo, 4 séries de 8 a 12 em tudo. As cargas são as do bloco
// de notas dele. Suposições feitas na tarefa 0.4, a confirmar na academia:
// - Cargas anotadas com dois números ("28/63"): ficou o primeiro.
// - Reps atuais = 8 (início da faixa). Como no onboarding (§3.1), essa carga
//   vira a "última sessão" e o motor calcula a primeira meta: carga × 9.
// - Carga anotada "por lado" (barra, máquina de anilha, cross de dois cabos)
//   entra como está no bloco de notas, com a marca `porLado`: "22,5 lado" é
//   22,5, e o app mostra "22,5 kg lado" (§5.2). É a mesma regra que a IA usa
//   no registro rápido (§8.3). Halter é o peso de um halter, sem a marca.

import type { Equipamento, GrupoMuscular } from '@/domain/tipos';

// O seed só entra em banco recém-criado. Olhar só os treinos não basta: quem
// exclui todos os treinos para refazer a divisão continua com os exercícios
// e o histórico, e o seed criaria outros com os mesmos nomes, zerados.
export function deveAplicarSeed(totalDeTreinos: number, totalDeExercicios: number): boolean {
  return totalDeTreinos === 0 && totalDeExercicios === 0;
}

export interface ExercicioSeed {
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  incrementoKg: number;
  porLado: boolean;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  // O que ele faz hoje: vira o registro de onboarding.
  cargaKg: number;
  repsAtuais: number;
}

export interface TreinoSeed {
  // 0 = domingo … 6 = sábado, igual a Date.getDay().
  diaSemana: number;
  nome: string;
  // Um exercício com o mesmo nome em dois treinos vira um exercício só no
  // banco, ligado aos dois (e com um único estado de progressão).
  exercicios: ExercicioSeed[];
}

// Incrementos propostos a partir das cargas do Lucas (decisão em aberto no
// PLANO.md). Mudar aqui muda todos os exercícios daquele tipo.
const INCREMENTO = {
  halter: 2, // halteres de 2 em 2 kg: 10, 14, 16, 18
  polia: 3.5, // a maioria das cargas de cross é múltipla de 3,5: 17,5 · 24,5 · 28
  anilha: 2.5, // barra e máquinas de anilha, por lado: uma anilha de 2,5 de cada lado
  pino: 5, // máquinas de pino: padrão da §5.2
};

const PADRAO = { repsMin: 8, repsMax: 12, seriesAlvo: 4, repsAtuais: 8, porLado: false };
// Exercícios anotados por lado: espalhado DEPOIS do PADRAO, troca só a marca.
const POR_LADO = { ...PADRAO, porLado: true };

// Legs e Lower usam os mesmos exercícios, então a progressão deles é uma só.
const PERNAS: ExercicioSeed[] = [
  { nome: 'Agachamento livre', grupoMuscular: 'quadriceps', equipamento: 'barra',
    incrementoKg: INCREMENTO.anilha, cargaKg: 20, ...POR_LADO },
  { nome: 'Panturrilha em pé', grupoMuscular: 'panturrilha', equipamento: 'maquina',
    incrementoKg: INCREMENTO.anilha, cargaKg: 25, ...POR_LADO },
  { nome: 'Panturrilha na máquina', grupoMuscular: 'panturrilha', equipamento: 'maquina',
    incrementoKg: INCREMENTO.pino, cargaKg: 115, ...PADRAO },
];

export const DIVISAO_SEED: readonly TreinoSeed[] = [
  {
    diaSemana: 1,
    nome: 'Push',
    exercicios: [
      { nome: 'Supino reto', grupoMuscular: 'peito', equipamento: 'barra',
        incrementoKg: INCREMENTO.anilha, cargaKg: 22.5, ...POR_LADO },
      { nome: 'Supino inclinado com halteres', grupoMuscular: 'peito', equipamento: 'halter',
        incrementoKg: INCREMENTO.halter, cargaKg: 18, ...PADRAO },
      { nome: 'Inclinado no cross', grupoMuscular: 'peito', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 20, ...POR_LADO },
      { nome: 'Desenvolvimento', grupoMuscular: 'ombros', equipamento: 'halter',
        incrementoKg: INCREMENTO.halter, cargaKg: 14, ...PADRAO },
      { nome: 'Tríceps no triângulo para baixo', grupoMuscular: 'triceps', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 24.5, ...PADRAO },
      { nome: 'Tríceps na corda pra cima', grupoMuscular: 'triceps', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 17.5, ...PADRAO },
    ],
  },
  {
    diaSemana: 2,
    nome: 'Pull',
    exercicios: [
      { nome: 'Puxada aberta', grupoMuscular: 'costas', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 28, ...PADRAO },
      { nome: 'Puxada fechada', grupoMuscular: 'costas', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 24.5, ...PADRAO },
      { nome: 'Puxada unilateral', grupoMuscular: 'costas', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 31, ...PADRAO },
      // "Puxada no stiff": interpretado como pulldown de braços estendidos.
      { nome: 'Puxada no stiff', grupoMuscular: 'costas', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 15, ...PADRAO },
      { nome: 'Rosca', grupoMuscular: 'biceps', equipamento: 'halter',
        incrementoKg: INCREMENTO.halter, cargaKg: 16, ...PADRAO },
      { nome: 'Rosca martelo na corda', grupoMuscular: 'biceps', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 24.5, ...PADRAO },
    ],
  },
  {
    diaSemana: 3,
    nome: 'Legs',
    exercicios: PERNAS,
  },
  {
    diaSemana: 5,
    nome: 'Upper',
    exercicios: [
      { nome: 'Supino reto na máquina', grupoMuscular: 'peito', equipamento: 'maquina',
        incrementoKg: INCREMENTO.anilha, cargaKg: 32.5, ...POR_LADO },
      { nome: 'Supino inclinado na máquina', grupoMuscular: 'peito', equipamento: 'maquina',
        incrementoKg: INCREMENTO.pino, cargaKg: 75, ...PADRAO },
      { nome: 'Pulldown na máquina', grupoMuscular: 'costas', equipamento: 'maquina',
        incrementoKg: INCREMENTO.pino, cargaKg: 54, ...PADRAO },
      { nome: 'Puxada na máquina', grupoMuscular: 'costas', equipamento: 'maquina',
        incrementoKg: INCREMENTO.pino, cargaKg: 47, ...PADRAO },
      { nome: 'Tríceps na barra para frente', grupoMuscular: 'triceps', equipamento: 'polia',
        incrementoKg: INCREMENTO.polia, cargaKg: 24.5, ...PADRAO },
      { nome: 'Rosca scott unilateral', grupoMuscular: 'biceps', equipamento: 'halter',
        incrementoKg: INCREMENTO.halter, cargaKg: 10, ...PADRAO },
    ],
  },
  {
    diaSemana: 6,
    nome: 'Lower',
    exercicios: PERNAS,
  },
];
