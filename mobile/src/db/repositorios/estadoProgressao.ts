import type { SQLiteDatabase } from 'expo-sqlite';

// Convenções: ver o comentário no topo de treinos.ts.
//
// O estado é derivado (§9): é a "foto atual" do que o motor calculou, e tem
// que poder ser reconstruído do zero a partir dos registros. Por isso salvar
// sobrescreve: o histórico de verdade fica em `registro` e `evento`.

// Este tipo é provisório: a tarefa 1.1 cria o EstadoProgressao do domínio,
// e este repositório passa a usá-lo.
export interface EstadoProgressao {
  exercicioId: string;
  cargaKg: number;
  repsAlvo: number;
  falhas: number;
  atualizadoEm: string;
}

export type NovoEstado = Omit<EstadoProgressao, 'atualizadoEm'>;

interface LinhaEstado {
  exercicio_id: string;
  carga_kg: number;
  reps_alvo: number;
  falhas: number;
  atualizado_em: string;
}

function paraEstado(linha: LinhaEstado): EstadoProgressao {
  return {
    exercicioId: linha.exercicio_id,
    cargaKg: linha.carga_kg,
    repsAlvo: linha.reps_alvo,
    falhas: linha.falhas,
    atualizadoEm: linha.atualizado_em,
  };
}

export async function obterEstado(
  db: SQLiteDatabase,
  exercicioId: string,
): Promise<EstadoProgressao | null> {
  const linha = await db.getFirstAsync<LinhaEstado>(
    `SELECT exercicio_id, carga_kg, reps_alvo, falhas, atualizado_em
       FROM estado_progressao
      WHERE exercicio_id = ?`,
    exercicioId,
  );
  return linha === null ? null : paraEstado(linha);
}

// Cria o estado na primeira vez e sobrescreve nas seguintes (um por exercício).
export async function salvarEstado(db: SQLiteDatabase, novo: NovoEstado): Promise<EstadoProgressao> {
  const estado: EstadoProgressao = { ...novo, atualizadoEm: new Date().toISOString() };
  await db.runAsync(
    `INSERT INTO estado_progressao (exercicio_id, carga_kg, reps_alvo, falhas, atualizado_em)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (exercicio_id) DO UPDATE SET
       carga_kg = excluded.carga_kg,
       reps_alvo = excluded.reps_alvo,
       falhas = excluded.falhas,
       atualizado_em = excluded.atualizado_em`,
    estado.exercicioId,
    estado.cargaKg,
    estado.repsAlvo,
    estado.falhas,
    estado.atualizadoEm,
  );
  return estado;
}
