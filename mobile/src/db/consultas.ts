// Leituras que juntam várias tabelas para montar uma tela inteira de uma vez.

import type { SQLiteDatabase } from 'expo-sqlite';

import { diaDaSemana, inicioDaSemana, somarDias } from '@/domain/datas';
import { proximoTreino, treinoPerdido, type ProximoTreino, type TreinoIdentificado } from '@/domain/hoje';
import {
  pontosDeForca,
  resumirGrupos,
  seriesDaSemana,
  variacaoDoExercicio,
  type ResumoDoGrupo,
} from '@/domain/metricas';
import type { EstadoProgressao, Evento, MudancaDeMeta } from '@/domain/tipos';

import { listarEstados } from './repositorios/estadoProgressao';
import { listarTiposDaSessao, listarUltimasMudancas } from './repositorios/eventos';
import { listarExercicios, listarExerciciosDoTreino, type Exercicio } from './repositorios/exercicios';
import {
  contarRegistrosDaData,
  contarSessoesComRegistroDesde,
  listarHistorico,
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

// União discriminada pelo campo `tipo`: dia de treino ou de descanso. Os
// dois podem trazer o aviso de treino perdido (§3.5).
export type Hoje = { perdido: TreinoIdentificado | null } & (
  | {
      tipo: 'treino';
      treino: Treino;
      sessao: Sessao | null;
      itens: ItemDoTreino[];
      tiposDaSessao: Evento[]; // para o resumo ao finalizar
    }
  | { tipo: 'descanso'; proximo: ProximoTreino | null; treinosNaSemana: number; seriesNaSemana: number }
);

async function buscarTreinoPerdido(db: SQLiteDatabase, hoje: string, treinoDeHojeId: string | null) {
  const ontem = somarDias(hoje, -1);
  const [treinoDeOntem, registrosDeOntem, sessaoDeHoje] = await Promise.all([
    obterTreinoDoDia(db, diaDaSemana(ontem)),
    contarRegistrosDaData(db, ontem),
    obterSessaoDaData(db, hoje),
  ]);
  return treinoPerdido(
    treinoDeOntem === null ? null : { id: treinoDeOntem.id, nome: treinoDeOntem.nome },
    registrosDeOntem > 0,
    sessaoDeHoje !== null,
    treinoDeHojeId,
  );
}

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
  const perdido = await buscarTreinoPerdido(db, hoje, treino?.id ?? null);

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
      perdido,
      proximo: proximoTreino(
        divisao.map((d) => ({ diaSemana: d.diaSemana, nome: d.treino.nome })),
        hoje,
      ),
      treinosNaSemana,
      seriesNaSemana: Object.values(porGrupo).reduce((total, n) => total + n, 0),
    };
  }

  const sessao = await obterSessaoDoTreino(db, hoje, treino.id);
  const [exercicios, estados, mudancas, feitos, tiposDaSessao] = await Promise.all([
    listarExerciciosDoTreino(db, treino.id),
    listarEstados(db),
    listarUltimasMudancas(db),
    sessao === null ? Promise.resolve([]) : listarRegistrosDaSessao(db, sessao.id),
    sessao === null ? Promise.resolve([]) : listarTiposDaSessao(db, sessao.id),
  ]);
  // Se o mesmo exercício foi registrado duas vezes na sessão, vale o último.
  const feitoPorExercicio = new Map(feitos.map((r) => [r.exercicioId, r]));

  return {
    tipo: 'treino',
    perdido,
    treino,
    sessao,
    tiposDaSessao,
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

export interface ExercicioNaEvolucao {
  exercicio: Exercicio;
  estado: EstadoProgressao | null;
  variacao: number | null; // ~4 semanas (§7)
  sessoes: number; // quantas sessões no histórico (com o onboarding)
}

export interface Evolucao {
  grupos: ResumoDoGrupo[];
  exercicios: ExercicioNaEvolucao[];
}

// Tudo o que a aba Evolução e a tela do grupo mostram (§3.6). Só exercícios
// ativos; o histórico dos arquivados continua guardado.
export async function carregarEvolucao(db: SQLiteDatabase, hoje: string): Promise<Evolucao> {
  const [todos, historico, estados] = await Promise.all([listarExercicios(db), listarHistorico(db), listarEstados(db)]);
  const exercicios = todos.filter((exercicio) => exercicio.ativo);
  const pesoCorporal = (exercicio: Exercicio) => exercicio.equipamento === 'peso_corporal';

  return {
    grupos: resumirGrupos(
      exercicios.map((e) => ({ id: e.id, grupoMuscular: e.grupoMuscular, pesoCorporal: pesoCorporal(e) })),
      historico,
      hoje,
    ),
    exercicios: exercicios.map((exercicio) => {
      const sessoes = historico.filter((sessao) => sessao.exercicioId === exercicio.id);
      return {
        exercicio,
        estado: estados.get(exercicio.id) ?? null,
        variacao: variacaoDoExercicio(pontosDeForca(sessoes, pesoCorporal(exercicio))),
        sessoes: sessoes.length,
      };
    }),
  };
}
