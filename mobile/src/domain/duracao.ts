// Cronometragem do treino (§3.2): quanto tempo a pessoa treinou, descontando
// as pausas. Só as contas; quem lê o relógio é a tela. Como em todo o
// domínio, o "agora" entra por parâmetro (em milissegundos, como Date.now()).

// Os instantes guardados na sessão (timestamps ISO).
export interface TemposDaSessao {
  iniciadaEm: string;
  finalizadaEm: string | null;
  pausadaEm: string | null; // quando a pausa em curso começou; null = não está pausada
  pausadoS: number; // soma das pausas que já terminaram, em segundos
}

const ms = (iso: string) => new Date(iso).getTime();

// Segundos de treino: do início até o fim, menos o tempo pausado. O "fim" é
// o encerramento, ou o começo da pausa em curso (o relógio fica parado), ou
// agora. Nunca negativo, mesmo se o relógio do aparelho for atrasado.
//
// Guardar instantes, e não ir somando um contador, faz a conta continuar
// certa com a tela fechada ou o app em segundo plano.
export function segundosDeTreino(sessao: TemposDaSessao, agora: number): number {
  const fim = sessao.finalizadaEm !== null ? ms(sessao.finalizadaEm) : sessao.pausadaEm !== null ? ms(sessao.pausadaEm) : agora;
  return Math.max(0, Math.floor((fim - ms(sessao.iniciadaEm)) / 1000) - sessao.pausadoS);
}

// O novo total pausado quando o treino volta a contar: o que já havia mais a
// parada que termina agora. A parada pode ser uma pausa ou um treino
// encerrado que a pessoa retomou; nos dois casos o intervalo não é treino.
export function pausadoAoRetomar(sessao: TemposDaSessao, agora: number): number {
  const paradaDesde = sessao.pausadaEm ?? sessao.finalizadaEm;
  if (paradaDesde === null) {
    return sessao.pausadoS; // não estava parada
  }
  return sessao.pausadoS + Math.max(0, Math.floor((agora - ms(paradaDesde)) / 1000));
}

// O cronômetro da tela do treino: 725 → '12:05'; 3725 → '1:02:05'.
export function formatarCronometro(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const doisDigitos = (n: number) => String(n).padStart(2, '0');
  return horas > 0
    ? `${horas}:${doisDigitos(minutos)}:${doisDigitos(segundos % 60)}`
    : `${minutos}:${doisDigitos(segundos % 60)}`;
}

// A duração no resumo do treino: '52 min', '1 h 05 min'. Arredonda para
// baixo; menos de um minuto vira null (não vale mostrar).
export function textoDuracao(segundos: number): string | null {
  const minutos = Math.floor(segundos / 60);
  if (minutos < 1) {
    return null;
  }
  return minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`;
}

// Sessão mais curta que isto não é um treino de verdade (aberta e encerrada
// por engano, ou registrada depois pelo registro rápido): fica fora da previsão.
export const DURACAO_MINIMA_S = 5 * 60;
const SESSOES_DA_PREVISAO = 5;

// Quanto aquele treino costuma durar: a mediana das últimas sessões. A
// mediana, e não a média, para um dia atípico (treino de 2 horas, ou cortado
// no meio) não puxar a previsão. `duracoes` vem da mais recente para a mais
// antiga, em segundos. null = ainda não há sessão que sirva.
export function duracaoTipica(duracoes: readonly number[]): number | null {
  const validas = duracoes.filter((duracao) => duracao >= DURACAO_MINIMA_S).slice(0, SESSOES_DA_PREVISAO);
  if (validas.length === 0) {
    return null;
  }
  const ordenadas = [...validas].sort((a, b) => a - b);
  const meio = Math.floor(ordenadas.length / 2);
  return ordenadas.length % 2 === 1 ? ordenadas[meio] : Math.round((ordenadas[meio - 1] + ordenadas[meio]) / 2);
}

// Linha embaixo do "Iniciar treino": '6 exercícios · cerca de 55 min'. A
// previsão é arredondada de 5 em 5 minutos, para não prometer precisão.
export function textoPrevisaoDoTreino(exercicios: number, tipicaS: number | null): string {
  const quantos = exercicios === 1 ? '1 exercício' : `${exercicios} exercícios`;
  if (tipicaS === null) {
    return quantos;
  }
  const minutos = Math.max(5, Math.round(tipicaS / 300) * 5);
  return `${quantos} · cerca de ${textoDuracao(minutos * 60)}`;
}
