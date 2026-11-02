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
