// Métricas de evolução (§7). Funções puras: recebem o histórico já lido do
// banco e devolvem números; quem formata para a tela é textos.ts.

import { inicioDaSemana, somarDias } from './datas';
import { GRUPOS_MUSCULARES, type Evento, type GrupoMuscular } from './tipos';

// Uma sessão de um exercício: a mesma carga em todas as séries.
export interface SessaoDoExercicio {
  data: string; // 'YYYY-MM-DD'
  cargaKg: number;
  reps: number[];
}

export interface PontoDeForca {
  data: string;
  valor: number;
}

// Força estimada para 1 repetição, pela fórmula de Epley.
// Ex.: 10 kg × 8 = 12,67. Sobe também quando só as reps sobem, o que deixa o
// progresso visível toda semana, antes de a carga mudar.
export function e1rm(cargaKg: number, reps: number): number {
  return cargaKg * (1 + reps / 30);
}

// Força de uma sessão pela melhor série. Em peso corporal a carga é 0 e o
// e1RM daria sempre 0, então a medida é o total de reps da sessão (§7).
export function forcaDaSessao(sessao: SessaoDoExercicio, pesoCorporal: boolean): number {
  if (sessao.reps.length === 0) {
    return 0;
  }
  if (pesoCorporal) {
    return sessao.reps.reduce((total, reps) => total + reps, 0);
  }
  return e1rm(sessao.cargaKg, Math.max(...sessao.reps));
}

export const DIAS_DA_JANELA = 28; // "~4 semanas" da §7

// Variação da força: última sessão contra a de ~4 semanas antes, ou contra a
// primeira se o histórico for mais curto. 0,08 = +8%.
// `pontos` em ordem cronológica. Devolve null quando não há o que comparar.
export function variacaoDoExercicio(pontos: readonly PontoDeForca[]): number | null {
  if (pontos.length < 2) {
    return null;
  }
  const ultimo = pontos[pontos.length - 1];
  const limite = somarDias(ultimo.data, -DIAS_DA_JANELA);
  // A sessão mais recente entre as que têm ~4 semanas ou mais em relação à
  // última. Se nenhuma tiver, fica a primeira.
  let referencia = pontos[0];
  for (const ponto of pontos) {
    if (ponto.data <= limite) {
      referencia = ponto;
    }
  }
  if (referencia.valor === 0) {
    return null; // sem base para uma porcentagem
  }
  return (ultimo.valor - referencia.valor) / referencia.valor;
}

// Média das variações dos exercícios do grupo; quem não tem variação fica de fora.
export function variacaoDoGrupo(variacoes: readonly (number | null)[]): number | null {
  const validas = variacoes.filter((variacao): variacao is number => variacao !== null);
  if (validas.length === 0) {
    return null;
  }
  return validas.reduce((soma, variacao) => soma + variacao, 0) / validas.length;
}

export interface SeriesRegistradas {
  data: string;
  grupoMuscular: GrupoMuscular;
  series: number;
}

// Séries feitas por grupo na semana de `hoje` (segunda a domingo). Todo grupo
// aparece no resultado, com 0 se não foi treinado.
export function seriesDaSemana(
  registros: readonly SeriesRegistradas[],
  hoje: string,
): Record<GrupoMuscular, number> {
  const inicio = inicioDaSemana(hoje);
  const fim = somarDias(inicio, 6);
  const total = Object.fromEntries(GRUPOS_MUSCULARES.map((grupo) => [grupo, 0])) as Record<
    GrupoMuscular,
    number
  >;
  for (const registro of registros) {
    if (registro.data >= inicio && registro.data <= fim) {
      total[registro.grupoMuscular] += registro.series;
    }
  }
  return total;
}

export const FALHAS_PARA_ESTAGNACAO = 2;
export const SESSOES_PARA_ESTAGNACAO = 3;

export type Estagnacao =
  | { motivo: 'falhas'; falhas: number }
  | { motivo: 'sem_aumento'; sessoes: number };

// Estagnação (§7): 2+ falhas seguidas, ou nenhuma das últimas 3 sessões com
// força maior que a da sessão anterior a elas. `forcas` em ordem cronológica.
export function detectarEstagnacao(falhas: number, forcas: readonly number[]): Estagnacao | null {
  if (falhas >= FALHAS_PARA_ESTAGNACAO) {
    return { motivo: 'falhas', falhas };
  }
  if (forcas.length > SESSOES_PARA_ESTAGNACAO) {
    const ultimas = forcas.slice(-SESSOES_PARA_ESTAGNACAO);
    const anterior = forcas[forcas.length - SESSOES_PARA_ESTAGNACAO - 1];
    if (Math.max(...ultimas) <= anterior) {
      return { motivo: 'sem_aumento', sessoes: SESSOES_PARA_ESTAGNACAO };
    }
  }
  return null;
}

// Recorde de carga (§7): a pessoa usou uma carga maior que todas as que já
// tinha usado naquele exercício. `cargasAnteriores` são as das sessões de
// antes, em qualquer ordem.
//
// Por que carga e não força estimada: na dupla progressão o e1RM sobe a cada
// rep a mais, então quase todo "Bati" seria recorde e o aviso não diria nada.
// A carga máxima só é passada de tempos em tempos, e voltar de um deload à
// carga de antes não conta.
//
// Sem histórico não há o que superar (a primeira sessão é o ponto de
// partida), e em peso corporal a carga é sempre 0, então nunca há recorde.
export function ehRecordeDeCarga(cargaKg: number, cargasAnteriores: readonly number[]): boolean {
  return cargasAnteriores.length > 0 && cargaKg > Math.max(...cargasAnteriores);
}

export interface EventoDatado {
  data: string;
  tipo: Evento;
}

// Aumentos de carga no mês de `hoje`, para a frase "Este mês: 6 aumentos de carga".
export function contarAumentosDeCargaNoMes(eventos: readonly EventoDatado[], hoje: string): number {
  const mes = hoje.slice(0, 7); // 'YYYY-MM'
  return eventos.filter((evento) => evento.tipo === 'aumento_carga' && evento.data.startsWith(mes))
    .length;
}

// ---------- Aba Evolução (§3.6) ----------

// Uma sessão de um exercício no histórico. O registro de onboarding entra
// como ponto de partida da força, mas não conta como treino nas séries.
export interface SessaoNoHistorico extends SessaoDoExercicio {
  exercicioId: string;
  doOnboarding: boolean;
}

export interface ExercicioDoResumo {
  id: string;
  grupoMuscular: GrupoMuscular;
  pesoCorporal: boolean;
}

// Força de cada sessão, na ordem do histórico.
export function pontosDeForca(sessoes: readonly SessaoDoExercicio[], pesoCorporal: boolean): PontoDeForca[] {
  return sessoes.map((sessao) => ({ data: sessao.data, valor: forcaDaSessao(sessao, pesoCorporal) }));
}

export interface ResumoDoGrupo {
  grupo: GrupoMuscular;
  variacao: number | null; // média das variações dos exercícios do grupo
  seriesNaSemana: number;
  exercicios: number;
}

// Um resumo por grupo muscular que tem exercício, na ordem da §7.
// `historico` em ordem cronológica.
export function resumirGrupos(
  exercicios: readonly ExercicioDoResumo[],
  historico: readonly SessaoNoHistorico[],
  hoje: string,
): ResumoDoGrupo[] {
  const series = seriesDaSemana(
    historico
      .filter((sessao) => !sessao.doOnboarding)
      .flatMap((sessao) => {
        const exercicio = exercicios.find((e) => e.id === sessao.exercicioId);
        return exercicio === undefined
          ? []
          : [{ data: sessao.data, grupoMuscular: exercicio.grupoMuscular, series: sessao.reps.length }];
      }),
    hoje,
  );

  return GRUPOS_MUSCULARES.flatMap((grupo) => {
    const doGrupo = exercicios.filter((e) => e.grupoMuscular === grupo);
    if (doGrupo.length === 0) {
      return [];
    }
    const variacoes = doGrupo.map((exercicio) =>
      variacaoDoExercicio(
        pontosDeForca(
          historico.filter((s) => s.exercicioId === exercicio.id),
          exercicio.pesoCorporal,
        ),
      ),
    );
    return [{ grupo, variacao: variacaoDoGrupo(variacoes), seriesNaSemana: series[grupo], exercicios: doGrupo.length }];
  });
}

// ---------- Gráfico da aba Hoje (§7) ----------

export interface PontoDeEvolucao {
  data: string;
  variacao: number; // contra o começo: 0,12 = +12%
}

// Os dias em que algum dos exercícios tem registro, sem repetir, em ordem.
// São os pontos do gráfico de um treino: um por sessão.
export function datasComRegistro(historico: readonly SessaoNoHistorico[], idsDosExercicios: readonly string[]): string[] {
  const datas = historico.filter((sessao) => idsDosExercicios.includes(sessao.exercicioId)).map((sessao) => sessao.data);
  return [...new Set(datas)].sort();
}

// O último dia (domingo) de cada semana, da semana de `de` até a de `ate`.
// São os pontos do gráfico geral: um por semana.
export function fimDasSemanas(de: string, ate: string): string[] {
  const ultimo = somarDias(inicioDaSemana(ate), 6);
  const fins: string[] = [];
  for (let fim = somarDias(inicioDaSemana(de), 6); fim <= ultimo; fim = somarDias(fim, 7)) {
    fins.push(fim);
  }
  return fins;
}

// Evolução da força de um conjunto de exercícios numa linha só.
//
// Os exercícios têm cargas muito diferentes (supino 22,5 kg, panturrilha
// 115 kg), então somar ou tirar média dos quilos faria o mais pesado mandar
// no gráfico. Por isso cada exercício é comparado com ele mesmo: a força da
// sessão mais recente até aquela data, dividida pela força da primeira sessão
// dele. O ponto é a média dessas razões, menos 1.
//
// Usar "a mais recente até a data" (e não só a do dia) faz um exercício pulado
// num treino continuar valendo o que valia, em vez de derrubar a linha.
// Um exercício que entra depois começa em 0% e puxa a média para baixo no dia
// em que entra; é o preço de não reescrever o passado.
//
// `historico` e `datas` em ordem cronológica. Datas em que nenhum exercício
// tem sessão ainda ficam de fora.
export function evolucaoDaForca(
  exercicios: readonly Pick<ExercicioDoResumo, 'id' | 'pesoCorporal'>[],
  historico: readonly SessaoNoHistorico[],
  datas: readonly string[],
): PontoDeEvolucao[] {
  const forcasPorExercicio = exercicios.map((exercicio) =>
    pontosDeForca(
      historico.filter((sessao) => sessao.exercicioId === exercicio.id),
      exercicio.pesoCorporal,
    ),
  );

  return datas.flatMap((data) => {
    const razoes: number[] = [];
    for (const pontos of forcasPorExercicio) {
      const ateAData = pontos.filter((ponto) => ponto.data <= data);
      const primeiro = ateAData[0];
      const ultimo = ateAData[ateAData.length - 1];
      // Sem sessão até a data, ou com força inicial 0, não há com o que comparar.
      if (primeiro !== undefined && ultimo !== undefined && primeiro.valor > 0) {
        razoes.push(ultimo.valor / primeiro.valor);
      }
    }
    if (razoes.length === 0) {
      return [];
    }
    return [{ data, variacao: razoes.reduce((soma, razao) => soma + razao, 0) / razoes.length - 1 }];
  });
}
