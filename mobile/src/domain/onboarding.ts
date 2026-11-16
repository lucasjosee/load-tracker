// Revisão do onboarding (§3.1, passo 3): o rascunho montado pela IA (ou em
// branco, no "Preencher manualmente") vira uma divisão editável; depois de
// validada, ela é gravada de uma vez.

import { NOMES_CURTOS_DOS_DIAS, ordenarDias } from './datas';
import { horarioDoAviso, lerHorario, type Horario } from './horario';
import { lerNumero } from './textos';
import {
  configPadrao,
  faixaDeReps,
  SERIES_ALVO_PADRAO,
  type Equipamento,
  type GrupoMuscular,
  type Objetivo,
  type TempoDeTreino,
} from './tipos';
import { validarNomeDoTreino, type Validacao } from './validacao';

// O rascunho que o servidor devolve (contrato §8.4), repetido aqui porque o
// domínio não importa de outras camadas.
export interface RascunhoSugerido {
  nome: string | null;
  objetivo: Objetivo | null;
  tempoDeTreino: TempoDeTreino | null;
  horarioTreino: string | null;
  treinos: {
    nome: string;
    diasSemana: number[];
    exercicios: {
      nome: string;
      grupoMuscular: GrupoMuscular;
      equipamento: Equipamento;
      cargaKg: number | null;
      porLado: boolean;
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
  porLado: boolean; // carga anotada por lado (§5.2)
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
  nome: string; // texto digitado; vazio = não informado
  objetivo: Objetivo | null;
  tempoDeTreino: TempoDeTreino | null;
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
  porLado: boolean;
  nota: string | null; // o onboarding não pergunta nota: sempre null
  cargaKg: number; // carga atual: vira o registro de onboarding
  reps: number; // reps atuais, em todas as séries
}

// O perfil é opcional: a pessoa pode confirmar a divisão sem preenchê-lo.
export interface Perfil {
  nome: string | null;
  objetivo: Objetivo | null;
  tempoDeTreino: TempoDeTreino | null;
}

export interface DivisaoConfirmada {
  perfil: Perfil;
  horarioDoAviso: Horario | null; // 30 min antes do treino (§6)
  treinos: { nome: string; diasSemana: number[]; exercicios: ExercicioConfirmado[] }[];
}

// Campos que a IA deixou em branco recebem o padrão da §5.1 (séries, e reps
// no começo da faixa do objetivo); a carga fica vazia, porque inventar carga
// é proibido (§8.1).
export function revisaoDoRascunho(rascunho: RascunhoSugerido | null): DivisaoEmRevisao {
  if (rascunho === null) {
    return { nome: '', objetivo: null, tempoDeTreino: null, horarioTreino: null, treinos: [] };
  }
  const repsPadrao = faixaDeReps(rascunho.objetivo).repsMin;
  return {
    nome: rascunho.nome ?? '',
    objetivo: rascunho.objetivo,
    tempoDeTreino: rascunho.tempoDeTreino,
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
        porLado: exercicio.porLado,
        series: exercicio.series ?? SERIES_ALVO_PADRAO,
        reps: exercicio.reps ?? repsPadrao,
      })),
    })),
  };
}

export function treinoEmBranco(chave: string): TreinoEmRevisao {
  return { chave, nome: '', diasSemana: [], exercicios: [] };
}

export function exercicioEmBranco(chave: string, objetivo: Objetivo | null): ExercicioEmRevisao {
  return {
    chave,
    nome: '',
    grupoMuscular: null,
    equipamento: null,
    carga: '',
    porLado: false,
    series: SERIES_ALVO_PADRAO,
    reps: faixaDeReps(objetivo).repsMin,
  };
}

function validarExercicioDaRevisao(
  exercicio: ExercicioEmRevisao,
  objetivo: Objetivo | null,
  onde: string,
): Validacao<ExercicioConfirmado> {
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
  const padrao = configPadrao(exercicio.equipamento, objetivo);
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
      porLado: exercicio.porLado,
      nota: null,
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
      const validacao = validarExercicioDaRevisao(exercicio, divisao.objetivo, `${treino.nome.trim()}, exercício ${e + 1}`);
      if (!validacao.ok) {
        return validacao;
      }
      exercicios.push(validacao.valor);
    }
    treinos.push({ nome: treino.nome.trim(), diasSemana: [...treino.diasSemana], exercicios });
  }
  const perfil: Perfil = {
    nome: divisao.nome.trim() === '' ? null : divisao.nome.trim(),
    objetivo: divisao.objetivo,
    tempoDeTreino: divisao.tempoDeTreino,
  };
  return { ok: true, valor: { perfil, horarioDoAviso: horario === null ? null : horarioDoAviso(horario), treinos } };
}

// ---------- Rascunho ao vivo na conversa (§3.1, passo 2) ----------

export interface TreinoNoResumo {
  nome: string;
  diasSemana: number[]; // a partir da segunda
  exercicios: number;
  semCarga: number; // exercícios que a pessoa citou sem dizer a carga
}

// O que a conversa já descobriu, para mostrar na tela enquanto a pessoa
// responde: ela vê a divisão se formando e percebe o que ainda falta.
export interface ResumoDoRascunho {
  diasComTreino: number[]; // 0 = domingo … 6 = sábado
  treinos: TreinoNoResumo[];
  exercicios: number;
  horarioTreino: string | null;
}

export function resumirRascunho(rascunho: RascunhoSugerido | null): ResumoDoRascunho {
  const treinos = (rascunho?.treinos ?? []).map((treino) => ({
    nome: treino.nome,
    diasSemana: ordenarDias(treino.diasSemana),
    exercicios: treino.exercicios.length,
    semCarga: treino.exercicios.filter((exercicio) => exercicio.cargaKg === null).length,
  }));
  return {
    diasComTreino: ordenarDias([...new Set(treinos.flatMap((treino) => treino.diasSemana))]),
    treinos,
    exercicios: treinos.reduce((total, treino) => total + treino.exercicios, 0),
    horarioTreino: rascunho?.horarioTreino ?? null,
  };
}

// Linha de cima do painel: "3 treinos · 12 exercícios · 18:00".
export function textoDoResumoDoRascunho(resumo: ResumoDoRascunho): string {
  if (resumo.treinos.length === 0) {
    return 'Sua divisão aparece aqui conforme você responde.';
  }
  const partes = [
    `${resumo.treinos.length} ${resumo.treinos.length === 1 ? 'treino' : 'treinos'}`,
    `${resumo.exercicios} ${resumo.exercicios === 1 ? 'exercício' : 'exercícios'}`,
  ];
  if (resumo.horarioTreino !== null) {
    partes.push(resumo.horarioTreino);
  }
  return partes.join(' · ');
}

// Linha de um treino no painel: "seg, qui · 6 exercícios · 2 sem carga".
export function textoDoTreinoNoResumo(treino: TreinoNoResumo): string {
  const partes = [
    treino.diasSemana.length === 0
      ? 'sem dia'
      : treino.diasSemana.map((dia) => NOMES_CURTOS_DOS_DIAS[dia].toLowerCase()).join(', '),
    treino.exercicios === 0
      ? 'sem exercícios ainda'
      : `${treino.exercicios} ${treino.exercicios === 1 ? 'exercício' : 'exercícios'}`,
  ];
  if (treino.semCarga > 0) {
    partes.push(`${treino.semCarga} sem carga`);
  }
  return partes.join(' · ');
}
