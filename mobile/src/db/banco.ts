import type { SQLiteDatabase } from 'expo-sqlite';

import { paraDataLocal } from '@/domain/datas';

import { MIGRACOES, migracoesPendentes } from './migracoes';
import { gravarExercicioNovo } from './operacoes';
import { salvarConfig } from './repositorios/config';
import { proximaOrdem, vincularExercicioAoTreino } from './repositorios/exercicios';
import { definirTreinoDoDia, inserirTreino } from './repositorios/treinos';
import { DIVISAO_SEED, type TreinoSeed } from './seed';
import { emTransacao, PRAGMAS_DA_CONEXAO } from './transacao';

export const NOME_DO_BANCO = 'load-tracker.db';

// Roda uma vez por abertura do app, antes de qualquer tela (via `onInit` do
// SQLiteProvider em app/_layout.tsx).
export async function inicializarBanco(db: SQLiteDatabase): Promise<void> {
  // PRAGMAs são ignorados dentro de transação, por isso vêm primeiro.
  // WAL fica gravado no arquivo e deixa leituras e escritas acontecerem ao
  // mesmo tempo sem travar; os outros valem só para esta conexão (transacao.ts).
  await db.execAsync(`PRAGMA journal_mode = WAL; ${PRAGMAS_DA_CONEXAO}`);

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
    await emTransacao(db, async (txn) => {
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
  await emTransacao(db, (txn) => gravarDivisao(txn, DIVISAO_SEED));
}

async function gravarDivisao(txn: SQLiteDatabase, divisao: readonly TreinoSeed[]): Promise<void> {
  const hoje = paraDataLocal(new Date());
  // Exercício com o mesmo nome em dois treinos é gravado uma vez só.
  const idPorNome = new Map<string, string>();

  for (const treinoSeed of divisao) {
    const treino = await inserirTreino(txn, treinoSeed.nome);
    await definirTreinoDoDia(txn, treinoSeed.diaSemana, treino.id);

    for (const exercicioSeed of treinoSeed.exercicios) {
      const existente = idPorNome.get(exercicioSeed.nome);
      if (existente !== undefined) {
        await vincularExercicioAoTreino(txn, treino.id, existente, await proximaOrdem(txn, treino.id));
        continue;
      }
      // O mesmo caminho do formulário da Divisão: registro de onboarding e
      // primeira meta pelo motor, para o estado ser recalculável (§9).
      const { cargaKg, repsAtuais, ...novo } = exercicioSeed;
      const exercicio = await gravarExercicioNovo(txn, treino.id, novo, { cargaKg, reps: repsAtuais }, hoje);
      idPorNome.set(exercicio.nome, exercicio.id);
    }
  }
  // A divisão do seed já faz o papel do onboarding.
  await salvarConfig(txn, 'onboarding_concluido', '1');
}
