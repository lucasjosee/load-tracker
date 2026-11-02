import type { SQLiteDatabase } from 'expo-sqlite';

import { MIGRACOES, migracoesPendentes } from './migracoes';
import { salvarEstado } from './repositorios/estadoProgressao';
import { inserirExercicio, vincularExercicioAoTreino } from './repositorios/exercicios';
import { definirTreinoDoDia, inserirTreino } from './repositorios/treinos';
import { DIVISAO_SEED, type TreinoSeed } from './seed';

export const NOME_DO_BANCO = 'load-tracker.db';

// Roda uma vez por abertura do app, antes de qualquer tela (via `onInit` do
// SQLiteProvider em app/_layout.tsx).
export async function inicializarBanco(db: SQLiteDatabase): Promise<void> {
  // Estes PRAGMAs valem por conexão e são ignorados dentro de transação, por
  // isso vêm primeiro. O SQLite vem com chaves estrangeiras DESLIGADAS por
  // padrão; sem `foreign_keys = ON`, todo REFERENCES do schema é só enfeite.
  // WAL deixa leituras e escritas acontecerem ao mesmo tempo sem travar.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  await aplicarMigracoes(db);

  // No Expo Go o app sempre roda em modo dev. Num build de produção o seed
  // nunca roda (os dados dele continuam no bundle, só não são gravados).
  if (__DEV__) {
    await aplicarSeedSeBancoVazio(db);
  }
}

async function aplicarMigracoes(db: SQLiteDatabase): Promise<void> {
  const linha = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versaoAtual = linha?.user_version ?? 0;

  for (const migracao of migracoesPendentes(versaoAtual, MIGRACOES)) {
    // Schema e número da versão na mesma transação: se a migração falhar no
    // meio, tudo volta atrás e a versão não avança. Na próxima abertura ela
    // é tentada de novo, do começo.
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(migracao.sql);
      // PRAGMA não aceita parâmetro `?`. Interpolar é seguro aqui porque a
      // versão é um número da nossa lista, nunca algo digitado pelo usuário.
      await txn.execAsync(`PRAGMA user_version = ${migracao.versao}`);
    });
  }
}

async function aplicarSeedSeBancoVazio(db: SQLiteDatabase): Promise<void> {
  const linha = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM treino');
  if ((linha?.total ?? 0) > 0) {
    return;
  }
  // Tudo ou nada: um seed pela metade deixaria o banco "não vazio" e o seed
  // nunca mais rodaria para completar.
  await db.withExclusiveTransactionAsync(async (txn) => {
    await gravarDivisao(txn, DIVISAO_SEED);
  });
}

async function gravarDivisao(db: SQLiteDatabase, divisao: readonly TreinoSeed[]): Promise<void> {
  // Exercício com o mesmo nome em dois treinos é gravado uma vez só.
  const idPorNome = new Map<string, string>();

  for (const treinoSeed of divisao) {
    const treino = await inserirTreino(db, treinoSeed.nome);
    await definirTreinoDoDia(db, treinoSeed.diaSemana, treino.id);

    for (const [indice, exercicioSeed] of treinoSeed.exercicios.entries()) {
      let exercicioId = idPorNome.get(exercicioSeed.nome);
      if (exercicioId === undefined) {
        const { cargaKg, repsAlvo, ...config } = exercicioSeed;
        const exercicio = await inserirExercicio(db, config);
        await salvarEstado(db, { exercicioId: exercicio.id, cargaKg, repsAlvo, falhas: 0 });
        exercicioId = exercicio.id;
        idPorNome.set(exercicioSeed.nome, exercicioId);
      }
      await vincularExercicioAoTreino(db, treino.id, exercicioId, indice + 1);
    }
  }
}
