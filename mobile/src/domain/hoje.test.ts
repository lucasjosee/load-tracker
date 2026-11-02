import { proximoTreino, treinoPerdido } from './hoje';

const DIVISAO = [
  { diaSemana: 1, nome: 'Push' },
  { diaSemana: 2, nome: 'Pull' },
  { diaSemana: 3, nome: 'Legs' },
  { diaSemana: 5, nome: 'Upper' },
  { diaSemana: 6, nome: 'Lower' },
];

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
