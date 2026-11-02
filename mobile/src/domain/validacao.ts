// Validação dos formulários. Devolve a mensagem do primeiro problema
// encontrado, ou null se está tudo certo: erro esperado vira valor, não
// exceção (convenção do CLAUDE.md).

import type { Equipamento, GrupoMuscular } from './tipos';

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

// O que o formulário tem enquanto a pessoa preenche: escolhas podem estar
// vazias (null) e números digitados podem não ser números (null).
export interface DadosDoExercicio {
  nome: string;
  grupoMuscular: GrupoMuscular | null;
  equipamento: Equipamento | null;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  incrementoKg: number | null;
  cargaKg: number | null;
  reps: number; // reps atuais, em todas as séries
}

// O mesmo formulário depois de validado: nada é null.
export interface ExercicioValidado {
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  incrementoKg: number;
  cargaKg: number;
  reps: number;
}

// União discriminada: o campo `ok` diz qual dos dois formatos veio. Depois de
// `if (resultado.ok)`, o compilador sabe que `valor` existe; no `else`, `erro`.
export type Validacao<T> = { ok: true; valor: T } | { ok: false; erro: string };

export function validarExercicio(dados: DadosDoExercicio): Validacao<ExercicioValidado> {
  const erro = (mensagem: string) => ({ ok: false as const, erro: mensagem });

  const erroNoNome = validarNome(dados.nome, 'exercício');
  if (erroNoNome !== null) {
    return erro(erroNoNome);
  }
  const { grupoMuscular, equipamento, incrementoKg, cargaKg } = dados;
  if (grupoMuscular === null) {
    return erro('Escolha o grupo muscular.');
  }
  if (equipamento === null) {
    return erro('Escolha o equipamento.');
  }
  if (dados.repsMin < 1 || dados.repsMax < dados.repsMin) {
    return erro('A faixa de reps precisa ter o mínimo menor ou igual ao máximo.');
  }
  if (dados.seriesAlvo < 1) {
    return erro('O exercício precisa de pelo menos 1 série.');
  }
  if (incrementoKg === null) {
    return erro('Incremento inválido. Use só números, como 2 ou 2,5.');
  }
  if (cargaKg === null) {
    return erro('Carga inválida. Use só números, como 20 ou 12,5.');
  }
  if (dados.reps < 1) {
    return erro('Informe quantas reps você faz hoje.');
  }
  return {
    ok: true,
    valor: { ...dados, nome: dados.nome.trim(), grupoMuscular, equipamento, incrementoKg, cargaKg },
  };
}
