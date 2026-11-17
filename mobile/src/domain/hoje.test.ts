import {
  avisoDeTreinoPerdidoVisivel,
  faixaDaSemana,
  outroTreinoDoDia,
  proximoTreino,
  treinoDeHojeOuProximo,
  resumirSessao,
  treinoPerdido,
} from './hoje';

const DIVISAO = [
  { diaSemana: 1, nome: 'Push' },
  { diaSemana: 2, nome: 'Pull' },
  { diaSemana: 3, nome: 'Legs' },
  { diaSemana: 5, nome: 'Upper' },
  { diaSemana: 6, nome: 'Lower' },
];

describe('treinoDeHojeOuProximo', () => {
  it('em dia de treino, é o de hoje', () => {
    expect(treinoDeHojeOuProximo(DIVISAO, '2026-11-02')).toEqual({ data: '2026-11-02', diaSemana: 1, nome: 'Push', emDias: 0 });
  });

  it('em dia de descanso, é o próximo', () => {
    expect(treinoDeHojeOuProximo(DIVISAO, '2026-11-05')).toMatchObject({ nome: 'Upper', emDias: 1 });
  });

  it('sem treino em dia nenhum, null', () => {
    expect(treinoDeHojeOuProximo([], '2026-11-02')).toBeNull();
  });
});

describe('proximoTreino', () => {
  it('quinta de descanso: o próximo é sexta, amanhã', () => {
    expect(proximoTreino(DIVISAO, '2026-11-05')).toEqual({
      data: '2026-11-06',
      diaSemana: 5,
      nome: 'Upper',
      emDias: 1,
    });
  });

  it('domingo: o próximo é segunda, virando a semana', () => {
    expect(proximoTreino(DIVISAO, '2026-11-08')).toMatchObject({ data: '2026-11-09', nome: 'Push' });
  });

  it('não conta o próprio dia: numa segunda, o próximo é terça', () => {
    expect(proximoTreino(DIVISAO, '2026-11-02')).toMatchObject({ nome: 'Pull', emDias: 1 });
  });

  it('treino num dia só: o próximo é daqui a 7 dias', () => {
    expect(proximoTreino([{ diaSemana: 1, nome: 'Push' }], '2026-11-02')).toMatchObject({ emDias: 7 });
  });

  it('sem divisão, não há próximo treino', () => {
    expect(proximoTreino([], '2026-11-02')).toBeNull();
  });
});

describe('treinoPerdido (§3.5)', () => {
  const legs = { id: 'legs', nome: 'Legs' };

  it('ontem tinha treino sem registro e hoje nada começou: sugere fazer hoje', () => {
    expect(treinoPerdido(legs, false, false, null)).toEqual(legs);
    expect(treinoPerdido(legs, false, false, 'upper')).toEqual(legs);
  });

  it('não sugere quando ontem foi descanso', () => {
    expect(treinoPerdido(null, false, false, null)).toBeNull();
  });

  it('não sugere quando ontem houve registro', () => {
    expect(treinoPerdido(legs, true, false, null)).toBeNull();
  });

  it('não sugere depois que a pessoa começou algo hoje', () => {
    expect(treinoPerdido(legs, false, true, 'upper')).toBeNull();
  });

  it('não sugere o mesmo treino que já é o de hoje', () => {
    expect(treinoPerdido(legs, false, false, 'legs')).toBeNull();
  });
});

describe('avisoDeTreinoPerdidoVisivel', () => {
  it('aparece quando nunca foi dispensado', () => {
    expect(avisoDeTreinoPerdidoVisivel(null, '2026-11-17')).toBe(true);
  });

  it('some no dia em que a pessoa tocou "Agora não"', () => {
    expect(avisoDeTreinoPerdidoVisivel('2026-11-17', '2026-11-17')).toBe(false);
  });

  it('volta no dia seguinte, mesmo com o app aberto desde ontem', () => {
    expect(avisoDeTreinoPerdidoVisivel('2026-11-17', '2026-11-18')).toBe(true);
  });
});

describe('outroTreinoDoDia', () => {
  const costas = { id: 'costas', nome: 'Costas' };

  it('fazendo o treino perdido de ontem, o treino do dia continua ao alcance', () => {
    expect(outroTreinoDoDia('peito', costas)).toEqual(costas);
  });

  it('mostrando o próprio treino do dia, não há outro para oferecer', () => {
    expect(outroTreinoDoDia('costas', costas)).toBeNull();
  });

  it('dia de descanso não tem treino do dia', () => {
    expect(outroTreinoDoDia('peito', null)).toBeNull();
  });
});

describe('faixaDaSemana (§3.4)', () => {
  // Quinta 05/11/2026. Treina segunda (1), quarta (3) e sexta (5).
  const HOJE = '2026-11-05';
  const DIVISAO = [1, 3, 5];

  it('vai de segunda a domingo e marca o dia de hoje', () => {
    const faixa = faixaDaSemana(HOJE, DIVISAO, []);
    expect(faixa.map((d) => d.data)).toEqual([
      '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08',
    ]);
    expect(faixa.map((d) => d.diaSemana)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(faixa.filter((d) => d.ehHoje).map((d) => d.data)).toEqual([HOJE]);
  });

  it('separa treinado, perdido, planejado e descanso', () => {
    const faixa = faixaDaSemana(HOJE, DIVISAO, ['2026-11-02']);
    expect(faixa.map((d) => d.situacao)).toEqual([
      'treinado', // segunda: registrou
      'descanso',
      'perdido', // quarta: era dia de treino, já passou, sem registro
      'descanso', // hoje, quinta
      'planejado', // sexta
      'descanso',
      'descanso',
    ]);
  });

  it('dia de treino de hoje ainda sem registro é planejado, não perdido', () => {
    const quarta = faixaDaSemana('2026-11-04', DIVISAO, []);
    expect(quarta[2]).toMatchObject({ situacao: 'planejado', ehHoje: true });
  });

  it('treinar num dia de descanso conta como treinado', () => {
    expect(faixaDaSemana(HOJE, DIVISAO, ['2026-11-03'])[1]?.situacao).toBe('treinado');
  });

  it('no domingo a semana ainda é a que começou na segunda anterior', () => {
    expect(faixaDaSemana('2026-11-08', DIVISAO, [])[0]?.data).toBe('2026-11-02');
  });
});

describe('resumirSessao', () => {
  it('conta cada tipo, e os aumentos de carga dentro das progressões', () => {
    expect(resumirSessao(['aumento_reps', 'aumento_carga', 'manteve', 'deload', 'sem_mudanca', 'aumento_carga'])).toEqual({
      progressoes: 3,
      aumentosDeCarga: 2,
      mantidos: 1,
      deloads: 1,
      pulados: 1,
    });
  });

  it('sessão vazia', () => {
    expect(resumirSessao([])).toEqual({ progressoes: 0, aumentosDeCarga: 0, mantidos: 0, deloads: 0, pulados: 0 });
  });
});
