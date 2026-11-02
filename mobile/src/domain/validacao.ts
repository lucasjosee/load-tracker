// Validação dos formulários. Devolve a mensagem do primeiro problema
// encontrado, ou null se está tudo certo: erro esperado vira valor, não
// exceção (convenção do CLAUDE.md).

export const TAMANHO_MAXIMO_DO_NOME = 60;

function validarNome(nome: string, oQue: string): string | null {
  const limpo = nome.trim();
  if (limpo.length === 0) {
    return `Dê um nome ao ${oQue}.`;
  }
  if (limpo.length > TAMANHO_MAXIMO_DO_NOME) {
    return `Nome muito longo (máximo ${TAMANHO_MAXIMO_DO_NOME} letras).`;
  }
  return null;
}

export function validarNomeDoTreino(nome: string): string | null {
  return validarNome(nome, 'treino');
}

export interface DadosDoExercicio {
  nome: string;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  incrementoKg: number | null; // null = o texto digitado não é número
  cargaKg: number | null;
  reps: number; // reps atuais, em todas as séries
}

export function validarExercicio(dados: DadosDoExercicio): string | null {
  const erroNoNome = validarNome(dados.nome, 'exercício');
  if (erroNoNome !== null) {
    return erroNoNome;
  }
  if (dados.repsMin < 1 || dados.repsMax < dados.repsMin) {
    return 'A faixa de reps precisa ter o mínimo menor ou igual ao máximo.';
  }
  if (dados.seriesAlvo < 1) {
    return 'O exercício precisa de pelo menos 1 série.';
  }
  if (dados.incrementoKg === null) {
    return 'Incremento inválido. Use só números, como 2 ou 2,5.';
  }
  if (dados.cargaKg === null) {
    return 'Carga inválida. Use só números, como 20 ou 12,5.';
  }
  if (dados.reps < 1) {
    return 'Informe quantas reps você faz hoje.';
  }
  return null;
}
