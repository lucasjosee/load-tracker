import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

// Convenções: ver o comentário no topo de treinos.ts.

export interface Sessao {
  id: string;
  treinoId: string | null;
  data: string; // 'YYYY-MM-DD' no fuso do aparelho
  iniciadaEm: string;
  finalizadaEm: string | null;
}

interface LinhaSessao {
  id: string;
  treino_id: string | null;
  data: string;
  iniciada_em: string;
  finalizada_em: string | null;
}

function paraSessao(linha: LinhaSessao): Sessao {
  return {
    id: linha.id,
    treinoId: linha.treino_id,
    data: linha.data,
    iniciadaEm: linha.iniciada_em,
    finalizadaEm: linha.finalizada_em,
  };
}

// `data` vem de quem chama: o dia de calendário depende do fuso do aparelho,
// e calcular isso aqui esconderia uma regra dentro do acesso ao banco.
export async function iniciarSessao(
  db: SQLiteDatabase,
  treinoId: string | null,
  data: string,
): Promise<Sessao> {
  const sessao: Sessao = {
    id: randomUUID(),
    treinoId,
    data,
    iniciadaEm: new Date().toISOString(),
    finalizadaEm: null,
  };
  await db.runAsync(
    'INSERT INTO sessao (id, treino_id, data, iniciada_em, finalizada_em) VALUES (?, ?, ?, ?, NULL)',
    sessao.id,
    sessao.treinoId,
    sessao.data,
    sessao.iniciadaEm,
  );
  return sessao;
}

// Se houver mais de uma sessão no mesmo dia, devolve a mais recente.
export async function obterSessaoDaData(db: SQLiteDatabase, data: string): Promise<Sessao | null> {
  const linha = await db.getFirstAsync<LinhaSessao>(
    `SELECT id, treino_id, data, iniciada_em, finalizada_em
       FROM sessao
      WHERE data = ?
      ORDER BY iniciada_em DESC
      LIMIT 1`,
    data,
  );
  return linha === null ? null : paraSessao(linha);
}

export async function finalizarSessao(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'UPDATE sessao SET finalizada_em = ? WHERE id = ?',
    new Date().toISOString(),
    id,
  );
}
