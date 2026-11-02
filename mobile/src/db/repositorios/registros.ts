import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

// Convenções: ver o comentário no topo de treinos.ts.

export type Resultado = 'bateu' | 'nao_bateu' | 'pulou';
export type Origem = 'checkin' | 'texto' | 'onboarding';

export interface Registro {
  id: string;
  sessaoId: string | null; // null só para origem 'onboarding' (§9)
  exercicioId: string;
  cargaKg: number;
  resultado: Resultado;
  metaCargaKg: number | null;
  metaReps: number | null;
  origem: Origem;
  criadoEm: string;
  // Reps feitas em cada série, na ordem: [10, 9, 8] = 3 séries.
  reps: number[];
}

export type NovoRegistro = Omit<Registro, 'id' | 'criadoEm'>;

// `resultado` e `origem` já saem tipados do banco porque o CHECK do schema
// só aceita esses valores.
interface LinhaRegistro {
  id: string;
  sessao_id: string | null;
  exercicio_id: string;
  carga_kg: number;
  resultado: Resultado;
  meta_carga_kg: number | null;
  meta_reps: number | null;
  origem: Origem;
  criado_em: string;
}

interface LinhaSerie {
  registro_id: string;
  reps: number;
}

function paraRegistro(linha: LinhaRegistro, reps: number[]): Registro {
  return {
    id: linha.id,
    sessaoId: linha.sessao_id,
    exercicioId: linha.exercicio_id,
    cargaKg: linha.carga_kg,
    resultado: linha.resultado,
    metaCargaKg: linha.meta_carga_kg,
    metaReps: linha.meta_reps,
    origem: linha.origem,
    criadoEm: linha.criado_em,
    reps,
  };
}

// Grava o registro e as séries dele. Não abre transação: no check-in (2.4),
// quem chama junta registro, séries, estado e evento numa só (regra 7).
export async function inserirRegistro(db: SQLiteDatabase, novo: NovoRegistro): Promise<Registro> {
  const registro: Registro = { ...novo, id: randomUUID(), criadoEm: new Date().toISOString() };
  await db.runAsync(
    `INSERT INTO registro (id, sessao_id, exercicio_id, carga_kg, resultado,
                           meta_carga_kg, meta_reps, origem, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    registro.id,
    registro.sessaoId,
    registro.exercicioId,
    registro.cargaKg,
    registro.resultado,
    registro.metaCargaKg,
    registro.metaReps,
    registro.origem,
    registro.criadoEm,
  );
  for (const [indice, reps] of registro.reps.entries()) {
    await db.runAsync(
      'INSERT INTO serie (registro_id, ordem, reps) VALUES (?, ?, ?)',
      registro.id,
      indice + 1,
      reps,
    );
  }
  return registro;
}

// Em ordem cronológica, que é a ordem em que o motor reaplica os registros
// para reconstruir o estado (§9).
export async function listarRegistrosDoExercicio(
  db: SQLiteDatabase,
  exercicioId: string,
): Promise<Registro[]> {
  const linhas = await db.getAllAsync<LinhaRegistro>(
    `SELECT id, sessao_id, exercicio_id, carga_kg, resultado, meta_carga_kg, meta_reps,
            origem, criado_em
       FROM registro
      WHERE exercicio_id = ?
      ORDER BY criado_em, id`,
    exercicioId,
  );
  // Uma consulta para todas as séries, em vez de uma por registro.
  const series = await db.getAllAsync<LinhaSerie>(
    `SELECT s.registro_id, s.reps
       FROM serie s
       JOIN registro r ON r.id = s.registro_id
      WHERE r.exercicio_id = ?
      ORDER BY s.registro_id, s.ordem`,
    exercicioId,
  );

  const repsPorRegistro = new Map<string, number[]>();
  for (const serie of series) {
    const reps = repsPorRegistro.get(serie.registro_id) ?? [];
    reps.push(serie.reps);
    repsPorRegistro.set(serie.registro_id, reps);
  }
  return linhas.map((linha) => paraRegistro(linha, repsPorRegistro.get(linha.id) ?? []));
}
