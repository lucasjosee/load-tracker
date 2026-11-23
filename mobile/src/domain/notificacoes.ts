// O que agendar e com que texto (§6). Função pura: quem fala com o iOS é
// src/notificacoes/agendar.ts, que só executa este plano.

import { diaDaSemana, somarDias } from './datas';
import type { Horario } from './horario';
import { seloDaMeta, textoMeta, textoSeries } from './textos';
import type { EstadoProgressao, MudancaDeMeta } from './tipos';

export interface ItemDoAviso {
  nome: string;
  porLado: boolean; // carga anotada por lado (§5.2): o texto diz "20 kg lado"
  estado: Pick<EstadoProgressao, 'cargaKg' | 'repsAlvo'>;
  mudanca: MudancaDeMeta | null;
}

export interface TreinoDoAviso {
  nome: string;
  itens: ItemDoAviso[]; // na ordem do treino
}

export interface TextoDoAviso {
  titulo: string;
  corpo: string;
}

const EXERCICIOS_NO_AVISO = 2;
export const HORARIO_DO_LEMBRETE: Horario = { hora: 21, minuto: 0 };
export const DIAS_AGENDADOS = 7;

function mudouCarga(item: ItemDoAviso): boolean {
  return item.mudanca !== null && item.mudanca.cargaDe !== null && item.mudanca.cargaDe !== item.mudanca.cargaPara;
}

// "Hoje: Push" / "Supino inclinado 12 kg × 8 (↑ +2 kg) · Crucifixo 14 kg × 11 · e mais 3".
// Mostra até 2 exercícios, primeiro os que mudaram de carga (é o que a
// pessoa precisa saber antes de montar a barra).
export function textoDoAvisoDeTreino(treino: TreinoDoAviso): TextoDoAviso {
  const titulo = `Hoje: ${treino.nome}`;
  if (treino.itens.length === 0) {
    return { titulo, corpo: 'Bom treino!' };
  }
  // `sort` é estável: entre os que mudaram (e entre os que não mudaram),
  // a ordem do treino se mantém.
  const ordenados = [...treino.itens].sort((a, b) => Number(mudouCarga(b)) - Number(mudouCarga(a)));
  const partes = ordenados.slice(0, EXERCICIOS_NO_AVISO).map((item) => {
    const meta = `${item.nome} ${textoMeta(item.estado, item.porLado)}`;
    return mudouCarga(item) ? `${meta} (${seloDaMeta(item.mudanca).texto})` : meta;
  });
  const restantes = treino.itens.length - partes.length;
  if (restantes > 0) {
    partes.push(`e mais ${restantes}`);
  }
  return { titulo, corpo: partes.join(' · ') };
}

export interface NotificacaoPlanejada {
  id: string; // fixo por dia e tipo: reagendar substitui em vez de duplicar
  tipo: 'treino' | 'lembrete';
  data: string; // 'YYYY-MM-DD'
  horario: Horario;
  titulo: string;
  corpo: string;
}

export interface Planejamento {
  hoje: string;
  agora: Horario;
  horarioDoAviso: Horario;
  // Treino de cada dia da semana (índice 0 = domingo); null = descanso.
  treinoDoDia: (diaSemana: number) => TreinoDoAviso | null;
  treinoDeHojeFinalizado: boolean;
}

export interface SessaoDoDia {
  treinoId: string | null; // null = sessão avulsa (registro rápido em dia de descanso)
  finalizada: boolean;
}

// Só a sessão do próprio treino do dia cancela os avisos dele. Finalizar
// outro treino no mesmo dia (o perdido de ontem, por exemplo) não conta.
export function treinoDoDiaFinalizado(treinoDoDiaId: string | null, sessoesDeHoje: readonly SessaoDoDia[]): boolean {
  return (
    treinoDoDiaId !== null && sessoesDeHoje.some((sessao) => sessao.treinoId === treinoDoDiaId && sessao.finalizada)
  );
}

function jaPassou(horario: Horario, agora: Horario): boolean {
  return horario.hora * 60 + horario.minuto <= agora.hora * 60 + agora.minuto;
}

// Os próximos 7 dias, a partir de hoje: em cada dia de treino, o aviso no
// horário configurado e o lembrete de check-in às 21h. No máximo 14
// notificações, bem abaixo das 64 pendentes que o iOS aceita.
export function planejarNotificacoes(p: Planejamento): NotificacaoPlanejada[] {
  const plano: NotificacaoPlanejada[] = [];
  for (let emDias = 0; emDias < DIAS_AGENDADOS; emDias++) {
    const data = somarDias(p.hoje, emDias);
    const treino = p.treinoDoDia(diaDaSemana(data));
    if (treino === null) {
      continue;
    }
    const ehHoje = emDias === 0;
    // Hoje: não agenda o que já passou, nem nada se o treino já foi finalizado.
    if (ehHoje && p.treinoDeHojeFinalizado) {
      continue;
    }
    if (!(ehHoje && jaPassou(p.horarioDoAviso, p.agora))) {
      plano.push({ id: `treino-${data}`, tipo: 'treino', data, horario: p.horarioDoAviso, ...textoDoAvisoDeTreino(treino) });
    }
    if (!(ehHoje && jaPassou(HORARIO_DO_LEMBRETE, p.agora))) {
      plano.push({
        id: `lembrete-${data}`,
        tipo: 'lembrete',
        data,
        horario: HORARIO_DO_LEMBRETE,
        titulo: 'Registrou o treino de hoje?',
        corpo: `${treino.nome}: abra o app e faça o check-in.`,
      });
    }
  }
  return plano;
}

// O treino em andamento, como a tela do treino mostra agora. Vira a
// notificação que fica na central e na tela bloqueada durante o treino (§6).
export interface TreinoEmAndamento {
  nome: string; // "Push"
  feitos: number; // exercícios já registrados (ou pulados) hoje
  total: number;
  // O exercício da vez; `estado` null = ainda sem meta (primeiro registro).
  atual: {
    nome: string;
    porLado: boolean;
    seriesAlvo: number;
    estado: Pick<EstadoProgressao, 'cargaKg' | 'repsAlvo'> | null;
  };
  proximo: string | null; // o nome do que vem depois; null = é o último
  pausado: boolean;
}

// Título: "Push · 2 de 6 exercícios" (ou "Push · pausado").
// Corpo, uma informação por linha:
//   "Agora: Supino reto, 22,5 kg lado × 9, 3 séries"
//   "Depois: Elevação lateral"
// É lido de relance na tela bloqueada, entre uma série e outra: o que fazer
// agora vem primeiro e com a meta inteira; o seguinte, só o nome.
export function textoDoTreinoEmAndamento(treino: TreinoEmAndamento): TextoDoAviso {
  const andamento = treino.pausado ? 'pausado' : `${treino.feitos} de ${treino.total} ${treino.total === 1 ? 'exercício' : 'exercícios'}`;
  const { atual } = treino;
  const meta = atual.estado === null ? 'sem meta ainda' : `${textoMeta(atual.estado, atual.porLado)}, ${textoSeries(atual.seriesAlvo)}`;
  const linhas = [`Agora: ${atual.nome}, ${meta}`];
  linhas.push(treino.proximo === null ? 'É o último do treino' : `Depois: ${treino.proximo}`);
  return { titulo: `${treino.nome} · ${andamento}`, corpo: linhas.join('\n') };
}
