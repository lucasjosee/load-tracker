import { somar } from './exemplo';

describe('somar', () => {
  it('soma dois inteiros', () => {
    expect(somar(2, 3)).toBe(5);
  });

  it('soma cargas fracionadas, como 12.5 kg', () => {
    // toBeCloseTo evita falso negativo por arredondamento de ponto flutuante.
    expect(somar(12.5, 2.5)).toBeCloseTo(15);
  });
});
