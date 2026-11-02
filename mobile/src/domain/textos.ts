// Textos mostrados ao usuário (§5.5, §7). Ficam no domínio, e não nas telas,
// porque também são usados pelas notificações e porque assim têm teste.

import { diaDaSemana, formatarDiaMes, NOMES_DOS_DIAS } from './datas';
import type { ProximoTreino } from './hoje';
import type { Estagnacao } from './metricas';
import {
  NOMES_DOS_GRUPOS,
  type ConfigExercicio,
  type EstadoProgressao,
  type GrupoMuscular,
  type MudancaDeMeta,
} from './tipos';

// Número no jeito brasileiro, sem zeros sobrando: 12.5 → '12,5'; 10 → '10'.
// Feito à mão em vez de `toLocaleString('pt-BR')` para não depender dos dados
// de idioma do aparelho.
export function formatarNumero(valor: number, casasMaximas = 2): string {
  const fator = 10 ** casasMaximas;
  return String(Math.round(valor * fator) / fator).replace('.', ',');
}

export function formatarKg(kg: number): string {
  return formatarNumero(kg, 2);
}

// 0,08 → '+8%'; -0,031 → '−3%'. O sinal de menos é o tipográfico (−), que
// tem a mesma largura do + e alinha melhor numa lista.
export function formatarPercentual(fracao: number): string {
  const inteiro = Math.round(fracao * 100);
  if (inteiro > 0) {
    return `+${inteiro}%`;
  }
  if (inteiro < 0) {
    return `−${Math.abs(inteiro)}%`;
  }
  return '0%';
}

// Lê um número digitado pelo usuário, aceitando vírgula ou ponto: '12,5' → 12.5.
// Devolve null se o texto não for um número não negativo.
export function lerNumero(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalizado)) {
    return null;
  }
  return Number(normalizado);
}

// '12 kg × 8'. Em peso corporal (carga 0) a carga não diz nada: '13 reps'.
export function textoMeta(estado: Pick<EstadoProgressao, 'cargaKg' | 'repsAlvo'>): string {
  if (estado.cargaKg === 0) {
    return `${estado.repsAlvo} reps`;
  }
  return `${formatarKg(estado.cargaKg)} kg × ${estado.repsAlvo}`;
}

export function textoSeries(series: number): string {
  return series === 1 ? '1 série' : `${series} séries`;
}

function plural(n: number, singular: string, pluralizado: string): string {
  return n === 1 ? singular : pluralizado;
}

// Motivo de uma linha no cartão (§5.5): por que a meta é esta.
// `estado` é a meta atual; `mudanca`, o evento que a produziu (null se o
// exercício ainda não tem histórico).
export function motivoDaMeta(
  estado: EstadoProgressao,
  mudanca: MudancaDeMeta | null,
  config: ConfigExercicio,
): string {
  if (mudanca === null || mudanca.cargaDe === null) {
    return `Ponto de partida: ${textoMeta(estado)}.`;
  }
  switch (mudanca.tipo) {
    case 'aumento_reps':
      // A nova meta é sempre a menor série + 1 (§5.3, passos 5a e 5c).
      return `Você fez ${mudanca.repsPara - 1} reps. Hoje: tente ${estado.repsAlvo}.`;
    case 'aumento_carga':
      return `Você chegou a ${config.repsMax} reps. Hora de subir +${formatarKg(config.incrementoKg)} kg.`;
    case 'manteve':
      // Sem incremento não há deload, então o contador não levaria a nada.
      if (config.incrementoKg === 0) {
        return `Ainda faltou bater ${estado.repsAlvo} em todas as séries. Mesma meta.`;
      }
      return `Ainda faltou bater ${estado.repsAlvo} em todas as séries. Mesma meta (${estado.falhas}/${config.limiteFalhas}).`;
    case 'deload':
      return `${config.limiteFalhas} treinos sem progredir. Recuo de ${formatarKg(mudanca.cargaDe - mudanca.cargaPara)} kg pra retomar o ritmo.`;
    case 'sem_mudanca':
      return 'Mesma meta da última vez.';
  }
}

export type DirecaoDoSelo = 'sobe' | 'desce' | 'mantem' | 'inicio';

export interface Selo {
  texto: string;
  direcao: DirecaoDoSelo;
}

// Selo de mudança do cartão (§3.2): compara a meta nova com a anterior.
export function seloDaMeta(mudanca: MudancaDeMeta | null): Selo {
  if (mudanca === null || mudanca.cargaDe === null || mudanca.repsDe === null) {
    return { texto: 'início', direcao: 'inicio' };
  }
  if (mudanca.tipo === 'deload') {
    return { texto: '↓ deload', direcao: 'desce' };
  }
  const diferencaKg = mudanca.cargaPara - mudanca.cargaDe;
  if (diferencaKg > 0) {
    return { texto: `↑ +${formatarKg(diferencaKg)} kg`, direcao: 'sobe' };
  }
  if (diferencaKg < 0) {
    return { texto: `↓ −${formatarKg(-diferencaKg)} kg`, direcao: 'desce' };
  }
  const diferencaReps = mudanca.repsPara - mudanca.repsDe;
  if (diferencaReps > 0) {
    return { texto: `↑ +${diferencaReps} ${plural(diferencaReps, 'rep', 'reps')}`, direcao: 'sobe' };
  }
  return { texto: '= mantém', direcao: 'mantem' };
}

// Alerta de estagnação (§7), ex.: "Supino inclinado sem evolução há 3 treinos".
export function textoEstagnacao(nomeExercicio: string, estagnacao: Estagnacao): string {
  if (estagnacao.motivo === 'falhas') {
    return `${nomeExercicio}: ${estagnacao.falhas} treinos seguidos sem bater a meta`;
  }
  return `${nomeExercicio} sem evolução há ${estagnacao.sessoes} treinos`;
}

// "Peito: +8% de força em 4 semanas"
export function fraseVariacaoDoGrupo(grupo: GrupoMuscular, variacao: number): string {
  return `${NOMES_DOS_GRUPOS[grupo]}: ${formatarPercentual(variacao)} de força em 4 semanas`;
}

// "Este mês: 6 aumentos de carga"
export function fraseAumentosDoMes(quantidade: number): string {
  return `Este mês: ${quantidade} ${plural(quantidade, 'aumento', 'aumentos')} de carga`;
}

// Cabeçalho da aba Hoje: "Segunda, 02/11".
export function textoDoDia(data: string): string {
  return `${NOMES_DOS_DIAS[diaDaSemana(data)]}, ${formatarDiaMes(data)}`;
}

// "Amanhã: Upper", "Segunda: Push" (§3.4).
export function textoProximoTreino(proximo: ProximoTreino): string {
  const quando = proximo.emDias === 1 ? 'Amanhã' : NOMES_DOS_DIAS[proximo.diaSemana];
  return `${quando}: ${proximo.nome}`;
}

// "Esta semana: 3 treinos · 72 séries" (§3.4).
export function textoResumoDaSemana(treinos: number, series: number): string {
  if (treinos === 0) {
    return 'Nenhum treino registrado esta semana.';
  }
  return `Esta semana: ${treinos} ${plural(treinos, 'treino', 'treinos')} · ${series} ${plural(series, 'série', 'séries')}`;
}
