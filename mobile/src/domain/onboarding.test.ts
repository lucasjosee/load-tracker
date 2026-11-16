import {
  exercicioEmBranco,
  resumirRascunho,
  textoDoResumoDoRascunho,
  textoDoTreinoNoResumo,
  revisaoDoRascunho,
  treinoEmBranco,
  validarDivisao,
  type DivisaoEmRevisao,
  type RascunhoSugerido,
} from './onboarding';

const RASCUNHO: RascunhoSugerido = {
  nome: 'Lucas',
  objetivo: null,
  tempoDeTreino: 'de_1_a_3_anos',
  horarioTreino: '18:00',
  treinos: [
    {
      nome: 'Peito e tríceps',
      diasSemana: [1, 4],
      exercicios: [
        { nome: 'Supino reto', grupoMuscular: 'peito', equipamento: 'barra', cargaKg: 22.5, porLado: true, series: 4, reps: 8 },
        { nome: 'Tríceps corda', grupoMuscular: 'triceps', equipamento: 'polia', cargaKg: null, porLado: false, series: null, reps: null },
      ],
    },
  ],
};

describe('revisaoDoRascunho', () => {
  it('preenche séries e reps que faltam com o padrão e deixa a carga em branco', () => {
    const revisao = revisaoDoRascunho(RASCUNHO);
    expect(revisao.horarioTreino).toBe('18:00');
    expect(revisao.treinos[0]?.exercicios[0]).toMatchObject({ carga: '22,5', series: 4, reps: 8 });
    expect(revisao.treinos[0]?.exercicios[1]).toMatchObject({ carga: '', series: 3, reps: 8 });
  });

  it('sem rascunho (preencher manualmente), começa vazio', () => {
    expect(revisaoDoRascunho(null)).toEqual({ nome: '', objetivo: null, tempoDeTreino: null, horarioTreino: null, treinos: [] });
  });

  it('leva o perfil para a revisão, e com objetivo força as reps que faltam começam em 4', () => {
    const revisao = revisaoDoRascunho({ ...RASCUNHO, objetivo: 'forca' });
    expect(revisao).toMatchObject({ nome: 'Lucas', objetivo: 'forca', tempoDeTreino: 'de_1_a_3_anos' });
    expect(revisao.treinos[0]?.exercicios[0]?.reps).toBe(8); // o que a pessoa disse não muda
    expect(revisao.treinos[0]?.exercicios[1]?.reps).toBe(4);
  });
});

describe('validarDivisao', () => {
  const revisao = revisaoDoRascunho(RASCUNHO);
  const completa: DivisaoEmRevisao = {
    ...revisao,
    treinos: revisao.treinos.map((t) => ({ ...t, exercicios: t.exercicios.map((e) => ({ ...e, carga: e.carga || '20' })) })),
  };

  it('confirma a divisão, com a config padrão do equipamento e o aviso 30 min antes', () => {
    const resultado = validarDivisao(completa);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.horarioDoAviso).toEqual({ hora: 17, minuto: 30 });
      expect(resultado.valor.treinos[0]?.exercicios[1]).toEqual({
        nome: 'Tríceps corda',
        grupoMuscular: 'triceps',
        equipamento: 'polia',
        repsMin: 8,
        repsMax: 12,
        seriesAlvo: 3,
        incrementoKg: 5,
        porLado: false,
        nota: null,
        cargaKg: 20,
        reps: 8,
      });
      // "22,5 lado" chega da IA como 22,5 com a marca; nada é dobrado (§8.4).
      expect(resultado.valor.treinos[0]?.exercicios[0]).toMatchObject({ nome: 'Supino reto', cargaKg: 22.5, porLado: true });
    }
  });

  it('o objetivo escolhe a faixa de reps de todos os exercícios (§5.1)', () => {
    const resultado = validarDivisao({ ...completa, objetivo: 'forca' });
    expect(resultado.ok && resultado.valor.treinos[0]?.exercicios.map((e) => [e.repsMin, e.repsMax])).toEqual([[4, 6], [4, 6]]);
  });

  it('devolve o perfil, com nome em branco virando null', () => {
    const comPerfil = validarDivisao({ ...completa, nome: '  Lucas ', objetivo: 'hipertrofia' });
    expect(comPerfil.ok && comPerfil.valor.perfil).toEqual({ nome: 'Lucas', objetivo: 'hipertrofia', tempoDeTreino: 'de_1_a_3_anos' });
    const semNome = validarDivisao({ ...completa, nome: '   ', tempoDeTreino: null });
    expect(semNome.ok && semNome.valor.perfil).toEqual({ nome: null, objetivo: null, tempoDeTreino: null });
  });

  it('sem horário, o aviso fica no padrão do app', () => {
    const resultado = validarDivisao({ ...completa, horarioTreino: null });
    expect(resultado.ok && resultado.valor.horarioDoAviso).toBeNull();
  });

  it('pede a carga que a IA não soube', () => {
    expect(validarDivisao(revisao)).toEqual({
      ok: false,
      erro: 'Peito e tríceps, exercício 2 (Tríceps corda): informe a carga atual, como 20 ou 12,5.',
    });
  });

  it('recusa dia em dois treinos, treino sem nome e divisão vazia', () => {
    const outro = { ...treinoEmBranco('t2'), nome: 'Costas', diasSemana: [4] };
    expect(validarDivisao({ ...completa, treinos: [...completa.treinos, outro] })).toMatchObject({ ok: false, erro: expect.stringMatching(/um treino só/) });
    expect(validarDivisao({ ...completa, treinos: [treinoEmBranco('t3')] })).toMatchObject({ ok: false, erro: expect.stringMatching(/nome/) });
    expect(validarDivisao(revisaoDoRascunho(null))).toEqual({ ok: false, erro: 'Cadastre pelo menos um treino.' });
  });

  it('exercício em branco pede nome, depois grupo e equipamento', () => {
    const comBranco = { ...completa.treinos[0]!, exercicios: [exercicioEmBranco('e1', null)] };
    expect(validarDivisao({ ...completa, treinos: [comBranco] })).toMatchObject({ ok: false, erro: expect.stringMatching(/falta o nome/) });
    const comNome = { ...comBranco, exercicios: [{ ...exercicioEmBranco('e1', null), nome: 'Remada' }] };
    expect(validarDivisao({ ...completa, treinos: [comNome] })).toMatchObject({ ok: false, erro: expect.stringMatching(/grupo muscular/) });
  });

  it('recusa horário fora de HH:MM', () => {
    expect(validarDivisao({ ...completa, horarioTreino: '18h' })).toMatchObject({ ok: false, erro: expect.stringMatching(/Horário/) });
  });
});

describe('resumirRascunho', () => {
  it('sem rascunho, tudo vazio', () => {
    expect(resumirRascunho(null)).toEqual({ diasComTreino: [], treinos: [], exercicios: 0, horarioTreino: null });
  });

  it('conta exercícios, os que estão sem carga e junta os dias a partir da segunda', () => {
    const resumo = resumirRascunho({
      ...RASCUNHO,
      treinos: [...RASCUNHO.treinos, { nome: 'Perna', diasSemana: [0, 3], exercicios: [] }],
    });
    expect(resumo.treinos).toEqual([
      { nome: 'Peito e tríceps', diasSemana: [1, 4], exercicios: 2, semCarga: 1 },
      { nome: 'Perna', diasSemana: [3, 0], exercicios: 0, semCarga: 0 },
    ]);
    expect(resumo.diasComTreino).toEqual([1, 3, 4, 0]);
    expect(resumo.exercicios).toBe(2);
    expect(resumo.horarioTreino).toBe('18:00');
  });
});

describe('textoDoResumoDoRascunho', () => {
  it('antes da primeira resposta, explica o que vai aparecer', () => {
    expect(textoDoResumoDoRascunho(resumirRascunho(null))).toBe('Sua divisão aparece aqui conforme você responde.');
  });

  it('treinos, exercícios e o horário, se já houver', () => {
    expect(textoDoResumoDoRascunho(resumirRascunho(RASCUNHO))).toBe('1 treino · 2 exercícios · 18:00');
    expect(textoDoResumoDoRascunho({ diasComTreino: [1], treinos: [
      { nome: 'A', diasSemana: [1], exercicios: 1, semCarga: 0 },
      { nome: 'B', diasSemana: [], exercicios: 0, semCarga: 0 },
    ], exercicios: 1, horarioTreino: null })).toBe('2 treinos · 1 exercício');
  });
});

describe('textoDoTreinoNoResumo', () => {
  it('dias curtos, exercícios e o que falta', () => {
    expect(textoDoTreinoNoResumo({ nome: 'Push', diasSemana: [1, 4], exercicios: 6, semCarga: 2 })).toBe('seg, qui · 6 exercícios · 2 sem carga');
    expect(textoDoTreinoNoResumo({ nome: 'Push', diasSemana: [6], exercicios: 1, semCarga: 0 })).toBe('sáb · 1 exercício');
    expect(textoDoTreinoNoResumo({ nome: 'Push', diasSemana: [], exercicios: 0, semCarga: 0 })).toBe('sem dia · sem exercícios ainda');
  });
});
