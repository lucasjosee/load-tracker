import { MAXIMO_DE_PONTOS, progressoDoTreino, reguaDeReps } from './regua';

const FAIXA = { repsMin: 8, repsMax: 12, incrementoKg: 2 };

describe('reguaDeReps', () => {
  it('marca o que já passou, a meta de hoje e o que falta', () => {
    const regua = reguaDeReps({ cargaKg: 10, repsAlvo: 10 }, FAIXA);
    expect(regua?.pontos).toEqual([
      { reps: 8, situacao: 'feito' },
      { reps: 9, situacao: 'feito' },
      { reps: 10, situacao: 'alvo' },
      { reps: 11, situacao: 'falta' },
      { reps: 12, situacao: 'falta' },
    ]);
  });

  it('logo depois de subir a carga, a meta é o primeiro ponto', () => {
    const regua = reguaDeReps({ cargaKg: 12, repsAlvo: 8 }, FAIXA);
    expect(regua?.pontos.map((p) => p.situacao)).toEqual(['alvo', 'falta', 'falta', 'falta', 'falta']);
  });

  it('mostra a carga que vem depois do topo, sem resto de ponto flutuante', () => {
    expect(reguaDeReps({ cargaKg: 10, repsAlvo: 12 }, FAIXA)?.proximaCargaKg).toBe(12);
    expect(reguaDeReps({ cargaKg: 22.5, repsAlvo: 8 }, { ...FAIXA, incrementoKg: 2.5 })?.proximaCargaKg).toBe(25);
    expect(reguaDeReps({ cargaKg: 0.1, repsAlvo: 8 }, { ...FAIXA, incrementoKg: 0.2 })?.proximaCargaKg).toBe(0.3);
  });

  it('peso corporal não tem régua: ali não existe topo', () => {
    expect(reguaDeReps({ cargaKg: 0, repsAlvo: 13 }, { ...FAIXA, incrementoKg: 0 })).toBeNull();
  });

  it('faixa grande demais fica sem régua', () => {
    const noLimite = { repsMin: 5, repsMax: 5 + MAXIMO_DE_PONTOS - 1, incrementoKg: 2 };
    expect(reguaDeReps({ cargaKg: 10, repsAlvo: 5 }, noLimite)?.pontos).toHaveLength(MAXIMO_DE_PONTOS);
    expect(reguaDeReps({ cargaKg: 10, repsAlvo: 5 }, { ...noLimite, repsMax: noLimite.repsMax + 1 })).toBeNull();
  });

  it('meta fora da faixa (faixa recém-editada) fica sem régua', () => {
    expect(reguaDeReps({ cargaKg: 10, repsAlvo: 13 }, FAIXA)).toBeNull();
    expect(reguaDeReps({ cargaKg: 10, repsAlvo: 7 }, FAIXA)).toBeNull();
  });

  it('faixa de um ponto só (ex.: 10–10) tem só a meta', () => {
    expect(reguaDeReps({ cargaKg: 10, repsAlvo: 10 }, { repsMin: 10, repsMax: 10, incrementoKg: 2 })?.pontos).toEqual([
      { reps: 10, situacao: 'alvo' },
    ]);
  });
});

describe('progressoDoTreino', () => {
  it('conta os exercícios já registrados', () => {
    expect(progressoDoTreino([true, false, true, false])).toEqual({ feitos: 2, total: 4 });
    expect(progressoDoTreino([])).toEqual({ feitos: 0, total: 0 });
  });
});
