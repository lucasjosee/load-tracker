// Calendário de treinos da aba Evolução (§3.6): um quadrado por dia, uma
// coluna por semana, como o gráfico de contribuições do GitHub. Lá a cor é
// quantidade; aqui todo treino vale "um", então a cor mostra quantas metas
// foram batidas. Só as contas: quem desenha é o componente.

import { diaDaSemana, inicioDaSemana, somarDias } from './datas';

export const SEMANAS_DO_CALENDARIO = 53; // um ano, com a semana atual

// O que foi registrado num dia, fora os exercícios pulados.
export interface RegistrosDoDia {
  data: string; // 'YYYY-MM-DD'
  total: number;
  batidas: number; // quantos bateram a meta
}

// - 'treinou': há registro naquele dia (mesmo fora do dia do treino);
// - 'faltou': era dia de treino, já passou e nada foi registrado;
// - 'descanso': dia sem treino na divisão;
// - 'hoje': o treino de hoje, ainda por fazer;
// - 'antes': antes do primeiro treino registrado (a pessoa ainda não usava o app);
// - 'futuro': o resto da semana atual.
export type SituacaoNoCalendario = 'treinou' | 'faltou' | 'descanso' | 'hoje' | 'antes' | 'futuro';

export interface DiaDoCalendario {
  data: string;
  situacao: SituacaoNoCalendario;
  nivel: 0 | 1 | 2; // tom do quadrado; só vale em 'treinou'
}

export interface MesDoCalendario {
  mes: number; // 1 = janeiro … 12 = dezembro
  treinos: number;
}

export interface Calendario {
  semanas: DiaDoCalendario[][]; // da mais antiga para a atual; cada uma de segunda a domingo
  rotulos: (number | null)[]; // por semana: o mês (1–12) que começa nela, ou null
  treinos: number; // dias treinados no período
  sequenciaAtual: number; // semanas cumpridas seguidas, até agora
  maiorSequencia: number;
  porMes: MesDoCalendario[]; // os últimos 12 meses, do mais antigo para o atual
}

// O tom do quadrado: todas as metas batidas, pelo menos metade, ou menos.
export function nivelDoTreino(batidas: number, total: number): 0 | 1 | 2 {
  if (batidas >= total) {
    return 2;
  }
  return batidas * 2 >= total ? 1 : 0;
}

const mesDe = (data: string) => Number(data.slice(5, 7));

// `diasDeTreino` são os dias da semana da divisão de HOJE (0 = domingo). O
// app não guarda como a divisão era no passado, então as faltas antigas são
// contadas pela divisão atual.
export function montarCalendario(
  hoje: string,
  diasDeTreino: readonly number[],
  registros: readonly RegistrosDoDia[],
  semanas: number = SEMANAS_DO_CALENDARIO,
): Calendario {
  const porData = new Map(registros.filter((r) => r.total > 0).map((r) => [r.data, r]));
  // Datas 'YYYY-MM-DD' comparam certo como texto.
  const primeiroTreino = [...porData.keys()].sort()[0] ?? null;
  const inicio = somarDias(inicioDaSemana(hoje), -(semanas - 1) * 7);

  const colunas: DiaDoCalendario[][] = [];
  for (let s = 0; s < semanas; s++) {
    const coluna: DiaDoCalendario[] = [];
    for (let d = 0; d < 7; d++) {
      const data = somarDias(inicio, s * 7 + d);
      const feito = porData.get(data);
      let situacao: SituacaoNoCalendario;
      if (feito !== undefined) {
        situacao = 'treinou';
      } else if (data > hoje) {
        situacao = 'futuro';
      } else if (primeiroTreino === null || data < primeiroTreino) {
        situacao = data === hoje && diasDeTreino.includes(diaDaSemana(data)) ? 'hoje' : 'antes';
      } else if (!diasDeTreino.includes(diaDaSemana(data))) {
        situacao = 'descanso';
      } else {
        situacao = data === hoje ? 'hoje' : 'faltou';
      }
      coluna.push({ data, situacao, nivel: feito === undefined ? 0 : nivelDoTreino(feito.batidas, feito.total) });
    }
    colunas.push(coluna);
  }

  const todos = colunas.flat();
  const treinados = todos.filter((dia) => dia.situacao === 'treinou');

  // Os últimos 12 meses, terminando no mês de hoje.
  const porMes: MesDoCalendario[] = [];
  for (let i = 11; i >= 0; i--) {
    const mes = ((mesDe(hoje) - 1 - i + 12) % 12) + 1;
    // Os meses mais próximos de hoje são do ano corrente; os outros, do anterior.
    const ano = Number(hoje.slice(0, 4)) - (mes > mesDe(hoje) ? 1 : 0);
    const prefixo = `${ano}-${String(mes).padStart(2, '0')}`;
    porMes.push({ mes, treinos: treinados.filter((dia) => dia.data.startsWith(prefixo)).length });
  }

  return {
    semanas: colunas,
    rotulos: colunas.map((coluna) => {
      const primeiroDia = coluna.find((dia) => dia.data.endsWith('-01'));
      return primeiroDia === undefined ? null : mesDe(primeiroDia.data);
    }),
    treinos: treinados.length,
    ...sequencias(colunas),
    porMes,
  };
}

// Sequência em semanas, e não em dias: com dias de descanso na divisão, uma
// sequência em dias quebraria toda semana. Semana cumprida = treinou pelo
// menos uma vez e não faltou em nenhum dia de treino.
function sequencias(colunas: readonly DiaDoCalendario[][]): Pick<Calendario, 'sequenciaAtual' | 'maiorSequencia'> {
  const cumprida = colunas.map(
    (coluna) => coluna.some((dia) => dia.situacao === 'treinou') && !coluna.some((dia) => dia.situacao === 'faltou'),
  );
  let maior = 0;
  let corrida = 0;
  for (const ok of cumprida) {
    corrida = ok ? corrida + 1 : 0;
    maior = Math.max(maior, corrida);
  }

  // A semana atual ainda está em jogo: se nada aconteceu nela (sem treino e
  // sem falta), não soma nem quebra a sequência.
  let fim = cumprida.length - 1;
  const atual = colunas[fim];
  if (atual !== undefined && !atual.some((dia) => dia.situacao === 'treinou' || dia.situacao === 'faltou')) {
    fim--;
  }
  let sequenciaAtual = 0;
  while (fim >= 0 && cumprida[fim]) {
    sequenciaAtual++;
    fim--;
  }
  return { sequenciaAtual, maiorSequencia: maior };
}

export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

// O mês com mais treinos; no empate, o mais recente. null = nenhum treino.
export function melhorMes(porMes: readonly MesDoCalendario[]): MesDoCalendario | null {
  let melhor: MesDoCalendario | null = null;
  for (const mes of porMes) {
    if (mes.treinos > 0 && (melhor === null || mes.treinos >= melhor.treinos)) {
      melhor = mes;
    }
  }
  return melhor;
}

// "Seu melhor mês foi julho, com 22 treinos."
export function textoMelhorMes(porMes: readonly MesDoCalendario[]): string | null {
  const melhor = melhorMes(porMes);
  if (melhor === null) {
    return null;
  }
  return `Seu melhor mês foi ${MESES[melhor.mes - 1]}, com ${melhor.treinos} ${melhor.treinos === 1 ? 'treino' : 'treinos'}.`;
}

// Para o leitor de tela, que não vê os quadrados.
export function textoDoCalendario(calendario: Calendario): string {
  const treinos = `${calendario.treinos} ${calendario.treinos === 1 ? 'treino' : 'treinos'} nos últimos 12 meses`;
  const semanas = `${calendario.sequenciaAtual} ${calendario.sequenciaAtual === 1 ? 'semana seguida' : 'semanas seguidas'}`;
  return `${treinos}, ${semanas}`;
}
