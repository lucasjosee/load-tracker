import {
  DESCANSO_MAXIMO_S,
  DESCANSO_MINIMO_S,
  DESCANSO_PADRAO_S,
  formatarDescanso,
  lerDuracaoDoDescanso,
  restanteDoDescanso,
} from './descanso';

describe('restanteDoDescanso', () => {
  const INICIO = 1_000_000;
  const terminaEm = INICIO + 90_000;

  it('no início, falta a duração inteira', () => {
    expect(restanteDoDescanso(terminaEm, INICIO)).toBe(90);
  });

  it('arredonda para cima: com meio segundo sobrando ainda mostra 1', () => {
    expect(restanteDoDescanso(terminaEm, terminaEm - 500)).toBe(1);
    expect(restanteDoDescanso(terminaEm, INICIO + 100)).toBe(90);
  });

  it('no fim e depois dele é 0, nunca negativo', () => {
    expect(restanteDoDescanso(terminaEm, terminaEm)).toBe(0);
    expect(restanteDoDescanso(terminaEm, terminaEm + 60_000)).toBe(0);
  });
});

describe('formatarDescanso', () => {
  it.each([
    [90, '1:30'],
    [5, '0:05'],
    [60, '1:00'],
    [300, '5:00'],
    [0, '0:00'],
  ])('%i s vira %s', (segundos, esperado) => {
    expect(formatarDescanso(segundos)).toBe(esperado);
  });
});

describe('lerDuracaoDoDescanso', () => {
  it('lê o valor guardado', () => {
    expect(lerDuracaoDoDescanso('120')).toBe(120);
  });

  it('sem valor ou com valor estragado, usa o padrão', () => {
    for (const texto of [null, '', 'abc', '1.5', '-30']) {
      expect(lerDuracaoDoDescanso(texto)).toBe(DESCANSO_PADRAO_S);
    }
  });

  it('fora dos limites, fica no limite mais próximo', () => {
    expect(lerDuracaoDoDescanso('5')).toBe(DESCANSO_MINIMO_S);
    expect(lerDuracaoDoDescanso('9999')).toBe(DESCANSO_MAXIMO_S);
  });
});
