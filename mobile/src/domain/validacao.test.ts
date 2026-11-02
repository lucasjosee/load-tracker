import { validarExercicio, validarNomeDoTreino, type DadosDoExercicio } from './validacao';

describe('validarNomeDoTreino', () => {
  it('aceita um nome comum', () => {
    expect(validarNomeDoTreino('Push')).toBeNull();
  });

  it('recusa nome vazio ou só com espaços', () => {
    expect(validarNomeDoTreino('   ')).toBe('Dê um nome ao treino.');
  });

  it('recusa nome longo demais', () => {
    expect(validarNomeDoTreino('a'.repeat(61))).toMatch(/muito longo/);
  });
});

describe('validarExercicio', () => {
  const valido: DadosDoExercicio = {
    nome: 'Supino reto',
    repsMin: 8,
    repsMax: 12,
    seriesAlvo: 4,
    incrementoKg: 2.5,
    cargaKg: 22.5,
    reps: 8,
  };

  it('aceita dados completos', () => {
    expect(validarExercicio(valido)).toBeNull();
  });

  it('aceita peso corporal: carga e incremento 0', () => {
    expect(validarExercicio({ ...valido, cargaKg: 0, incrementoKg: 0 })).toBeNull();
  });

  it.each([
    ['sem nome', { nome: '' }, /nome/],
    ['faixa invertida', { repsMin: 12, repsMax: 8 }, /faixa/],
    ['sem séries', { seriesAlvo: 0 }, /série/],
    ['incremento ilegível', { incrementoKg: null }, /Incremento/],
    ['carga ilegível', { cargaKg: null }, /Carga/],
    ['sem reps', { reps: 0 }, /reps/],
  ] as const)('recusa %s', (_caso, mudanca, mensagem) => {
    expect(validarExercicio({ ...valido, ...mudanca })).toMatch(mensagem);
  });
});
