// Operações que gravam em mais de uma tabela. Cada uma abre a própria
// transação: ou tudo é gravado, ou nada. As telas chamam estas funções; os
// repositórios ficam para leituras e gravações simples.

import type { SQLiteDatabase } from 'expo-sqlite';

import {
  definirTreinoDoDia,
  desligarSessoesDoTreino,
  excluirTreino,
  inserirTreino,
  removerDiasDoTreino,
} from './repositorios/treinos';
import { emTransacao } from './transacao';

// Cria o treino já nos dias escolhidos.
export async function criarTreino(db: SQLiteDatabase, nome: string, dias: readonly number[]): Promise<string> {
  return emTransacao(db, async (txn) => {
    const treino = await inserirTreino(txn, nome.trim());
    for (const dia of dias) {
      await definirTreinoDoDia(txn, dia, treino.id);
    }
    return treino.id;
  });
}

// Grava os dias do treino. Um dia que era de outro treino passa para este
// (um treino por dia, §9); a tela avisa antes de chamar.
export async function salvarDiasDoTreino(
  db: SQLiteDatabase,
  treinoId: string,
  dias: readonly number[],
): Promise<void> {
  await emTransacao(db, async (txn) => {
    await removerDiasDoTreino(txn, treinoId);
    for (const dia of dias) {
      await definirTreinoDoDia(txn, dia, treinoId);
    }
  });
}

export async function excluirTreinoMantendoHistorico(db: SQLiteDatabase, treinoId: string): Promise<void> {
  await emTransacao(db, async (txn) => {
    await desligarSessoesDoTreino(txn, treinoId);
    await excluirTreino(txn, treinoId);
  });
}
