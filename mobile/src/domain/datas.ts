// Datas de calendário no formato 'YYYY-MM-DD' (convenção do CLAUDE.md).
//
// As contas usam Date.UTC de propósito: em UTC todo dia tem 24 h. No fuso
// local, a troca para o horário de verão faz um dia ter 23 h ou 25 h, e
// "somar 1 dia" em milissegundos pode cair no mesmo dia ou pular um.

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

function paraUtc(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function deUtc(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}`;
}

// O dia de calendário de um instante, no fuso do aparelho. Recebe o instante
// por parâmetro (quem chama passa `new Date()`), então continua testável.
export function paraDataLocal(instante: Date): string {
  return `${instante.getFullYear()}-${doisDigitos(instante.getMonth() + 1)}-${doisDigitos(instante.getDate())}`;
}

export function somarDias(data: string, dias: number): string {
  return deUtc(paraUtc(data) + dias * MS_POR_DIA);
}

// 0 = domingo … 6 = sábado, igual a Date.getDay().
export function diaDaSemana(data: string): number {
  return new Date(paraUtc(data)).getUTCDay();
}

// Segunda-feira da semana de `data` (a semana da §7 vai de segunda a domingo).
export function inicioDaSemana(data: string): string {
  const diasDesdeSegunda = (diaDaSemana(data) + 6) % 7;
  return somarDias(data, -diasDesdeSegunda);
}

// Quantos dias de `de` até `ate` (negativo se `ate` vem antes).
export function diasEntre(de: string, ate: string): number {
  return Math.round((paraUtc(ate) - paraUtc(de)) / MS_POR_DIA);
}

// '2026-11-12' → '12/11', como na linha do tempo da §3.6.
export function formatarDiaMes(data: string): string {
  const [, mes, dia] = data.split('-');
  return `${dia}/${mes}`;
}

// Índice = dia da semana (0 = domingo).
export const NOMES_DOS_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const NOMES_CURTOS_DOS_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Os dias na ordem em que aparecem na tela: segunda primeiro, domingo por último.
export const DIAS_A_PARTIR_DE_SEGUNDA = [1, 2, 3, 4, 5, 6, 0];

// Ordena dias da semana começando pela segunda: [0, 3, 1] → [1, 3, 0].
export function ordenarDias(dias: readonly number[]): number[] {
  return [...dias].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
}

// "Segunda e quarta", "Segunda, quarta e sexta". Lista vazia → ''.
export function listarDiasPorExtenso(dias: readonly number[]): string {
  const nomes = ordenarDias(dias).map((dia, i) =>
    i === 0 ? NOMES_DOS_DIAS[dia] : NOMES_DOS_DIAS[dia].toLowerCase(),
  );
  if (nomes.length <= 1) {
    return nomes.join('');
  }
  return `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
}

// O instante local de um dia + horário: '2026-11-02' às 07:30 no fuso do
// aparelho. Usado para agendar notificações.
export function paraInstanteLocal(data: string, hora: number, minuto: number): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia, hora, minuto);
}
