import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useEffect } from 'react';

import { listarSessoesDaData } from '@/db/repositorios/sessoes';
import { paraDataLocal } from '@/domain/datas';
import { textoDoTreinoEmAndamento, type TreinoEmAndamento } from '@/domain/notificacoes';

import { lerPermissao } from './permissao';

// A notificação do treino em andamento (§6): fica na central de notificações e
// na tela bloqueada enquanto o treino acontece, com o exercício da vez e a
// meta dele. É a única notificação que não passa pelo `reagendarNotificacoes()`
// (exceção da regra 8): ela não é agendada para depois, aparece na hora e é
// trocada a cada exercício.
//
// O id é sempre o mesmo. No iOS, uma notificação nova com o id de uma que já
// está na central toma o lugar dela: a pessoa vê uma só, atualizada.
export const ID_DO_TREINO_EM_ANDAMENTO = 'treino-em-andamento';

// As chamadas ao iOS são assíncronas. Sem a fila, um "tirar" logo depois de
// um "mostrar" podia terminar antes dele, e a notificação ficaria na central
// depois do fim do treino. Cada chamada espera a anterior acabar.
let fila: Promise<void> = Promise.resolve();

function naFila(acao: () => Promise<void>): Promise<void> {
  fila = fila.then(acao).catch((erro: unknown) => {
    // Notificação é um extra: falhar aqui não pode atrapalhar o treino.
    console.warn('Não foi possível atualizar a notificação do treino', erro);
  });
  return fila;
}

function mostrar(treinoId: string, titulo: string, corpo: string): Promise<void> {
  return naFila(async () => {
    if ((await lerPermissao()) !== 'concedida') {
      return;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: ID_DO_TREINO_EM_ANDAMENTO,
      content: {
        title: titulo,
        body: corpo,
        sound: false,
        data: { treinoId }, // tocar abre a tela do treino (AoAbrirOApp.tsx)
      },
      trigger: null, // agora
    });
  });
}

export function tirarTreinoEmAndamento(): Promise<void> {
  return naFila(() => Notifications.dismissNotificationAsync(ID_DO_TREINO_EM_ANDAMENTO));
}

// Ao abrir o app: se não há treino aberto hoje, a notificação de um treino
// que ficou sem encerrar (o app foi fechado no meio) sai da central.
export async function tirarTreinoEmAndamentoSeAcabou(db: SQLiteDatabase): Promise<void> {
  const sessoes = await listarSessoesDaData(db, paraDataLocal(new Date()));
  if (!sessoes.some((sessao) => sessao.finalizadaEm === null)) {
    await tirarTreinoEmAndamento();
  }
}

interface Props {
  treinoId: string;
  treino: TreinoEmAndamento;
}

// Não desenha nada: mantém a notificação igual ao que a tela do treino
// mostra. Só fala com o iOS quando o texto muda (as dependências do efeito são
// o título e o corpo), não a cada vez que a tela é desenhada.
//
// Sair da tela não tira a notificação: o treino continua aberto. Quem tira é
// quem encerra o treino (app/sessao.tsx).
export function NotificacaoDoTreino({ treinoId, treino }: Props) {
  const { titulo, corpo } = textoDoTreinoEmAndamento(treino);
  useEffect(() => {
    mostrar(treinoId, titulo, corpo);
  }, [treinoId, titulo, corpo]);
  return null;
}
