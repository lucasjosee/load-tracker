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

// Treino com os dias da semana em que ele cai (pode ser mais de um, §8.4).
export interface TreinoComDias extends Treino {
  dias: number[];
}

// Todos os treinos, inclusive os que não têm dia, com os dias de cada um.
// Ordem: pelo primeiro dia na semana (segunda primeiro); sem dia vão no fim.
export async function listarTreinos(db: SQLiteDatabase): Promise<TreinoComDias[]> {
  const treinos = await db.getAllAsync<LinhaTreino>('SELECT id, nome, criado_em FROM treino');
  const dias = await db.getAllAsync<{ treino_id: string; dia_semana: number }>(
    'SELECT treino_id, dia_semana FROM treino_dia ORDER BY (dia_semana + 6) % 7',
  );

  const diasPorTreino = new Map<string, number[]>();
  for (const { treino_id, dia_semana } of dias) {
    diasPorTreino.set(treino_id, [...(diasPorTreino.get(treino_id) ?? []), dia_semana]);
  }

  const comDias = treinos.map((linha) => ({
    ...paraTreino(linha),
    dias: diasPorTreino.get(linha.id) ?? [],
  }));
  const posicao = (treino: TreinoComDias) =>
    treino.dias.length === 0 ? 7 : (treino.dias[0] + 6) % 7;
  return comDias.sort((a, b) => posicao(a) - posicao(b) || a.criadoEm.localeCompare(b.criadoEm));
}

export async function obterTreino(db: SQLiteDatabase, id: string): Promise<TreinoComDias | null> {
  const linha = await db.getFirstAsync<LinhaTreino>(
    'SELECT id, nome, criado_em FROM treino WHERE id = ?',
    id,
  );
  if (linha === null) {
    return null;
  }
  const dias = await db.getAllAsync<{ dia_semana: number }>(
    'SELECT dia_semana FROM treino_dia WHERE treino_id = ? ORDER BY (dia_semana + 6) % 7',
    id,
  );
  return { ...paraTreino(linha), dias: dias.map((d) => d.dia_semana) };
}

export async function renomearTreino(db: SQLiteDatabase, id: string, nome: string): Promise<void> {
  await db.runAsync('UPDATE treino SET nome = ? WHERE id = ?', nome, id);
}

// Tira o treino de todos os dias. Usado antes de gravar os dias novos.
export async function removerDiasDoTreino(db: SQLiteDatabase, treinoId: string): Promise<void> {
  await db.runAsync('DELETE FROM treino_dia WHERE treino_id = ?', treinoId);
}

// Sessões antigas apontam para o treino. Antes de excluí-lo, elas ficam sem
// treino (a coluna aceita NULL): o histórico continua, só perde o nome.
export async function desligarSessoesDoTreino(db: SQLiteDatabase, treinoId: string): Promise<void> {
  await db.runAsync('UPDATE sessao SET treino_id = NULL WHERE treino_id = ?', treinoId);
}

// Os dias e a lista de exercícios do treino somem junto (ON DELETE CASCADE);
// os exercícios em si e o histórico deles ficam.
export async function excluirTreino(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM treino WHERE id = ?', id);
}
