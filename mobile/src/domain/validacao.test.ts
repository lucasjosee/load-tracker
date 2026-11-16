import {
  TAMANHO_MAXIMO_DA_NOTA,
  validarExercicio,
  validarNomeDoTreino,
  validarRegras,
  type DadosDoExercicio,
} from './validacao';

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
    grupoMuscular: 'peito',
    equipamento: 'barra',
    repsMin: 8,
    repsMax: 12,
    seriesAlvo: 4,
    incrementoKg: 2.5,
    porLado: true,
    nota: '',
    cargaKg: 22.5,
    reps: 8,
  };

  it('aceita dados completos e tira os espaços do nome', () => {
    expect(validarExercicio({ ...valido, nome: ' Supino reto ' })).toEqual({ ok: true, valor: { ...valido, nota: null } });
  });

  it('aceita peso corporal: carga e incremento 0', () => {
    expect(validarExercicio({ ...valido, cargaKg: 0, incrementoKg: 0 }).ok).toBe(true);
  });

  it.each([
    ['sem nome', { nome: '' }, /nome/],
    ['sem grupo', { grupoMuscular: null }, /grupo/],
    ['sem equipamento', { equipamento: null }, /equipamento/],
    ['faixa invertida', { repsMin: 12, repsMax: 8 }, /faixa/],
    ['sem séries', { seriesAlvo: 0 }, /série/],
    ['incremento ilegível', { incrementoKg: null }, /Incremento/],
    ['carga ilegível', { cargaKg: null }, /Carga/],
    ['sem reps', { reps: 0 }, /reps/],
  ] as const)('recusa %s', (_caso, mudanca, mensagem) => {
    expect(validarExercicio({ ...valido, ...mudanca })).toEqual({
      ok: false,
      erro: expect.stringMatching(mensagem),
    });
  });
});

describe('validarRegras', () => {
  const regras = {
    nome: ' Rosca ',
    grupoMuscular: 'biceps' as const,
    equipamento: 'halter' as const,
    repsMin: 10,
    repsMax: 15,
    seriesAlvo: 3,
    incrementoKg: 1,
    porLado: false,
    nota: '',
  };

  it('aceita e limpa o nome', () => {
    expect(validarRegras(regras)).toEqual({ ok: true, valor: { ...regras, nome: 'Rosca', nota: null } });
  });

  it('nota: tira os espaços, vazia vira null e longa demais é recusada', () => {
    expect(validarRegras({ ...regras, nota: '  banco no furo 4 ' })).toMatchObject({ ok: true, valor: { nota: 'banco no furo 4' } });
    expect(validarRegras({ ...regras, nota: '   ' })).toMatchObject({ ok: true, valor: { nota: null } });
    expect(validarRegras({ ...regras, nota: 'a'.repeat(TAMANHO_MAXIMO_DA_NOTA) }).ok).toBe(true);
    expect(validarRegras({ ...regras, nota: 'a'.repeat(TAMANHO_MAXIMO_DA_NOTA + 1) })).toMatchObject({
      ok: false,
      erro: expect.stringMatching(/Nota muito longa/),
    });
  });

  it('recusa faixa invertida e incremento ilegível', () => {
    expect(validarRegras({ ...regras, repsMin: 16 }).ok).toBe(false);
    expect(validarRegras({ ...regras, incrementoKg: null }).ok).toBe(false);
  });
});
