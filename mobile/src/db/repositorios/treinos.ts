import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

// Convenção dos repositórios:
// - Recebem `db` por parâmetro. Uma transação (`txn`) também é um
//   SQLiteDatabase, então a mesma função serve dentro e fora de transação.
// - Nunca abrem transação: o SQLite não aninha transações, e quem chama sabe
//   quais gravações precisam ser atômicas (ex.: check-in, regra 7).
// - Linhas do banco vêm em snake_case e são convertidas para camelCase aqui.

export interface Treino {
  id: string;
  nome: string;
  criadoEm: string;
}

export interface TreinoDoDia {
  diaSemana: number;
  treino: Treino;
}

interface LinhaTreino {
  id: string;
  nome: string;
  criado_em: string;
}

function paraTreino(linha: LinhaTreino): Treino {
  return { id: linha.id, nome: linha.nome, criadoEm: linha.criado_em };
}

export async function inserirTreino(db: SQLiteDatabase, nome: string): Promise<Treino> {
  const treino: Treino = { id: randomUUID(), nome, criadoEm: new Date().toISOString() };
  await db.runAsync(
    'INSERT INTO treino (id, nome, criado_em) VALUES (?, ?, ?)',
    treino.id,
    treino.nome,
    treino.criadoEm,
  );
  return treino;
}

// Um treino por dia (§9): definir outro treino no mesmo dia substitui o anterior.
export async function definirTreinoDoDia(
  db: SQLiteDatabase,
  diaSemana: number,
  treinoId: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO treino_dia (dia_semana, treino_id) VALUES (?, ?)
     ON CONFLICT (dia_semana) DO UPDATE SET treino_id = excluded.treino_id`,
    diaSemana,
    treinoId,
  );
}

export async function obterTreinoDoDia(db: SQLiteDatabase, diaSemana: number): Promise<Treino | null> {
  const linha = await db.getFirstAsync<LinhaTreino>(
    `SELECT t.id, t.nome, t.criado_em
       FROM treino_dia td
       JOIN treino t ON t.id = td.treino_id
      WHERE td.dia_semana = ?`,
    diaSemana,
  );
  return linha === null ? null : paraTreino(linha);
}

export async function listarTreinosPorDia(db: SQLiteDatabase): Promise<TreinoDoDia[]> {
  // `(dia_semana + 6) % 7` põe a segunda primeiro e o domingo por último,
  // como a semana da §7 (segunda a domingo), sem mudar a numeração 0–6.
  const linhas = await db.getAllAsync<LinhaTreino & { dia_semana: number }>(
    `SELECT td.dia_semana, t.id, t.nome, t.criado_em
       FROM treino_dia td
       JOIN treino t ON t.id = td.treino_id
      ORDER BY (td.dia_semana + 6) % 7`,
  );
  return linhas.map((linha) => ({ diaSemana: linha.dia_semana, treino: paraTreino(linha) }));
}
