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
