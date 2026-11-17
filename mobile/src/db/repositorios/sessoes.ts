import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

// Convenções: ver o comentário no topo de treinos.ts.

export interface Sessao {
  id: string;
  treinoId: string | null;
  data: string; // 'YYYY-MM-DD' no fuso do aparelho
  iniciadaEm: string;
  finalizadaEm: string | null;
  pausadaEm: string | null; // começo da pausa em curso (§3.2)
  pausadoS: number; // soma das pausas já terminadas, em segundos
}

const COLUNAS = 'id, treino_id, data, iniciada_em, finalizada_em, pausada_em, pausado_s';

interface LinhaSessao {
  id: string;
  treino_id: string | null;
  data: string;
  iniciada_em: string;
  finalizada_em: string | null;
  pausada_em: string | null;
  pausado_s: number;
}

function paraSessao(linha: LinhaSessao): Sessao {
  return {
    id: linha.id,
    treinoId: linha.treino_id,
    data: linha.data,
    iniciadaEm: linha.iniciada_em,
    finalizadaEm: linha.finalizada_em,
    pausadaEm: linha.pausada_em,
    pausadoS: linha.pausado_s,
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
    pausadaEm: null,
    pausadoS: 0,
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

// Apaga a sessão só se ela não tiver nenhum registro (treino iniciado e
// abandonado sem fazer nada). Com registro, não faz nada.
export async function apagarSessaoSeVazia(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'DELETE FROM sessao WHERE id = ? AND NOT EXISTS (SELECT 1 FROM registro WHERE registro.sessao_id = sessao.id)',
    id,
  );
}

// Se houver mais de uma sessão no mesmo dia, devolve a mais recente.
export async function obterSessaoDaData(db: SQLiteDatabase, data: string): Promise<Sessao | null> {
  const linha = await db.getFirstAsync<LinhaSessao>(
    `SELECT ${COLUNAS}
       FROM sessao
      WHERE data = ?
      ORDER BY iniciada_em DESC
      LIMIT 1`,
    data,
  );
  return linha === null ? null : paraSessao(linha);
}

// Todas as sessões de um dia (pode haver mais de uma: o treino do dia, um
// treino perdido feito hoje, a sessão avulsa do registro rápido).
export async function listarSessoesDaData(db: SQLiteDatabase, data: string): Promise<Sessao[]> {
  const linhas = await db.getAllAsync<LinhaSessao>(
    `SELECT ${COLUNAS}
       FROM sessao
      WHERE data = ?
      ORDER BY iniciada_em`,
    data,
  );
  return linhas.map(paraSessao);
}

// Encerrar um treino pausado: o fim é o começo da pausa (COALESCE pega o
// primeiro valor que não é NULL), porque dali em diante ninguém treinou.
export async function finalizarSessao(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'UPDATE sessao SET finalizada_em = COALESCE(pausada_em, ?), pausada_em = NULL WHERE id = ?',
    new Date().toISOString(),
    id,
  );
}

export async function obterSessao(db: SQLiteDatabase, id: string): Promise<Sessao | null> {
  const linha = await db.getFirstAsync<LinhaSessao>(`SELECT ${COLUNAS} FROM sessao WHERE id = ?`, id);
  return linha === null ? null : paraSessao(linha);
}

// Só pausa quem está contando: sessão já pausada ou encerrada fica como está.
export async function pausarSessao(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    'UPDATE sessao SET pausada_em = ? WHERE id = ? AND pausada_em IS NULL AND finalizada_em IS NULL',
    new Date().toISOString(),
    id,
  );
}

// Volta a contar, de uma pausa ou de um treino encerrado. `pausadoS` é o
// novo total pausado, calculado no domínio (pausadoAoRetomar).
export async function retomarSessao(db: SQLiteDatabase, id: string, pausadoS: number): Promise<void> {
  await db.runAsync('UPDATE sessao SET pausado_s = ?, pausada_em = NULL, finalizada_em = NULL WHERE id = ?', pausadoS, id);
}

// As sessões encerradas de um treino, da mais recente para a mais antiga,
// para a previsão de duração da aba Hoje.
export async function listarSessoesEncerradasDoTreino(db: SQLiteDatabase, treinoId: string, limite: number): Promise<Sessao[]> {
  const linhas = await db.getAllAsync<LinhaSessao>(
    `SELECT ${COLUNAS}
       FROM sessao
      WHERE treino_id = ? AND finalizada_em IS NOT NULL
      ORDER BY iniciada_em DESC
      LIMIT ?`,
    treinoId,
    limite,
  );
  return linhas.map(paraSessao);
}

// A sessão de um treino num dia (a mais recente, se houver mais de uma).
// `treinoId` null = a sessão avulsa do dia (registro por texto em dia de
// descanso). `IS` compara como `=`, mas também acha NULL, o que `=` não faz.
export async function obterSessaoDoTreino(
  db: SQLiteDatabase,
  data: string,
  treinoId: string | null,
): Promise<Sessao | null> {
  const linha = await db.getFirstAsync<LinhaSessao>(
    `SELECT ${COLUNAS}
       FROM sessao
      WHERE data = ? AND treino_id IS ?
      ORDER BY iniciada_em DESC
      LIMIT 1`,
    data,
    treinoId,
  );
  return linha === null ? null : paraSessao(linha);
}
