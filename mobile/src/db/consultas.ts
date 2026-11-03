// Leituras que juntam várias tabelas para montar uma tela inteira de uma vez.

import type { SQLiteDatabase } from 'expo-sqlite';

import { diaDaSemana, inicioDaSemana, somarDias } from '@/domain/datas';
import { proximoTreino, treinoPerdido, type ProximoTreino, type TreinoIdentificado } from '@/domain/hoje';
import {
  contarAumentosDeCargaNoMes,
  detectarEstagnacao,
  pontosDeForca,
  resumirGrupos,
  seriesDaSemana,
  variacaoDoExercicio,
  type Estagnacao,
  type ResumoDoGrupo,
} from '@/domain/metricas';
import type { EstadoProgressao, Evento, MudancaDeMeta } from '@/domain/tipos';

import { listarEstados, obterEstado } from './repositorios/estadoProgressao';
import { listarEventos, listarTiposDaSessao, listarUltimasMudancas, type EventoSalvo } from './repositorios/eventos';
import { listarExercicios, listarExerciciosDoTreino, obterExercicio, type Exercicio } from './repositorios/exercicios';
import {
  contarRegistrosDaData,
  contarSessoesComRegistroDesde,
  listarHistorico,
  listarRegistrosDaSessao,
  type SessaoDoHistorico,
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
  estagnacao: Estagnacao | null; // alerta da §7 (tarefa 5.3)
}

// Estagnação de um exercício (§7), a partir do estado e do histórico dele.
function estagnacaoDe(
  exercicio: Exercicio,
  estado: EstadoProgressao | null,
  historico: readonly SessaoDoHistorico[],
): Estagnacao | null {
  const sessoes = historico.filter((sessao) => sessao.exercicioId === exercicio.id);
  const forcas = pontosDeForca(sessoes, exercicio.equipamento === 'peso_corporal').map((ponto) => ponto.valor);
  return detectarEstagnacao(estado?.falhas ?? 0, forcas);
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
  const [exercicios, estados, mudancas, feitos, tiposDaSessao, historico] = await Promise.all([
    listarExerciciosDoTreino(db, treino.id),
    listarEstados(db),
    listarUltimasMudancas(db),
    sessao === null ? Promise.resolve([]) : listarRegistrosDaSessao(db, sessao.id),
    sessao === null ? Promise.resolve([]) : listarTiposDaSessao(db, sessao.id),
    listarHistorico(db),
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
      .map((exercicio) => {
        const estado = estados.get(exercicio.id) ?? null;
        return {
          exercicio,
          estado,
          mudanca: mudancas.get(exercicio.id) ?? null,
          feitoHoje: feitoPorExercicio.get(exercicio.id) ?? null,
          estagnacao: estagnacaoDe(exercicio, estado, historico),
        };
      }),
  };
}

export interface ExercicioNaEvolucao {
  exercicio: Exercicio;
  estado: EstadoProgressao | null;
  variacao: number | null; // ~4 semanas (§7)
  sessoes: number; // quantas sessões no histórico (com o onboarding)
  estagnacao: Estagnacao | null;
}

export interface Evolucao {
  grupos: ResumoDoGrupo[];
  exercicios: ExercicioNaEvolucao[];
  aumentosNoMes: number;
}

// Tudo o que a aba Evolução e a tela do grupo mostram (§3.6). Só exercícios
// ativos; o histórico dos arquivados continua guardado.
export async function carregarEvolucao(db: SQLiteDatabase, hoje: string): Promise<Evolucao> {
  const [todos, historico, estados, eventos] = await Promise.all([
    listarExercicios(db),
    listarHistorico(db),
    listarEstados(db),
    listarEventos(db),
  ]);
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
      const estado = estados.get(exercicio.id) ?? null;
      return {
        exercicio,
        estado,
        variacao: variacaoDoExercicio(pontosDeForca(sessoes, pesoCorporal(exercicio))),
        sessoes: sessoes.length,
        estagnacao: estagnacaoDe(exercicio, estado, historico),
      };
    }),
    // O evento do onboarding (sem meta anterior) é o ponto de partida, não um aumento.
    aumentosNoMes: contarAumentosDeCargaNoMes(
      eventos.filter((evento) => evento.cargaDe !== null),
      hoje,
    ),
  };
}

export interface DetalheDoExercicio {
  exercicio: Exercicio;
  estado: EstadoProgressao | null;
  sessoes: SessaoDoHistorico[]; // em ordem cronológica
  eventos: EventoSalvo[]; // em ordem cronológica
}

// Tela de detalhe do exercício (§3.6): histórico para os gráficos e eventos
// para a linha do tempo.
export async function carregarDetalhe(db: SQLiteDatabase, id: string): Promise<DetalheDoExercicio | null> {
  const exercicio = await obterExercicio(db, id);
  if (exercicio === null) {
    return null;
  }
  const [estado, historico, eventos] = await Promise.all([obterEstado(db, id), listarHistorico(db), listarEventos(db, id)]);
  return { exercicio, estado, sessoes: historico.filter((sessao) => sessao.exercicioId === id), eventos };
}
