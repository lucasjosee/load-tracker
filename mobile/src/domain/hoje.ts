// Regras da aba Hoje que não dependem de tela nem de banco (§3.2, §3.4).

import { diaDaSemana, somarDias } from './datas';

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
