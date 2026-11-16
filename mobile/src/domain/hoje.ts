// Regras da aba Hoje que não dependem de tela nem de banco (§3.2, §3.4).

import { diaDaSemana, inicioDaSemana, somarDias } from './datas';
import type { Evento } from './tipos';

export interface TreinoNoDia {
  diaSemana: number;
  nome: string;
}

export interface ProximoTreino {
  data: string; // 'YYYY-MM-DD'
  diaSemana: number;
  nome: string;
  emDias: number; // 1 = amanhã
}

// O próximo dia com treino depois de `hoje`, olhando no máximo uma semana à
// frente (a divisão é fixa por dia da semana, então ela se repete).
export function proximoTreino(divisao: readonly TreinoNoDia[], hoje: string): ProximoTreino | null {
  for (let emDias = 1; emDias <= 7; emDias++) {
    const data = somarDias(hoje, emDias);
    const dia = diaDaSemana(data);
    const treino = divisao.find((t) => t.diaSemana === dia);
    if (treino !== undefined) {
      return { data, diaSemana: dia, nome: treino.nome, emDias };
    }
  }
  return null;
}

export interface TreinoIdentificado {
  id: string;
  nome: string;
}

// Treino perdido (§3.5): ontem tinha treino e nada foi registrado. Só vale
// enquanto a pessoa não começou nada hoje, e não faz sentido sugerir "fazer
// hoje" o mesmo treino que já é o de hoje.
export function treinoPerdido(
  treinoDeOntem: TreinoIdentificado | null,
  registrouOntem: boolean,
  comecouHoje: boolean,
  treinoDeHojeId: string | null,
): TreinoIdentificado | null {
  if (treinoDeOntem === null || registrouOntem || comecouHoje || treinoDeOntem.id === treinoDeHojeId) {
    return null;
  }
  return treinoDeOntem;
}

// O treino do dia da semana, quando a aba Hoje está mostrando outro (ex.: o
// treino perdido de ontem). A tela oferece um botão para ir até ele; sem
// isso, depois de começar o treino perdido não haveria como abrir o do dia.
export function outroTreinoDoDia(
  mostradoId: string,
  treinoDoDia: TreinoIdentificado | null,
): TreinoIdentificado | null {
  return treinoDoDia === null || treinoDoDia.id === mostradoId ? null : treinoDoDia;
}

// "Agora não" no aviso de treino perdido vale só no dia em que foi tocado:
// amanhã, se houver outro treino perdido, o aviso volta.
export function avisoDeTreinoPerdidoVisivel(dispensadoEm: string | null, hoje: string): boolean {
  return dispensadoEm !== hoje;
}

// A semana atual, de segunda a domingo, para a faixa do dia de descanso (§3.4).
// - 'treinado': houve pelo menos um exercício registrado naquele dia;
// - 'perdido': era dia de treino, já passou e nada foi registrado;
// - 'planejado': dia de treino de hoje em diante, ainda sem registro;
// - 'descanso': dia sem treino na divisão.
export type SituacaoDoDia = 'treinado' | 'perdido' | 'planejado' | 'descanso';

export interface DiaDaFaixa {
  data: string; // 'YYYY-MM-DD'
  diaSemana: number;
  situacao: SituacaoDoDia;
  ehHoje: boolean;
}

export function faixaDaSemana(
  hoje: string,
  diasComTreino: readonly number[], // dias da semana que têm treino na divisão
  datasTreinadas: readonly string[], // datas com registro
): DiaDaFaixa[] {
  const segunda = inicioDaSemana(hoje);
  return Array.from({ length: 7 }, (_, indice) => {
    const data = somarDias(segunda, indice);
    const dia = diaDaSemana(data);
    let situacao: SituacaoDoDia = 'descanso';
    if (datasTreinadas.includes(data)) {
      // Treinar num dia de descanso também conta: o que vale é o que foi feito.
      situacao = 'treinado';
    } else if (diasComTreino.includes(dia)) {
      // Datas 'YYYY-MM-DD' comparam certo como texto.
      situacao = data < hoje ? 'perdido' : 'planejado';
    }
    return { data, diaSemana: dia, situacao, ehHoje: data === hoje };
  });
}

// Os números do resumo ao finalizar o treino (§3.2). Um item por exercício
// registrado; "Pulei" chega como 'sem_mudanca'.
export interface ResumoDaSessao {
  progressoes: number; // subiu reps ou carga
  aumentosDeCarga: number; // dos que progrediram, quantos subiram a carga
  mantidos: number;
  deloads: number;
  pulados: number;
}

export function resumirSessao(tipos: readonly Evento[]): ResumoDaSessao {
  const contar = (...procurados: Evento[]) => tipos.filter((tipo) => procurados.includes(tipo)).length;
  return {
    progressoes: contar('aumento_reps', 'aumento_carga'),
    aumentosDeCarga: contar('aumento_carga'),
    mantidos: contar('manteve'),
    deloads: contar('deload'),
    pulados: contar('sem_mudanca'),
  };
}
