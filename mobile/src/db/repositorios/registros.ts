import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { GrupoMuscular, Resultado } from '@/domain/tipos';

// Convenções: ver o comentário no topo de treinos.ts.

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

const COLUNAS = `r.id, r.sessao_id, r.exercicio_id, r.carga_kg, r.resultado, r.meta_carga_kg,
  r.meta_reps, r.origem, r.criado_em`;

// Junta as séries aos registros com uma consulta só para todos, em vez de uma
// consulta por registro. `filtro` é o mesmo WHERE usado para buscar os registros.
async function comSeries(
  db: SQLiteDatabase,
  linhas: LinhaRegistro[],
  filtro: string,
  parametro: string,
): Promise<Registro[]> {
  const series = await db.getAllAsync<LinhaSerie>(
    `SELECT s.registro_id, s.reps
       FROM serie s
       JOIN registro r ON r.id = s.registro_id
      WHERE ${filtro}
      ORDER BY s.registro_id, s.ordem`,
    parametro,
  );
  const repsPorRegistro = new Map<string, number[]>();
  for (const serie of series) {
    const reps = repsPorRegistro.get(serie.registro_id) ?? [];
    reps.push(serie.reps);
    repsPorRegistro.set(serie.registro_id, reps);
  }
  return linhas.map((linha) => paraRegistro(linha, repsPorRegistro.get(linha.id) ?? []));
}

// Em ordem cronológica, que é a ordem em que o motor reaplica os registros
// para reconstruir o estado (§9).
export async function listarRegistrosDoExercicio(
  db: SQLiteDatabase,
  exercicioId: string,
): Promise<Registro[]> {
  const linhas = await db.getAllAsync<LinhaRegistro>(
    `SELECT ${COLUNAS} FROM registro r WHERE r.exercicio_id = ? ORDER BY r.criado_em, r.id`,
    exercicioId,
  );
  return comSeries(db, linhas, 'r.exercicio_id = ?', exercicioId);
}

export async function listarRegistrosDaSessao(db: SQLiteDatabase, sessaoId: string): Promise<Registro[]> {
  const linhas = await db.getAllAsync<LinhaRegistro>(
    `SELECT ${COLUNAS} FROM registro r WHERE r.sessao_id = ? ORDER BY r.criado_em, r.id`,
    sessaoId,
  );
  return comSeries(db, linhas, 'r.sessao_id = ?', sessaoId);
}

export interface SeriesPorGrupo {
  data: string;
  grupoMuscular: GrupoMuscular;
  series: number;
}

// Quantas séries cada registro teve, com o dia da sessão e o grupo do
// exercício, a partir de `desde` ('YYYY-MM-DD'). Onboarding fica de fora
// (não tem sessão): é a carga de antes do app, não um treino.
export async function listarSeriesDesde(db: SQLiteDatabase, desde: string): Promise<SeriesPorGrupo[]> {
  const linhas = await db.getAllAsync<{ data: string; grupo_muscular: GrupoMuscular; series: number }>(
    `SELECT s.data, e.grupo_muscular, COUNT(*) AS series
       FROM registro r
       JOIN sessao s ON s.id = r.sessao_id
       JOIN exercicio e ON e.id = r.exercicio_id
       JOIN serie se ON se.registro_id = r.id
      WHERE s.data >= ?
      GROUP BY r.id`,
    desde,
  );
  return linhas.map((l) => ({ data: l.data, grupoMuscular: l.grupo_muscular, series: l.series }));
}

// Dias de treino desde `desde`: sessões com pelo menos um exercício feito.
export async function contarSessoesComRegistroDesde(db: SQLiteDatabase, desde: string): Promise<number> {
  const linha = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(DISTINCT r.sessao_id) AS total
       FROM registro r
       JOIN sessao s ON s.id = r.sessao_id
      WHERE s.data >= ? AND r.resultado <> 'pulou'`,
    desde,
  );
  return linha?.total ?? 0;
}

// As séries somem junto (ON DELETE CASCADE). Eventos apontam para o registro
// e precisam ser apagados antes (eventos.ts).
export async function excluirRegistro(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM registro WHERE id = ?', id);
}

// Registros (fora "Pulei") feitos em sessões de um dia.
export async function contarRegistrosDaData(db: SQLiteDatabase, data: string): Promise<number> {
  const linha = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total
       FROM registro r
       JOIN sessao s ON s.id = r.sessao_id
      WHERE s.data = ? AND r.resultado <> 'pulou'`,
    data,
  );
  return linha?.total ?? 0;
}

export interface SessaoDoHistorico {
  exercicioId: string;
  data: string;
  cargaKg: number;
  reps: number[];
  doOnboarding: boolean;
}

// Tudo o que foi feito (fora "Pulei"), do mais antigo ao mais recente, para
// as métricas de evolução. O registro de onboarding não tem sessão: o dia
// dele sai do horário de criação, no fuso do aparelho ('localtime').
export async function listarHistorico(db: SQLiteDatabase): Promise<SessaoDoHistorico[]> {
  const linhas = await db.getAllAsync<LinhaRegistro & { data: string }>(
    `SELECT ${COLUNAS}, COALESCE(s.data, date(r.criado_em, 'localtime')) AS data
       FROM registro r
       LEFT JOIN sessao s ON s.id = r.sessao_id
      WHERE r.resultado <> 'pulou'
      ORDER BY r.criado_em, r.id`,
  );
  const registros = await comSeries(db, linhas, "r.resultado <> ?", 'pulou');
  return registros.map((registro, indice) => ({
    exercicioId: registro.exercicioId,
    data: linhas[indice].data,
    cargaKg: registro.cargaKg,
    reps: registro.reps,
    doOnboarding: registro.origem === 'onboarding',
  }));
}
