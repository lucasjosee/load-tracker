import type { SQLiteDatabase } from 'expo-sqlite';

import { TABELAS_DO_BACKUP } from '@/domain/backup';

import { MIGRACOES, migracoesPendentes } from './migracoes';
import { obterConfig, salvarConfig } from './repositorios/config';
import { inserirExercicio, proximaOrdem, vincularExercicioAoTreino } from './repositorios/exercicios';
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
    await aplicarSeedUmaVez(db);
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

// O seed é a divisão real do Lucas (seed.ts). Ele entra uma vez só, e troca
// tudo o que o aparelho tiver de antes (os dados de teste do desenvolvimento)
// pela divisão, sem histórico. A marca `seed_aplicado` é o que impede de
// acontecer de novo: depois dela, nada aqui apaga o banco. Vale também para
// quem exclui todos os treinos para refazer a divisão: o seed não volta.
async function aplicarSeedUmaVez(db: SQLiteDatabase): Promise<void> {
  if ((await obterConfig(db, 'seed_aplicado')) === '1') {
    return;
  }
  // Tudo ou nada: se algo falhar no meio, os dados de antes ficam e a troca
  // é tentada de novo na próxima abertura.
  await emTransacao(db, async (txn) => {
    await apagarDivisaoEHistorico(txn);
    await gravarDivisao(txn, DIVISAO_SEED);
    await salvarConfig(txn, 'seed_aplicado', '1');
  });
}

// Dos filhos para os pais, como no restaurar backup. A config (horário do
// aviso, descanso, perfil) fica: não tem a ver com a divisão nem com o
// histórico.
async function apagarDivisaoEHistorico(txn: SQLiteDatabase): Promise<void> {
  for (const tabela of [...TABELAS_DO_BACKUP].reverse()) {
    if (tabela !== 'config') {
      await txn.execAsync(`DELETE FROM ${tabela}`);
    }
  }
}

// Os exercícios entram sem carga: sem registro de onboarding e, portanto,
// sem meta. No primeiro treino a pessoa registra pelo Ajustar o que fez, e a
// meta sai do motor a partir daí (§5.3, passo 2).
async function gravarDivisao(txn: SQLiteDatabase, divisao: readonly TreinoSeed[]): Promise<void> {
  // Exercício com o mesmo nome em dois treinos é gravado uma vez só.
  const idPorNome = new Map<string, string>();

  for (const treinoSeed of divisao) {
    const treino = await inserirTreino(txn, treinoSeed.nome);
    for (const dia of treinoSeed.dias) {
      await definirTreinoDoDia(txn, dia, treino.id);
    }

    for (const exercicioSeed of treinoSeed.exercicios) {
      const id = idPorNome.get(exercicioSeed.nome) ?? (await inserirExercicio(txn, exercicioSeed)).id;
      idPorNome.set(exercicioSeed.nome, id);
      await vincularExercicioAoTreino(txn, treino.id, id, await proximaOrdem(txn, treino.id));
    }
  }
  // A divisão do seed já faz o papel do onboarding.
  await salvarConfig(txn, 'onboarding_concluido', '1');
}
