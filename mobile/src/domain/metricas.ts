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
