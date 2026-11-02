import type { SQLiteDatabase } from 'expo-sqlite';

import type { EstadoProgressao } from '@/domain/tipos';

// Convenções: ver o comentário no topo de treinos.ts.
//
// O estado é derivado (§9): é a "foto atual" do que o motor calculou, e tem
// que poder ser reconstruído do zero a partir dos registros. Por isso salvar
// sobrescreve: o histórico de verdade fica em `registro` e `evento`.

interface LinhaEstado {
  exercicio_id: string;
  carga_kg: number;
  reps_alvo: number;
  falhas: number;
}

function paraEstado(linha: LinhaEstado): EstadoProgressao {
  return { cargaKg: linha.carga_kg, repsAlvo: linha.reps_alvo, falhas: linha.falhas };
}

export async function obterEstado(
  db: SQLiteDatabase,
  exercicioId: string,
): Promise<EstadoProgressao | null> {
  const linha = await db.getFirstAsync<LinhaEstado>(
    `SELECT exercicio_id, carga_kg, reps_alvo, falhas
       FROM estado_progressao
      WHERE exercicio_id = ?`,
    exercicioId,
  );
  return linha === null ? null : paraEstado(linha);
}

// Todos os estados de uma vez, por id do exercício: a aba Hoje e as
// notificações precisam da meta de vários exercícios juntos.
export async function listarEstados(db: SQLiteDatabase): Promise<Map<string, EstadoProgressao>> {
  const linhas = await db.getAllAsync<LinhaEstado>(
    'SELECT exercicio_id, carga_kg, reps_alvo, falhas FROM estado_progressao',
  );
  return new Map(linhas.map((linha) => [linha.exercicio_id, paraEstado(linha)]));
}

// Cria o estado na primeira vez e sobrescreve nas seguintes (um por exercício).
export async function salvarEstado(
  db: SQLiteDatabase,
  exercicioId: string,
  estado: EstadoProgressao,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO estado_progressao (exercicio_id, carga_kg, reps_alvo, falhas, atualizado_em)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (exercicio_id) DO UPDATE SET
       carga_kg = excluded.carga_kg,
       reps_alvo = excluded.reps_alvo,
       falhas = excluded.falhas,
       atualizado_em = excluded.atualizado_em`,
    exercicioId,
    estado.cargaKg,
    estado.repsAlvo,
    estado.falhas,
    new Date().toISOString(),
  );
}
