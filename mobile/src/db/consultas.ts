// Leituras que juntam várias tabelas para montar uma tela inteira de uma vez.

import type { SQLiteDatabase } from 'expo-sqlite';

import { diaDaSemana, inicioDaSemana } from '@/domain/datas';
import { proximoTreino, type ProximoTreino } from '@/domain/hoje';
import { seriesDaSemana } from '@/domain/metricas';
import type { EstadoProgressao, MudancaDeMeta } from '@/domain/tipos';

import { listarEstados } from './repositorios/estadoProgressao';
import { listarUltimasMudancas } from './repositorios/eventos';
import { listarExerciciosDoTreino, type Exercicio } from './repositorios/exercicios';
import {
  contarSessoesComRegistroDesde,
  listarRegistrosDaSessao,
  listarSeriesDesde,
  type Registro,
} from './repositorios/registros';
import { obterSessaoDaData, obterSessaoDoTreino, type Sessao } from './repositorios/sessoes';
import { listarTreinosPorDia, obterTreino, obterTreinoDoDia, type Treino } from './repositorios/treinos';

export interface ItemDoTreino {
  exercicio: Exercicio;
  estado: EstadoProgressao | null; // a meta de agora
  mudanca: MudancaDeMeta | null; // o evento que produziu a meta
  feitoHoje: Registro | null; // o check-in desta sessão, se já houve
}

export type Hoje =
  | { tipo: 'treino'; treino: Treino; sessao: Sessao | null; itens: ItemDoTreino[] }
  | { tipo: 'descanso'; proximo: ProximoTreino | null; treinosNaSemana: number; seriesNaSemana: number };

// Qual treino a aba Hoje mostra, em ordem de prioridade:
// 1. o que a pessoa escolheu na hora (ex.: "Fazer hoje?" do treino perdido);
// 2. o que ela já começou hoje (tem sessão), mesmo que não seja o do dia;
// 3. o treino do dia da semana.
async function idDoTreinoDeHoje(db: SQLiteDatabase, hoje: string, escolhido: string | null) {
  if (escolhido !== null) {
    return escolhido;
  }
  const sessao = await obterSessaoDaData(db, hoje);
  if (sessao?.treinoId) {
    return sessao.treinoId;
  }
  return (await obterTreinoDoDia(db, diaDaSemana(hoje)))?.id ?? null;
}

export async function carregarHoje(db: SQLiteDatabase, hoje: string, escolhido: string | null): Promise<Hoje> {
  const treinoId = await idDoTreinoDeHoje(db, hoje, escolhido);
  const treino = treinoId === null ? null : await obterTreino(db, treinoId);

  if (treino === null) {
    const semana = inicioDaSemana(hoje);
    const [divisao, treinosNaSemana, series] = await Promise.all([
      listarTreinosPorDia(db),
      contarSessoesComRegistroDesde(db, semana),
      listarSeriesDesde(db, semana),
    ]);
    const porGrupo = seriesDaSemana(series, hoje);
    return {
      tipo: 'descanso',
      proximo: proximoTreino(
        divisao.map((d) => ({ diaSemana: d.diaSemana, nome: d.treino.nome })),
        hoje,
      ),
      treinosNaSemana,
      seriesNaSemana: Object.values(porGrupo).reduce((total, n) => total + n, 0),
    };
  }

  const sessao = await obterSessaoDoTreino(db, hoje, treino.id);
  const [exercicios, estados, mudancas, feitos] = await Promise.all([
    listarExerciciosDoTreino(db, treino.id),
    listarEstados(db),
    listarUltimasMudancas(db),
    sessao === null ? Promise.resolve([]) : listarRegistrosDaSessao(db, sessao.id),
  ]);
  // Se o mesmo exercício foi registrado duas vezes na sessão, vale o último.
  const feitoPorExercicio = new Map(feitos.map((r) => [r.exercicioId, r]));

  return {
    tipo: 'treino',
    treino,
    sessao,
    itens: exercicios
      .filter((exercicio) => exercicio.ativo)
      .map((exercicio) => ({
        exercicio,
        estado: estados.get(exercicio.id) ?? null,
        mudanca: mudancas.get(exercicio.id) ?? null,
        feitoHoje: feitoPorExercicio.get(exercicio.id) ?? null,
      })),
  };
}
