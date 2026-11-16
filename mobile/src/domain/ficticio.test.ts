import { realizadoFicticio, sorteador } from './ficticio';

describe('sorteador', () => {
  it('repete a mesma sequência para a mesma semente', () => {
    const a = sorteador(42);
    const b = sorteador(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('sementes diferentes dão sequências diferentes', () => {
    expect(sorteador(1)()).not.toBe(sorteador(2)());
  });

  it('só devolve números em [0, 1), bem espalhados', () => {
    const sorteio = sorteador(7);
    const numeros = Array.from({ length: 1000 }, () => sorteio());
    expect(numeros.every((n) => n >= 0 && n < 1)).toBe(true);
    const abaixoDaMetade = numeros.filter((n) => n < 0.5).length;
    expect(abaixoDaMetade).toBeGreaterThan(400);
    expect(abaixoDaMetade).toBeLessThan(600);
  });
});

describe('realizadoFicticio', () => {
  const META = { cargaKg: 20, repsAlvo: 10 };

  it('sorteio bem baixo: pulou', () => {
    expect(realizadoFicticio(META, 4, 0.01)).toBe('PULOU');
  });

  it('sorteio baixo: fica devendo reps nas duas últimas séries', () => {
    expect(realizadoFicticio(META, 4, 0.2)).toEqual({ cargaKg: 20, reps: [10, 10, 9, 8] });
  });

  it('no resto dos casos: bate a meta em todas as séries', () => {
    expect(realizadoFicticio(META, 4, 0.3)).toEqual({ cargaKg: 20, reps: [10, 10, 10, 10] });
    expect(realizadoFicticio(META, 3, 0.99)).toEqual({ cargaKg: 20, reps: [10, 10, 10] });
  });

  it('nunca inventa série com menos de 1 rep, nem com série única', () => {
    expect(realizadoFicticio({ cargaKg: 20, repsAlvo: 2 }, 3, 0.2)).toEqual({ cargaKg: 20, reps: [2, 1, 1] });
    expect(realizadoFicticio(META, 1, 0.2)).toEqual({ cargaKg: 20, reps: [8] });
  });
});
