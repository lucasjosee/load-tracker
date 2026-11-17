// Leituras que juntam várias tabelas para montar uma tela inteira de uma vez.

import type { SQLiteDatabase } from 'expo-sqlite';

import { diaDaSemana, inicioDaSemana, somarDias } from '@/domain/datas';
import {
  outroTreinoDoDia,
  proximoTreino,
  treinoDeHojeOuProximo,
  treinoPerdido,
  type ProximoTreino,
  type TreinoIdentificado,
  faixaDaSemana,
  type DiaDaFaixa,
} from '@/domain/hoje';
import {
  contarAumentosDeCargaNoMes,
  datasComRegistro,
  evolucaoDaForca,
  fimDasSemanas,
  detectarEstagnacao,
  ehRecordeDeCarga,
  pontosDeForca,
  resumirGrupos,
  seriesDaSemana,
  variacaoDoExercicio,
  type Estagnacao,
  type PontoDeEvolucao,
  type ResumoDoGrupo,
} from '@/domain/metricas';
import type { EstadoProgressao, Evento, MudancaDeMeta } from '@/domain/tipos';

import { obterConfig } from './repositorios/config';
import { listarEstados, obterEstado } from './repositorios/estadoProgressao';
import { listarEventos, listarTiposDaSessao, listarUltimasMudancas, type EventoSalvo } from './repositorios/eventos';
import { listarExercicios, listarExerciciosDoTreino, obterExercicio, type Exercicio } from './repositorios/exercicios';
import {
  contarRegistrosDaData,
  contarSessoesComRegistroDesde,
  listarDatasComRegistroDesde,
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
  // O registro mais recente do exercício (fora "Pulei"), para o painel
  // Ajustar. Enquanto não há check-in hoje, é a sessão anterior.
  ultimaSessao: SessaoDoHistorico | null;
  recordeHoje: boolean; // o check-in de hoje usou a maior carga do histórico (§7)
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

// O que `evolucaoDaForca` precisa saber de cada exercício.
function paraEvolucao(exercicios: readonly Exercicio[]) {
  return exercicios.map((exercicio) => ({ id: exercicio.id, pesoCorporal: exercicio.equipamento === 'peso_corporal' }));
}

// União discriminada pelo campo `tipo`: dia de treino ou de descanso. Os
// dois podem trazer o aviso de treino perdido (§3.5).
export type Hoje = { perdido: TreinoIdentificado | null } & (
  | {
      tipo: 'treino';
      treino: Treino;
      // O treino do dia da semana, quando o mostrado é outro (ex.: o perdido de ontem).
      treinoDoDia: TreinoIdentificado | null;
      sessao: Sessao | null;
      itens: ItemDoTreino[];
      tiposDaSessao: Evento[]; // para o resumo ao finalizar
      evolucao: PontoDeEvolucao[]; // força dos exercícios deste treino, um ponto por sessão (§7)
    }
  | {
      tipo: 'descanso';
      proximo: ProximoTreino | null;
      treinosNaSemana: number;
      seriesNaSemana: number;
      semana: DiaDaFaixa[]; // segunda a domingo
      evolucao: PontoDeEvolucao[]; // força de todos os exercícios, um ponto por semana (§7)
    }
);

// Tela de fecho do onboarding (§3.1, passo 4): o primeiro treino da pessoa
// (o de hoje, se hoje for dia de treino) com a meta que o motor calculou
// para cada exercício quando a divisão foi gravada.
export interface PrimeiraMeta {
  nome: string | null; // o nome informado no perfil
  proximo: ProximoTreino | null; // null = nenhum treino tem dia da semana
  itens: { exercicio: Exercicio; estado: EstadoProgressao | null }[];
}

export async function carregarPrimeiraMeta(db: SQLiteDatabase, hoje: string): Promise<PrimeiraMeta> {
  const [nome, divisao, estados] = await Promise.all([obterConfig(db, 'nome'), listarTreinosPorDia(db), listarEstados(db)]);
  const proximo = treinoDeHojeOuProximo(
    divisao.map((d) => ({ diaSemana: d.diaSemana, nome: d.treino.nome })),
    hoje,
  );
  const treino = divisao.find((d) => d.diaSemana === proximo?.diaSemana)?.treino ?? null;
  const exercicios = treino === null ? [] : await listarExerciciosDoTreino(db, treino.id);
  return {
    nome,
    proximo,
    itens: exercicios.map((exercicio) => ({ exercicio, estado: estados.get(exercicio.id) ?? null })),
  };
}

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
    const [divisao, treinosNaSemana, series, datasTreinadas, todos, historico] = await Promise.all([
      listarTreinosPorDia(db),
      contarSessoesComRegistroDesde(db, semana),
      listarSeriesDesde(db, semana),
      listarDatasComRegistroDesde(db, semana),
      listarExercicios(db),
      listarHistorico(db),
    ]);
    const porGrupo = seriesDaSemana(series, hoje);
    const ativos = todos.filter((exercicio) => exercicio.ativo);
    const datas = datasComRegistro(
      historico,
      ativos.map((exercicio) => exercicio.id),
    );
    return {
      tipo: 'descanso',
      perdido,
      proximo: proximoTreino(
        divisao.map((d) => ({ diaSemana: d.diaSemana, nome: d.treino.nome })),
        hoje,
      ),
      treinosNaSemana,
      seriesNaSemana: Object.values(porGrupo).reduce((total, n) => total + n, 0),
      semana: faixaDaSemana(
        hoje,
        divisao.map((d) => d.diaSemana),
        datasTreinadas,
      ),
      evolucao: datas.length === 0 ? [] : evolucaoDaForca(paraEvolucao(ativos), historico, fimDasSemanas(datas[0], hoje)),
    };
  }

  const sessao = await obterSessaoDoTreino(db, hoje, treino.id);
  const [doDia, exercicios, estados, mudancas, feitos, tiposDaSessao, historico] = await Promise.all([
    obterTreinoDoDia(db, diaDaSemana(hoje)),
    listarExerciciosDoTreino(db, treino.id),
    listarEstados(db),
    listarUltimasMudancas(db),
    sessao === null ? Promise.resolve([]) : listarRegistrosDaSessao(db, sessao.id),
    sessao === null ? Promise.resolve([]) : listarTiposDaSessao(db, sessao.id),
    listarHistorico(db),
  ]);
  const ativos = exercicios.filter((exercicio) => exercicio.ativo);
  // Se o mesmo exercício foi registrado duas vezes na sessão, vale o último.
  const feitoPorExercicio = new Map(feitos.map((r) => [r.exercicioId, r]));

  return {
    tipo: 'treino',
    perdido,
    treino,
    treinoDoDia: outroTreinoDoDia(treino.id, doDia === null ? null : { id: doDia.id, nome: doDia.nome }),
    sessao,
    tiposDaSessao,
    evolucao: evolucaoDaForca(
      paraEvolucao(ativos),
      historico,
      datasComRegistro(
        historico,
        ativos.map((exercicio) => exercicio.id),
      ),
    ),
    itens: ativos.map((exercicio) => {
        const estado = estados.get(exercicio.id) ?? null;
        // O histórico vem do mais antigo para o mais recente.
        const sessoes = historico.filter((sessao) => sessao.exercicioId === exercicio.id);
        const feitoHoje = feitoPorExercicio.get(exercicio.id) ?? null;
        // Com check-in hoje (fora "Pulei"), ele é a última sessão do
        // histórico: as anteriores são todas menos ela.
        const fezHoje = feitoHoje !== null && feitoHoje.resultado !== 'pulou';
        return {
          exercicio,
          estado,
          mudanca: mudancas.get(exercicio.id) ?? null,
          feitoHoje,
          ultimaSessao: sessoes[sessoes.length - 1] ?? null,
          recordeHoje:
            fezHoje &&
            ehRecordeDeCarga(
              feitoHoje.cargaKg,
              sessoes.slice(0, -1).map((sessao) => sessao.cargaKg),
            ),
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
  forcas: number[]; // força estimada de cada sessão, em ordem: o minigráfico
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
      const pontos = pontosDeForca(sessoes, pesoCorporal(exercicio));
      return {
        exercicio,
        estado,
        variacao: variacaoDoExercicio(pontos),
        sessoes: sessoes.length,
        forcas: pontos.map((ponto) => ponto.valor),
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
