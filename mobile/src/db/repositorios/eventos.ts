import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Evento, MudancaDeMeta } from '@/domain/tipos';

// Convenções: ver o comentário no topo de treinos.ts.

export interface EventoSalvo extends MudancaDeMeta {
  id: string;
  exercicioId: string;
  registroId: string;
  data: string; // 'YYYY-MM-DD'
}

interface LinhaEvento {
  id: string;
  exercicio_id: string;
  registro_id: string;
  data: string;
  tipo: Evento;
  carga_de: number | null;
  carga_para: number;
  reps_de: number | null;
  reps_para: number;
}

function paraEvento(linha: LinhaEvento): EventoSalvo {
  return {
    id: linha.id,
    exercicioId: linha.exercicio_id,
    registroId: linha.registro_id,
    data: linha.data,
    tipo: linha.tipo,
    cargaDe: linha.carga_de,
    cargaPara: linha.carga_para,
    repsDe: linha.reps_de,
    repsPara: linha.reps_para,
  };
}

export async function inserirEvento(
  db: SQLiteDatabase,
  exercicioId: string,
  registroId: string,
  data: string,
  mudanca: MudancaDeMeta,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO evento (id, exercicio_id, registro_id, data, tipo,
                         carga_de, carga_para, reps_de, reps_para)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    exercicioId,
    registroId,
    data,
    mudanca.tipo,
    mudanca.cargaDe,
    mudanca.cargaPara,
    mudanca.repsDe,
    mudanca.repsPara,
  );
}

// A ordem real dos eventos é a dos registros que os geraram: `data` só tem o
// dia, e num mesmo dia pode haver mais de um evento do mesmo exercício.
const COLUNAS = `e.id, e.exercicio_id, e.registro_id, e.data, e.tipo,
  e.carga_de, e.carga_para, e.reps_de, e.reps_para`;

// Eventos de um exercício (ou de todos, sem `exercicioId`), do mais antigo
// ao mais recente.
export async function listarEventos(db: SQLiteDatabase, exercicioId?: string): Promise<EventoSalvo[]> {
  const linhas =
    exercicioId === undefined
      ? await db.getAllAsync<LinhaEvento>(
          `SELECT ${COLUNAS} FROM evento e JOIN registro r ON r.id = e.registro_id
            ORDER BY r.criado_em, r.id`,
        )
      : await db.getAllAsync<LinhaEvento>(
          `SELECT ${COLUNAS} FROM evento e JOIN registro r ON r.id = e.registro_id
            WHERE e.exercicio_id = ?
            ORDER BY r.criado_em, r.id`,
          exercicioId,
        );
  return linhas.map(paraEvento);
}

// O evento mais recente de cada exercício: é ele que explica a meta atual
// no cartão. ROW_NUMBER() numera os eventos de cada exercício (PARTITION BY)
// do mais novo para o mais velho, e ficamos só com o número 1.
export async function listarUltimasMudancas(db: SQLiteDatabase): Promise<Map<string, MudancaDeMeta>> {
  const linhas = await db.getAllAsync<LinhaEvento>(
    `SELECT * FROM (
       SELECT ${COLUNAS},
              ROW_NUMBER() OVER (PARTITION BY e.exercicio_id ORDER BY r.criado_em DESC, r.id DESC) AS posicao
         FROM evento e JOIN registro r ON r.id = e.registro_id
     ) WHERE posicao = 1`,
  );
  return new Map(linhas.map((linha) => [linha.exercicio_id, paraEvento(linha)]));
}

export async function excluirEventosDoRegistro(db: SQLiteDatabase, registroId: string): Promise<void> {
  await db.runAsync('DELETE FROM evento WHERE registro_id = ?', registroId);
}

// O tipo de evento de cada registro da sessão, para o resumo ao finalizar.
// "Pulei" não tem evento (LEFT JOIN devolve null) e vira 'sem_mudanca'.
export async function listarTiposDaSessao(db: SQLiteDatabase, sessaoId: string): Promise<Evento[]> {
  const linhas = await db.getAllAsync<{ tipo: Evento | null }>(
    `SELECT e.tipo
       FROM registro r
       LEFT JOIN evento e ON e.registro_id = r.id
      WHERE r.sessao_id = ?`,
    sessaoId,
  );
  return linhas.map((linha) => linha.tipo ?? 'sem_mudanca');
}
