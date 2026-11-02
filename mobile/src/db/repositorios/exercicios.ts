import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

// Convenções: ver o comentário no topo de treinos.ts.

export interface Exercicio {
  id: string;
  nome: string;
  // `string` até a tarefa 1.1, que cria os tipos GrupoMuscular e Equipamento.
  grupoMuscular: string;
  equipamento: string;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  incrementoKg: number;
  ativo: boolean;
  criadoEm: string;
}

export type NovoExercicio = Omit<Exercicio, 'id' | 'ativo' | 'criadoEm'>;

interface LinhaExercicio {
  id: string;
  nome: string;
  grupo_muscular: string;
  equipamento: string;
  reps_min: number;
  reps_max: number;
  series_alvo: number;
  incremento_kg: number;
  ativo: number; // SQLite não tem booleano: 0 ou 1
  criado_em: string;
}

const COLUNAS = `e.id, e.nome, e.grupo_muscular, e.equipamento, e.reps_min, e.reps_max,
  e.series_alvo, e.incremento_kg, e.ativo, e.criado_em`;

function paraExercicio(linha: LinhaExercicio): Exercicio {
  return {
    id: linha.id,
    nome: linha.nome,
    grupoMuscular: linha.grupo_muscular,
    equipamento: linha.equipamento,
    repsMin: linha.reps_min,
    repsMax: linha.reps_max,
    seriesAlvo: linha.series_alvo,
    incrementoKg: linha.incremento_kg,
    ativo: linha.ativo === 1,
    criadoEm: linha.criado_em,
  };
}

export async function inserirExercicio(db: SQLiteDatabase, novo: NovoExercicio): Promise<Exercicio> {
  const exercicio: Exercicio = {
    ...novo,
    id: randomUUID(),
    ativo: true,
    criadoEm: new Date().toISOString(),
  };
  await db.runAsync(
    `INSERT INTO exercicio (id, nome, grupo_muscular, equipamento, reps_min, reps_max,
                            series_alvo, incremento_kg, ativo, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    exercicio.id,
    exercicio.nome,
    exercicio.grupoMuscular,
    exercicio.equipamento,
    exercicio.repsMin,
    exercicio.repsMax,
    exercicio.seriesAlvo,
    exercicio.incrementoKg,
    exercicio.criadoEm,
  );
  return exercicio;
}

export async function obterExercicio(db: SQLiteDatabase, id: string): Promise<Exercicio | null> {
  const linha = await db.getFirstAsync<LinhaExercicio>(
    `SELECT ${COLUNAS} FROM exercicio e WHERE e.id = ?`,
    id,
  );
  return linha === null ? null : paraExercicio(linha);
}

// `ordem` é a posição do exercício no treino, a partir de 1.
export async function vincularExercicioAoTreino(
  db: SQLiteDatabase,
  treinoId: string,
  exercicioId: string,
  ordem: number,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO treino_exercicio (treino_id, exercicio_id, ordem) VALUES (?, ?, ?)',
    treinoId,
    exercicioId,
    ordem,
  );
}

// Devolve também os inativos; quem chama decide se mostra (o campo `ativo` vem junto).
export async function listarExerciciosDoTreino(
  db: SQLiteDatabase,
  treinoId: string,
): Promise<Exercicio[]> {
  const linhas = await db.getAllAsync<LinhaExercicio>(
    `SELECT ${COLUNAS}
       FROM treino_exercicio te
       JOIN exercicio e ON e.id = te.exercicio_id
      WHERE te.treino_id = ?
      ORDER BY te.ordem`,
    treinoId,
  );
  return linhas.map(paraExercicio);
}
