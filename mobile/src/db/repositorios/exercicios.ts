import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Equipamento, GrupoMuscular } from '@/domain/tipos';

// Convenções: ver o comentário no topo de treinos.ts.

export interface Exercicio {
  id: string;
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  incrementoKg: number;
  ativo: boolean;
  criadoEm: string;
}

export type NovoExercicio = Omit<Exercicio, 'id' | 'ativo' | 'criadoEm'>;

// `grupo_muscular` e `equipamento` já saem tipados do banco porque o CHECK do
// schema só aceita os valores da §7.
interface LinhaExercicio {
  id: string;
  nome: string;
  grupo_muscular: GrupoMuscular;
  equipamento: Equipamento;
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

// Todos os exercícios, em ordem alfabética.
export async function listarExercicios(db: SQLiteDatabase): Promise<Exercicio[]> {
  const linhas = await db.getAllAsync<LinhaExercicio>(
    `SELECT ${COLUNAS} FROM exercicio e ORDER BY e.nome COLLATE NOCASE`,
  );
  return linhas.map(paraExercicio);
}

// Posição para um exercício que entra no fim do treino.
export async function proximaOrdem(db: SQLiteDatabase, treinoId: string): Promise<number> {
  const linha = await db.getFirstAsync<{ maior: number | null }>(
    'SELECT MAX(ordem) AS maior FROM treino_exercicio WHERE treino_id = ?',
    treinoId,
  );
  return (linha?.maior ?? 0) + 1;
}

export async function definirOrdem(
  db: SQLiteDatabase,
  treinoId: string,
  exercicioId: string,
  ordem: number,
): Promise<void> {
  await db.runAsync(
    'UPDATE treino_exercicio SET ordem = ? WHERE treino_id = ? AND exercicio_id = ?',
    ordem,
    treinoId,
    exercicioId,
  );
}

// Tira o exercício do treino. O exercício e o histórico dele continuam.
export async function desvincularExercicio(
  db: SQLiteDatabase,
  treinoId: string,
  exercicioId: string,
): Promise<void> {
  await db.runAsync(
    'DELETE FROM treino_exercicio WHERE treino_id = ? AND exercicio_id = ?',
    treinoId,
    exercicioId,
  );
}

// Muda as regras do exercício. O estado (a meta atual) não muda: as regras
// novas valem a partir do próximo registro, quando o motor rodar de novo.
export async function atualizarExercicio(db: SQLiteDatabase, id: string, dados: NovoExercicio): Promise<void> {
  await db.runAsync(
    `UPDATE exercicio
        SET nome = ?, grupo_muscular = ?, equipamento = ?, reps_min = ?, reps_max = ?,
            series_alvo = ?, incremento_kg = ?
      WHERE id = ?`,
    dados.nome,
    dados.grupoMuscular,
    dados.equipamento,
    dados.repsMin,
    dados.repsMax,
    dados.seriesAlvo,
    dados.incrementoKg,
    id,
  );
}

// Arquivar (ativo = false) tira o exercício da aba Hoje e da Evolução sem
// apagar nada do histórico.
export async function definirAtivo(db: SQLiteDatabase, id: string, ativo: boolean): Promise<void> {
  await db.runAsync('UPDATE exercicio SET ativo = ? WHERE id = ?', ativo ? 1 : 0, id);
}
