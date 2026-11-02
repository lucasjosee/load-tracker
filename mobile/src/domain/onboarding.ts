// Revisão do onboarding (§3.1, passo 3): o rascunho montado pela IA (ou em
// branco, no "Preencher manualmente") vira uma divisão editável; depois de
// validada, ela é gravada de uma vez.

import { horarioDoAviso, lerHorario, type Horario } from './horario';
import { lerNumero } from './textos';
import {
  configPadrao,
  REPS_MIN_PADRAO,
  SERIES_ALVO_PADRAO,
  type Equipamento,
  type GrupoMuscular,
} from './tipos';
import { validarNomeDoTreino, type Validacao } from './validacao';

// O rascunho que o servidor devolve (contrato §8.4), repetido aqui porque o
// domínio não importa de outras camadas.
export interface RascunhoSugerido {
  horarioTreino: string | null;
  treinos: {
    nome: string;
    diasSemana: number[];
    exercicios: {
      nome: string;
      grupoMuscular: GrupoMuscular;
      equipamento: Equipamento;
      cargaKg: number | null;
      series: number | null;
      reps: number | null;
    }[];
  }[];
}

export interface ExercicioEmRevisao {
  chave: string;
  nome: string;
  grupoMuscular: GrupoMuscular | null;
  equipamento: Equipamento | null;
  carga: string; // texto digitado
  series: number;
  reps: number;
}

export interface TreinoEmRevisao {
  chave: string;
  nome: string;
  diasSemana: number[];
  exercicios: ExercicioEmRevisao[];
}

export interface DivisaoEmRevisao {
  horarioTreino: string | null; // 'HH:MM'
  treinos: TreinoEmRevisao[];
}

export interface ExercicioConfirmado {
  nome: string;
  grupoMuscular: GrupoMuscular;
  equipamento: Equipamento;
  repsMin: number;
  repsMax: number;
  seriesAlvo: number;
  incrementoKg: number;
  cargaKg: number; // carga atual: vira o registro de onboarding
  reps: number; // reps atuais, em todas as séries
}

export interface DivisaoConfirmada {
  horarioDoAviso: Horario | null; // 30 min antes do treino (§6)
  treinos: { nome: string; diasSemana: number[]; exercicios: ExercicioConfirmado[] }[];
}

// Campos que a IA deixou em branco recebem o padrão da §5.1 (séries e reps);
// a carga fica vazia, porque inventar carga é proibido (§8.1).
export function revisaoDoRascunho(rascunho: RascunhoSugerido | null): DivisaoEmRevisao {
  if (rascunho === null) {
    return { horarioTreino: null, treinos: [] };
  }
  return {
    horarioTreino: rascunho.horarioTreino,
    treinos: rascunho.treinos.map((treino, t) => ({
      chave: `treino-${t}`,
      nome: treino.nome,
      diasSemana: [...treino.diasSemana],
      exercicios: treino.exercicios.map((exercicio, e) => ({
        chave: `treino-${t}-exercicio-${e}`,
        nome: exercicio.nome,
        grupoMuscular: exercicio.grupoMuscular,
        equipamento: exercicio.equipamento,
        carga: exercicio.cargaKg === null ? '' : String(exercicio.cargaKg).replace('.', ','),
        series: exercicio.series ?? SERIES_ALVO_PADRAO,
        reps: exercicio.reps ?? REPS_MIN_PADRAO,
      })),
    })),
  };
}

export function treinoEmBranco(chave: string): TreinoEmRevisao {
  return { chave, nome: '', diasSemana: [], exercicios: [] };
}

export function exercicioEmBranco(chave: string): ExercicioEmRevisao {
  return {
    chave,
    nome: '',
    grupoMuscular: null,
    equipamento: null,
    carga: '',
    series: SERIES_ALVO_PADRAO,
    reps: REPS_MIN_PADRAO,
  };
}

function validarExercicioDaRevisao(exercicio: ExercicioEmRevisao, onde: string): Validacao<ExercicioConfirmado> {
  const nome = exercicio.nome.trim();
  if (nome === '') {
    return { ok: false, erro: `${onde}: falta o nome do exercício.` };
  }
  if (exercicio.grupoMuscular === null || exercicio.equipamento === null) {
    return { ok: false, erro: `${onde} (${nome}): escolha o grupo muscular e o equipamento.` };
  }
  const cargaKg = lerNumero(exercicio.carga);
  if (cargaKg === null) {
    return { ok: false, erro: `${onde} (${nome}): informe a carga atual, como 20 ou 12,5.` };
  }
  if (exercicio.series < 1 || exercicio.reps < 1) {
    return { ok: false, erro: `${onde} (${nome}): séries e reps precisam ser pelo menos 1.` };
  }
  const padrao = configPadrao(exercicio.equipamento);
  return {
    ok: true,
    valor: {
      nome,
      grupoMuscular: exercicio.grupoMuscular,
      equipamento: exercicio.equipamento,
      repsMin: padrao.repsMin,
      repsMax: padrao.repsMax,
      seriesAlvo: exercicio.series,
      incrementoKg: padrao.incrementoKg,
      cargaKg,
      reps: exercicio.reps,
    },
  };
}

export function validarDivisao(divisao: DivisaoEmRevisao): Validacao<DivisaoConfirmada> {
  if (divisao.treinos.length === 0) {
    return { ok: false, erro: 'Cadastre pelo menos um treino.' };
  }
  const horario = divisao.horarioTreino === null ? null : lerHorario(divisao.horarioTreino);
  if (divisao.horarioTreino !== null && horario === null) {
    return { ok: false, erro: 'Horário inválido. Use HH:MM, como 18:00.' };
  }

  const diasUsados = new Set<number>();
  const treinos: DivisaoConfirmada['treinos'] = [];
  for (const [t, treino] of divisao.treinos.entries()) {
    const onde = `Treino ${t + 1}`;
    const erroNoNome = validarNomeDoTreino(treino.nome);
    if (erroNoNome !== null) {
      return { ok: false, erro: `${onde}: ${erroNoNome}` };
    }
    for (const dia of treino.diasSemana) {
      if (diasUsados.has(dia)) {
        return { ok: false, erro: `${treino.nome.trim()}: cada dia da semana tem um treino só.` };
      }
      diasUsados.add(dia);
    }
    const exercicios: ExercicioConfirmado[] = [];
    for (const [e, exercicio] of treino.exercicios.entries()) {
      const validacao = validarExercicioDaRevisao(exercicio, `${treino.nome.trim()}, exercício ${e + 1}`);
      if (!validacao.ok) {
        return validacao;
      }
      exercicios.push(validacao.valor);
    }
    treinos.push({ nome: treino.nome.trim(), diasSemana: [...treino.diasSemana], exercicios });
  }
  return { ok: true, valor: { horarioDoAviso: horario === null ? null : horarioDoAviso(horario), treinos } };
}
