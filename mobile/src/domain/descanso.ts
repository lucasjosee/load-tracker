// Cronômetro de descanso entre séries (tarefa 7.10). Só as contas: quem lê o
// relógio e vibra é o componente (src/components/CronometroDeDescanso.tsx).
// Como em todo o domínio, o "agora" entra por parâmetro.

export const DESCANSO_PADRAO_S = 90;
export const DESCANSO_MINIMO_S = 30;
export const DESCANSO_MAXIMO_S = 300;
export const PASSO_DO_DESCANSO_S = 15;

// Quantos segundos faltam, arredondando para cima: enquanto resta qualquer
// fração de segundo, a tela ainda mostra 0:01 e não 0:00.
// `terminaEm` e `agora` em milissegundos, como Date.now().
//
// Guardar o instante em que o descanso termina, e não ir descontando um
// contador, faz a conta continuar certa se o app ficar em segundo plano: ao
// voltar, é só comparar os dois relógios de novo.
export function restanteDoDescanso(terminaEm: number, agora: number): number {
  return Math.max(0, Math.ceil((terminaEm - agora) / 1000));
}

// 90 → '1:30'; 5 → '0:05'.
export function formatarDescanso(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  return `${minutos}:${String(segundos % 60).padStart(2, '0')}`;
}

// A duração guardada na tabela `config` (texto). Valor ausente ou estragado
// vira o padrão; fora dos limites, o limite mais próximo.
export function lerDuracaoDoDescanso(texto: string | null): number {
  if (texto === null || !/^\d+$/.test(texto.trim())) {
    return DESCANSO_PADRAO_S;
  }
  return Math.min(DESCANSO_MAXIMO_S, Math.max(DESCANSO_MINIMO_S, Number(texto.trim())));
}
