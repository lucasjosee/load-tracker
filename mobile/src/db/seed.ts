// Seed de desenvolvimento: a divisão real do Lucas, gravada pelo
// `inicializarBanco()` (banco.ts). Aqui ficam só os dados, sem acesso ao banco.
//
// Divisão de 22/11/2026, em 6 dias: Push (segunda), Pull (terça), Legs
// (quarta e sexta), Upper (quinta e sábado), descanso no domingo. Panturrilha
// e abdômen entram nos dias de Push e de Legs.
//
// Escolhas feitas ao passar a divisão para cá (dá para mudar tudo na aba
// Divisão):
// - Nenhum exercício tem carga inicial: no primeiro treino ele aparece "sem
//   meta ainda", a pessoa registra pelo Ajustar o que fez e o motor calcula a
//   meta a partir daí.
// - Séries com faixa ("2-3×", "3-4×") ficam no número maior.
// - Quando a divisão dá duas opções ("remada baixa ou curvada"), o exercício
//   leva o nome da primeira e a outra vai na nota.
// - Prancha e prancha lateral ficaram de fora: são por tempo, e o app conta
//   repetições.

import type { Equipamento, GrupoMuscular } from '@/domain/tipos';

export interface ExercicioSeed {
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  incrementoKg: number;
  porLado: boolean;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  nota: string | null; // lembrete mostrado na tela do treino
}

export interface TreinoSeed {
  nome: string;
  // 0 = domingo … 6 = sábado, igual a Date.getDay(). Um treino pode cair em
  // mais de um dia (Legs na quarta e na sexta).
  dias: number[];
  // Um exercício com o mesmo nome em dois treinos vira um exercício só no
  // banco, ligado aos dois (e com um único estado de progressão).
  exercicios: ExercicioSeed[];
}

// Incrementos provisórios (decisão em aberto no PLANO.md). Mudar aqui muda
// todos os exercícios daquele tipo.
const INCREMENTO = {
  halter: 2, // halteres de 2 em 2 kg
  polia: 3.5, // a maioria das cargas de polia anotadas é múltipla de 3,5
  anilha: 2.5, // barra e máquinas de anilha, por lado: uma anilha de 2,5 de cada lado
  pino: 5, // máquinas de pino: padrão da §5.2
};

// Os modelos de cada equipamento. Cada exercício espalha um deles e completa
// com nome, grupo, faixa de reps e séries.
const HALTER = { equipamento: 'halter', incrementoKg: INCREMENTO.halter, porLado: false } as const;
const POLIA = { equipamento: 'polia', incrementoKg: INCREMENTO.polia, porLado: false } as const;
const BARRA = { equipamento: 'barra', incrementoKg: INCREMENTO.anilha, porLado: true } as const;
const MAQUINA_DE_ANILHA = { equipamento: 'maquina', incrementoKg: INCREMENTO.anilha, porLado: true } as const;
const MAQUINA_DE_PINO = { equipamento: 'maquina', incrementoKg: INCREMENTO.pino, porLado: false } as const;
// Sem carga não há incremento: a progressão é passar do topo da faixa (§5.3).
const PESO_CORPORAL = { equipamento: 'peso_corporal', incrementoKg: 0, porLado: false } as const;

// Constantes porque se repetem em dois treinos: o mesmo objeto garante a
// mesma configuração nos dois (o teste confere).
const ELEVACAO_LATERAL: ExercicioSeed = {
  nome: 'Elevação lateral', grupoMuscular: 'ombros', ...HALTER, repsMin: 12, repsMax: 15, seriesAlvo: 3, nota: null,
};
const PANTURRILHA: ExercicioSeed = {
  nome: 'Panturrilha', grupoMuscular: 'panturrilha', ...MAQUINA_DE_PINO, repsMin: 12, repsMax: 15, seriesAlvo: 3, nota: null,
};
const ABDOMEN: ExercicioSeed[] = [
  { nome: 'Máquina de abdômen da Hammer', grupoMuscular: 'abdomen', ...MAQUINA_DE_PINO,
    repsMin: 12, repsMax: 15, seriesAlvo: 4, nota: null },
  { nome: 'Elevação de pernas', grupoMuscular: 'abdomen', ...PESO_CORPORAL,
    repsMin: 10, repsMax: 15, seriesAlvo: 3, nota: 'opcional' },
  { nome: 'Russian twist', grupoMuscular: 'abdomen', ...PESO_CORPORAL,
    repsMin: 20, repsMax: 20, seriesAlvo: 3, nota: null },
];

export const DIVISAO_SEED: readonly TreinoSeed[] = [
  {
    nome: 'Push',
    dias: [1],
    exercicios: [
      { nome: 'Supino inclinado (30°)', grupoMuscular: 'peito', ...BARRA, repsMin: 6, repsMax: 10, seriesAlvo: 4, nota: null },
      { nome: 'Supino reto', grupoMuscular: 'peito', ...BARRA, repsMin: 8, repsMax: 10, seriesAlvo: 3, nota: null },
      // Cross de dois cabos: anotado por lado, como o cross da divisão antiga.
      { nome: 'Crossover para cima', grupoMuscular: 'peito', ...POLIA, porLado: true,
        repsMin: 12, repsMax: 15, seriesAlvo: 3, nota: 'polia baixa' },
      { nome: 'Desenvolvimento', grupoMuscular: 'ombros', ...HALTER, repsMin: 8, repsMax: 10, seriesAlvo: 3,
        nota: 'em pé ou na máquina reclinada, se o quadril incomodar' },
      ELEVACAO_LATERAL,
      { nome: 'Tríceps francês', grupoMuscular: 'triceps', ...HALTER, repsMin: 10, repsMax: 12, seriesAlvo: 3, nota: null },
      { nome: 'Tríceps na barra V', grupoMuscular: 'triceps', ...POLIA, repsMin: 10, repsMax: 12, seriesAlvo: 3, nota: null },
      PANTURRILHA,
      ...ABDOMEN,
    ],
  },
  {
    nome: 'Pull',
    dias: [2],
    exercicios: [
      { nome: 'Puxada alta aberta', grupoMuscular: 'costas', ...POLIA, repsMin: 8, repsMax: 12, seriesAlvo: 4, nota: null },
      { nome: 'Remada fechada no cavalinho', grupoMuscular: 'costas', ...MAQUINA_DE_ANILHA,
        repsMin: 8, repsMax: 10, seriesAlvo: 3, nota: 'triângulo' },
      { nome: 'Remada sentada aberta', grupoMuscular: 'costas', ...POLIA, repsMin: 10, repsMax: 12, seriesAlvo: 3, nota: null },
      { nome: 'Pulldown braço estendido', grupoMuscular: 'costas', ...POLIA, repsMin: 12, repsMax: 15, seriesAlvo: 3, nota: null },
      { nome: 'Rosca com halteres', grupoMuscular: 'biceps', ...HALTER, repsMin: 10, repsMax: 12, seriesAlvo: 3, nota: null },
    ],
  },
  {
    nome: 'Legs',
    dias: [3, 5],
    exercicios: [
      { nome: 'Agachamento', grupoMuscular: 'quadriceps', ...BARRA, repsMin: 8, repsMax: 10, seriesAlvo: 3,
        nota: 'parar 2 reps antes da falha' },
      { nome: 'Leg press', grupoMuscular: 'quadriceps', ...MAQUINA_DE_ANILHA, repsMin: 10, repsMax: 12, seriesAlvo: 3, nota: null },
      { nome: 'Flexora', grupoMuscular: 'posterior', ...MAQUINA_DE_PINO, repsMin: 10, repsMax: 12, seriesAlvo: 3,
        nota: 'mesa ou cadeira' },
      { nome: 'Extensora', grupoMuscular: 'quadriceps', ...MAQUINA_DE_PINO, repsMin: 12, repsMax: 15, seriesAlvo: 3, nota: null },
      PANTURRILHA,
      ...ABDOMEN,
    ],
  },
  {
    nome: 'Upper',
    dias: [4, 6],
    exercicios: [
      { nome: 'Supino inclinado com halteres (30°)', grupoMuscular: 'peito', ...HALTER,
        repsMin: 8, repsMax: 12, seriesAlvo: 3, nota: null },
      { nome: 'Puxada frontal', grupoMuscular: 'costas', ...POLIA, repsMin: 8, repsMax: 12, seriesAlvo: 3, nota: null },
      { nome: 'Remada baixa', grupoMuscular: 'costas', ...POLIA, repsMin: 8, repsMax: 10, seriesAlvo: 3, nota: 'ou curvada' },
      { nome: 'Crucifixo inclinado', grupoMuscular: 'peito', ...HALTER, repsMin: 12, repsMax: 15, seriesAlvo: 2, nota: 'ou voador' },
      ELEVACAO_LATERAL,
      { nome: 'Face pull', grupoMuscular: 'ombros', ...POLIA, repsMin: 12, repsMax: 15, seriesAlvo: 2, nota: null },
      // Barra de peso fixo (as de 10, 12, 14 kg): sobe de 2 em 2 e não é por lado.
      { nome: 'Rosca direta', grupoMuscular: 'biceps', equipamento: 'barra', incrementoKg: 2, porLado: false,
        repsMin: 10, repsMax: 12, seriesAlvo: 3, nota: null },
      { nome: 'Tríceps testa na corda', grupoMuscular: 'triceps', ...POLIA, repsMin: 10, repsMax: 12, seriesAlvo: 3, nota: null },
    ],
  },
];
