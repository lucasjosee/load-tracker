// Operações que gravam em mais de uma tabela. Cada uma abre a própria
// transação: ou tudo é gravado, ou nada. As telas chamam estas funções; os
// repositórios ficam para leituras e gravações simples.

import type { SQLiteDatabase } from 'expo-sqlite';

import { calcularProxima, descreverMudanca, resultadoDoEvento, type Proxima } from '@/domain/progressao';
import { LIMITE_FALHAS_PADRAO, type ConfigExercicio, type Realizado } from '@/domain/tipos';

import { obterEstado, salvarEstado } from './repositorios/estadoProgressao';
import { inserirEvento } from './repositorios/eventos';
import {
  definirOrdem,
  inserirExercicio,
  listarExerciciosDoTreino,
  proximaOrdem,
  vincularExercicioAoTreino,
  type Exercicio,
  type NovoExercicio,
} from './repositorios/exercicios';
import { inserirRegistro, type Origem, type Registro } from './repositorios/registros';
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

// O banco não guarda o limite de falhas (no MVP é sempre o padrão, §5.1).
export function configDoExercicio(exercicio: Exercicio): ConfigExercicio {
  return {
    repsMin: exercicio.repsMin,
    repsMax: exercicio.repsMax,
    seriesAlvo: exercicio.seriesAlvo,
    incrementoKg: exercicio.incrementoKg,
    limiteFalhas: LIMITE_FALHAS_PADRAO,
  };
}

interface Contexto {
  origem: Origem;
  sessaoId: string | null;
  data: string; // 'YYYY-MM-DD' do dia do registro
}

// O caminho único de "a pessoa fez isto" até "a meta mudou": roda o motor,
// grava o registro com as séries e, se a meta mudou, o estado novo e o
// evento. Recebe a transação de quem chama (regra 7) e não abre outra.
export async function aplicarRealizado(
  txn: SQLiteDatabase,
  exercicio: Exercicio,
  realizado: Realizado,
  contexto: Contexto,
): Promise<{ registro: Registro; proxima: Proxima }> {
  const antes = await obterEstado(txn, exercicio.id);
  const proxima = calcularProxima(antes, realizado, configDoExercicio(exercicio));

  const registro = await inserirRegistro(txn, {
    sessaoId: contexto.sessaoId,
    exercicioId: exercicio.id,
    // Em "Pulei" o estado não muda, então a carga dele é a da meta pulada.
    cargaKg: realizado === 'PULOU' ? proxima.estado.cargaKg : realizado.cargaKg,
    reps: realizado === 'PULOU' ? [] : realizado.reps,
    resultado: resultadoDoEvento(proxima.evento),
    metaCargaKg: antes?.cargaKg ?? null,
    metaReps: antes?.repsAlvo ?? null,
    origem: contexto.origem,
  });

  // "Pulei" não gera evento: o cartão continua explicando a meta anterior.
  if (proxima.evento !== 'sem_mudanca') {
    await salvarEstado(txn, exercicio.id, proxima.estado);
    await inserirEvento(txn, exercicio.id, registro.id, contexto.data, descreverMudanca(antes, proxima));
  }
  return { registro, proxima };
}

export interface CargaAtual {
  cargaKg: number;
  reps: number; // feitas em todas as séries
}

// Exercício novo no fim do treino. A carga atual vira o registro de
// onboarding, a "última sessão" de onde o motor calcula a primeira meta (§3.1).
// Recebe a transação de quem chama; para uso direto, ver cadastrarExercicio.
export async function gravarExercicioNovo(
  txn: SQLiteDatabase,
  treinoId: string,
  novo: NovoExercicio,
  atual: CargaAtual,
  data: string,
): Promise<Exercicio> {
  const exercicio = await inserirExercicio(txn, novo);
  await vincularExercicioAoTreino(txn, treinoId, exercicio.id, await proximaOrdem(txn, treinoId));
  const reps = Array.from({ length: novo.seriesAlvo }, () => atual.reps);
  await aplicarRealizado(txn, exercicio, { cargaKg: atual.cargaKg, reps }, { origem: 'onboarding', sessaoId: null, data });
  return exercicio;
}

export async function cadastrarExercicio(
  db: SQLiteDatabase,
  treinoId: string,
  novo: NovoExercicio,
  atual: CargaAtual,
  data: string,
): Promise<Exercicio> {
  return emTransacao(db, (txn) => gravarExercicioNovo(txn, treinoId, novo, atual, data));
}

// Põe no fim do treino um exercício que já existe (ex.: o mesmo agachamento
// no Legs e no Lower). A progressão é uma só, então nada mais muda.
export async function adicionarExercicioExistente(
  db: SQLiteDatabase,
  treinoId: string,
  exercicioId: string,
): Promise<void> {
  await emTransacao(db, async (txn) => {
    await vincularExercicioAoTreino(txn, treinoId, exercicioId, await proximaOrdem(txn, treinoId));
  });
}

// Troca o exercício de lugar com o vizinho (-1 = sobe, +1 = desce) e
// renumera o treino inteiro de 1 em diante, fechando buracos na ordem.
export async function moverExercicio(
  db: SQLiteDatabase,
  treinoId: string,
  exercicioId: string,
  direcao: -1 | 1,
): Promise<void> {
  await emTransacao(db, async (txn) => {
    const ids = (await listarExerciciosDoTreino(txn, treinoId)).map((e) => e.id);
    const de = ids.indexOf(exercicioId);
    const para = de + direcao;
    if (de === -1 || para < 0 || para >= ids.length) {
      return;
    }
    [ids[de], ids[para]] = [ids[para], ids[de]];
    for (const [indice, id] of ids.entries()) {
      await definirOrdem(txn, treinoId, id, indice + 1);
    }
  });
}
