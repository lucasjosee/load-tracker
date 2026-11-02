import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';

import { obterConfig } from '@/db/repositorios/config';
import { listarEstados } from '@/db/repositorios/estadoProgressao';
import { listarUltimasMudancas } from '@/db/repositorios/eventos';
import { listarExerciciosDoTreino } from '@/db/repositorios/exercicios';
import { obterSessaoDaData } from '@/db/repositorios/sessoes';
import { listarTreinosPorDia } from '@/db/repositorios/treinos';
import { paraDataLocal, paraInstanteLocal } from '@/domain/datas';
import { HORARIO_PADRAO_DO_AVISO, lerHorario } from '@/domain/horario';
import { planejarNotificacoes, type TreinoDoAviso } from '@/domain/notificacoes';

import { lerPermissao } from './permissao';

// Monta, para cada dia da semana, o treino com as metas atuais.
async function carregarDivisao(db: SQLiteDatabase): Promise<Map<number, TreinoDoAviso>> {
  const [porDia, estados, mudancas] = await Promise.all([
    listarTreinosPorDia(db),
    listarEstados(db),
    listarUltimasMudancas(db),
  ]);
  const divisao = new Map<number, TreinoDoAviso>();
  for (const { diaSemana, treino } of porDia) {
    const exercicios = await listarExerciciosDoTreino(db, treino.id);
    const itens = exercicios.flatMap((exercicio) => {
      const estado = estados.get(exercicio.id);
      // Exercício inativo ou sem meta não entra no texto.
      return exercicio.ativo && estado !== undefined
        ? [{ nome: exercicio.nome, estado, mudanca: mudancas.get(exercicio.id) ?? null }]
        : [];
    });
    divisao.set(diaSemana, { nome: treino.nome, itens });
  }
  return divisao;
}

// O ÚNICO lugar do app que agenda notificações (regra 8): cancela tudo e
// agenda de novo os próximos 7 dias com as metas de agora. Chamada ao abrir
// o app, ao finalizar o treino e ao mudar a divisão ou o horário (§6).
//
// Os textos são calculados na hora de agendar; como as metas só mudam no
// check-in, e finalizar o treino reagenda, eles ficam sempre certos.
export async function reagendarNotificacoes(db: SQLiteDatabase): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if ((await lerPermissao()) !== 'concedida') {
      return; // sem permissão o app funciona igual, só não avisa
    }

    const agora = new Date();
    const hoje = paraDataLocal(agora);
    const [divisao, horarioSalvo, sessaoDeHoje] = await Promise.all([
      carregarDivisao(db),
      obterConfig(db, 'horario_notificacao'),
      obterSessaoDaData(db, hoje),
    ]);

    const plano = planejarNotificacoes({
      hoje,
      agora: { hora: agora.getHours(), minuto: agora.getMinutes() },
      horarioDoAviso: lerHorario(horarioSalvo ?? '') ?? HORARIO_PADRAO_DO_AVISO,
      treinoDoDia: (dia) => divisao.get(dia) ?? null,
      treinoDeHojeFinalizado: sessaoDeHoje !== null && sessaoDeHoje.finalizadaEm !== null,
    });

    for (const notificacao of plano) {
      await Notifications.scheduleNotificationAsync({
        // Mesmo id = substitui. Se duas chamadas se cruzarem, não duplicam.
        identifier: notificacao.id,
        content: {
          title: notificacao.titulo,
          body: notificacao.corpo,
          data: { url: '/' }, // tocar abre a aba Hoje (tarefa 3.3)
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: paraInstanteLocal(notificacao.data, notificacao.horario.hora, notificacao.horario.minuto),
        },
      });
    }
  } catch (erro) {
    // Falhar ao agendar não pode travar o check-in nem a edição da divisão:
    // o próximo reagendamento (ao abrir o app) tenta de novo.
    console.warn('Não foi possível reagendar as notificações', erro);
  }
}
