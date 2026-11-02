import {
  exercicioEmBranco,
  revisaoDoRascunho,
  treinoEmBranco,
  validarDivisao,
  type DivisaoEmRevisao,
  type RascunhoSugerido,
} from './onboarding';

const RASCUNHO: RascunhoSugerido = {
  horarioTreino: '18:00',
  treinos: [
    {
      nome: 'Peito e tríceps',
      diasSemana: [1, 4],
      exercicios: [
        { nome: 'Supino reto', grupoMuscular: 'peito', equipamento: 'barra', cargaKg: 22.5, series: 4, reps: 8 },
        { nome: 'Tríceps corda', grupoMuscular: 'triceps', equipamento: 'polia', cargaKg: null, series: null, reps: null },
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
    expect(revisaoDoRascunho(null)).toEqual({ horarioTreino: null, treinos: [] });
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
        cargaKg: 20,
        reps: 8,
      });
    }
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
    expect(validarDivisao({ horarioTreino: null, treinos: [] })).toEqual({ ok: false, erro: 'Cadastre pelo menos um treino.' });
  });

  it('exercício em branco pede nome, depois grupo e equipamento', () => {
    const comBranco = { ...completa.treinos[0]!, exercicios: [exercicioEmBranco('e1')] };
    expect(validarDivisao({ ...completa, treinos: [comBranco] })).toMatchObject({ ok: false, erro: expect.stringMatching(/falta o nome/) });
    const comNome = { ...comBranco, exercicios: [{ ...exercicioEmBranco('e1'), nome: 'Remada' }] };
    expect(validarDivisao({ ...completa, treinos: [comNome] })).toMatchObject({ ok: false, erro: expect.stringMatching(/grupo muscular/) });
  });

  it('recusa horário fora de HH:MM', () => {
    expect(validarDivisao({ ...completa, horarioTreino: '18h' })).toMatchObject({ ok: false, erro: expect.stringMatching(/Horário/) });
  });
});
