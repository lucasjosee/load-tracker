import {
  contarAumentosDeCargaNoMes,
  detectarEstagnacao,
  e1rm,
  forcaDaSessao,
  pontosDeForca,
  resumirGrupos,
  seriesDaSemana,
  variacaoDoExercicio,
  variacaoDoGrupo,
} from './metricas';

describe('e1rm', () => {
  it('segue os exemplos da §7', () => {
    expect(e1rm(10, 8)).toBeCloseTo(12.67, 2);
    expect(e1rm(10, 9)).toBeCloseTo(13.0, 2);
  });

  it('com 0 reps, a força é a própria carga', () => {
    expect(e1rm(20, 0)).toBe(20);
  });
});

describe('forcaDaSessao', () => {
  it('usa a melhor série', () => {
    expect(forcaDaSessao({ data: '2026-11-02', cargaKg: 10, reps: [8, 9, 7] }, false)).toBe(e1rm(10, 9));
  });

  it('peso corporal usa o total de reps', () => {
    expect(forcaDaSessao({ data: '2026-11-02', cargaKg: 0, reps: [12, 10, 9] }, true)).toBe(31);
  });

  it('sessão sem séries vale 0', () => {
    expect(forcaDaSessao({ data: '2026-11-02', cargaKg: 10, reps: [] }, false)).toBe(0);
  });
});

describe('variacaoDoExercicio', () => {
  it('compara a última sessão com a de ~4 semanas antes', () => {
    const pontos = [
      { data: '2026-10-01', valor: 90 }, // mais de 4 semanas: não é a mais recente delas
      { data: '2026-10-05', valor: 100 }, // 28 dias antes da última: é a referência
      { data: '2026-10-20', valor: 104 },
      { data: '2026-11-02', valor: 108 },
    ];
    expect(variacaoDoExercicio(pontos)).toBeCloseTo(0.08, 5);
  });

  it('com menos de 4 semanas de histórico, compara com a primeira sessão', () => {
    const pontos = [
      { data: '2026-10-20', valor: 50 },
      { data: '2026-11-02', valor: 55 },
    ];
    expect(variacaoDoExercicio(pontos)).toBeCloseTo(0.1, 5);
  });

  it('com uma sessão só, não há variação', () => {
    expect(variacaoDoExercicio([{ data: '2026-11-02', valor: 50 }])).toBeNull();
    expect(variacaoDoExercicio([])).toBeNull();
  });

  it('referência 0 não vira divisão por zero', () => {
    const pontos = [
      { data: '2026-10-20', valor: 0 },
      { data: '2026-11-02', valor: 10 },
    ];
    expect(variacaoDoExercicio(pontos)).toBeNull();
  });
});

describe('variacaoDoGrupo', () => {
  it('é a média das variações dos exercícios', () => {
    expect(variacaoDoGrupo([0.1, 0.06])).toBeCloseTo(0.08, 5);
  });

  it('ignora exercícios sem variação', () => {
    expect(variacaoDoGrupo([0.1, null])).toBeCloseTo(0.1, 5);
  });

  it('sem nenhuma variação, devolve null', () => {
    expect(variacaoDoGrupo([null])).toBeNull();
    expect(variacaoDoGrupo([])).toBeNull();
  });
});

describe('seriesDaSemana', () => {
  const hoje = '2026-11-05'; // quinta; a semana vai de 02/11 (seg) a 08/11 (dom)

  it('soma as séries de cada grupo só dentro da semana de segunda a domingo', () => {
    const total = seriesDaSemana(
      [
        { data: '2026-11-01', grupoMuscular: 'peito', series: 4 }, // domingo anterior: fora
        { data: '2026-11-02', grupoMuscular: 'peito', series: 4 },
        { data: '2026-11-04', grupoMuscular: 'peito', series: 3 },
        { data: '2026-11-08', grupoMuscular: 'costas', series: 4 }, // domingo: dentro
        { data: '2026-11-09', grupoMuscular: 'costas', series: 4 }, // segunda seguinte: fora
      ],
      hoje,
    );
    expect(total.peito).toBe(7);
    expect(total.costas).toBe(4);
  });

  it('grupo não treinado aparece com 0', () => {
    expect(seriesDaSemana([], hoje).panturrilha).toBe(0);
  });
});

describe('detectarEstagnacao', () => {
  it('2 falhas seguidas já é estagnação', () => {
    expect(detectarEstagnacao(2, [10, 11, 12])).toEqual({ motivo: 'falhas', falhas: 2 });
  });

  it('últimas 3 sessões sem passar a força da anterior a elas', () => {
    expect(detectarEstagnacao(0, [10, 12, 12, 11, 12])).toEqual({ motivo: 'sem_aumento', sessoes: 3 });
  });

  it('basta uma das 3 últimas subir para não estar estagnado', () => {
    expect(detectarEstagnacao(0, [10, 12, 12, 13, 11])).toBeNull();
  });

  it('com 3 sessões ou menos não há base para comparar', () => {
    expect(detectarEstagnacao(1, [12, 12, 12])).toBeNull();
  });
});

describe('contarAumentosDeCargaNoMes', () => {
  it('conta só aumentos de carga do mês de hoje', () => {
    const eventos = [
      { data: '2026-10-30', tipo: 'aumento_carga' as const },
      { data: '2026-11-02', tipo: 'aumento_carga' as const },
      { data: '2026-11-03', tipo: 'aumento_reps' as const },
      { data: '2026-11-04', tipo: 'aumento_carga' as const },
    ];
    expect(contarAumentosDeCargaNoMes(eventos, '2026-11-20')).toBe(2);
  });
});

describe('pontosDeForca', () => {
  it('calcula a força de cada sessão', () => {
    expect(pontosDeForca([{ data: '2026-11-02', cargaKg: 0, reps: [10, 10] }], true)).toEqual([{ data: '2026-11-02', valor: 20 }]);
  });
});

describe('resumirGrupos', () => {
  const exercicios = [
    { id: 'supino', grupoMuscular: 'peito' as const, pesoCorporal: false },
    { id: 'crucifixo', grupoMuscular: 'peito' as const, pesoCorporal: false },
    { id: 'barra', grupoMuscular: 'costas' as const, pesoCorporal: true },
  ];
  const historico = [
    { exercicioId: 'supino', data: '2026-10-01', cargaKg: 20, reps: [10, 10, 10], doOnboarding: true },
    { exercicioId: 'supino', data: '2026-11-03', cargaKg: 22, reps: [10, 10, 10], doOnboarding: false },
    { exercicioId: 'barra', data: '2026-11-04', cargaKg: 0, reps: [8, 8, 8], doOnboarding: false },
    { exercicioId: 'barra', data: '2026-11-05', cargaKg: 0, reps: [9, 9, 9], doOnboarding: false },
  ];

  it('um resumo por grupo com exercício, na ordem da §7', () => {
    const resumo = resumirGrupos(exercicios, historico, '2026-11-05');
    expect(resumo.map((r) => r.grupo)).toEqual(['peito', 'costas']);
    expect(resumo[0]).toMatchObject({ exercicios: 2, seriesNaSemana: 3 });
    // supino +10% (crucifixo sem histórico fica de fora da média)
    expect(resumo[0]?.variacao).toBeCloseTo(0.1, 5);
    // peso corporal: 24 → 27 reps no total = +12,5%
    expect(resumo[1]).toMatchObject({ seriesNaSemana: 6 });
    expect(resumo[1]?.variacao).toBeCloseTo(0.125, 5);
  });

  it('o registro de onboarding não conta como série da semana', () => {
    const soOnboarding = [{ ...historico[0]!, data: '2026-11-03' }];
    expect(resumirGrupos(exercicios, soOnboarding, '2026-11-05')[0]?.seriesNaSemana).toBe(0);
  });
});
