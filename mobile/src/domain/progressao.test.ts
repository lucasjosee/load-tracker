import {
  arredondarKg,
  arredondarParaBaixo,
  calcularProxima,
  descreverMudanca,
  resultadoDoEvento,
} from './progressao';
import type { ConfigExercicio, EstadoProgressao, Evento } from './tipos';

// Halter da §5.4: faixa 8–12, 3 séries, incremento 2 kg, limite de 3 falhas.
const HALTER: ConfigExercicio = {
  repsMin: 8,
  repsMax: 12,
  seriesAlvo: 3,
  incrementoKg: 2,
  limiteFalhas: 3,
};

function estado(cargaKg: number, repsAlvo: number, falhas = 0): EstadoProgressao {
  return { cargaKg, repsAlvo, falhas };
}

describe('calcularProxima: exemplo completo da §5.4', () => {
  // Uma linha por sessão, como na tabela. A meta de cada sessão é a próxima
  // meta da linha anterior; o teste confere essa ligação no fim.
  const sessoes: {
    sessao: number;
    meta: EstadoProgressao | null;
    fez: { cargaKg: number; reps: number[] };
    evento: Evento;
    proxima: EstadoProgressao;
  }[] = [
    // Sessão 1 é o onboarding: ainda não existe meta.
    { sessao: 1, meta: null, fez: { cargaKg: 10, reps: [8, 8, 8] }, evento: 'aumento_reps', proxima: estado(10, 9) },
    { sessao: 2, meta: estado(10, 9), fez: { cargaKg: 10, reps: [9, 9, 9] }, evento: 'aumento_reps', proxima: estado(10, 10) },
    { sessao: 3, meta: estado(10, 10), fez: { cargaKg: 10, reps: [11, 10, 10] }, evento: 'aumento_reps', proxima: estado(10, 11) },
    { sessao: 4, meta: estado(10, 11), fez: { cargaKg: 10, reps: [12, 12, 12] }, evento: 'aumento_carga', proxima: estado(12, 8) },
    { sessao: 5, meta: estado(12, 8), fez: { cargaKg: 12, reps: [8, 7, 6] }, evento: 'manteve', proxima: estado(12, 8, 1) },
    { sessao: 6, meta: estado(12, 8, 1), fez: { cargaKg: 12, reps: [8, 8, 7] }, evento: 'manteve', proxima: estado(12, 8, 2) },
    { sessao: 7, meta: estado(12, 8, 2), fez: { cargaKg: 12, reps: [7, 7, 6] }, evento: 'deload', proxima: estado(10, 8) },
    { sessao: 8, meta: estado(10, 8), fez: { cargaKg: 10, reps: [9, 9, 8] }, evento: 'aumento_reps', proxima: estado(10, 9) },
  ];

  it.each(sessoes)('sessão $sessao: $evento', ({ meta, fez, evento, proxima }) => {
    expect(calcularProxima(meta, fez, HALTER)).toEqual({ estado: proxima, evento });
  });

  it('a meta de cada sessão é a próxima meta da sessão anterior', () => {
    for (let i = 1; i < sessoes.length; i++) {
      expect(sessoes[i].meta).toEqual(sessoes[i - 1].proxima);
    }
  });
});

describe('calcularProxima: casos de borda da §5.4', () => {
  it('Pulei: estado igual, sem_mudanca', () => {
    const antes = estado(10, 9, 1);
    expect(calcularProxima(antes, 'PULOU', HALTER)).toEqual({ estado: antes, evento: 'sem_mudanca' });
  });

  it('meta 10 × 9 com 1 falha; fez 14 kg: 10/10/9 → 14 × 10, falhas 0 (nova base)', () => {
    const resultado = calcularProxima(estado(10, 9, 1), { cargaKg: 14, reps: [10, 10, 9] }, HALTER);
    expect(resultado).toEqual({ estado: estado(14, 10), evento: 'aumento_reps' });
  });

  it('meta 10 × 9; fez só 2 séries: 9/9 → manteve, falhas +1', () => {
    const resultado = calcularProxima(estado(10, 9), { cargaKg: 10, reps: [9, 9] }, HALTER);
    expect(resultado).toEqual({ estado: estado(10, 9, 1), evento: 'manteve' });
  });

  it('máquina 35 kg, incremento 5, 3ª falha → deload para 30 × 8', () => {
    const maquina = { ...HALTER, incrementoKg: 5 };
    const resultado = calcularProxima(estado(35, 9, 2), { cargaKg: 35, reps: [8, 8, 7] }, maquina);
    expect(resultado).toEqual({ estado: estado(30, 8), evento: 'deload' });
  });

  it('barra 100 kg, incremento 2, 3ª falha → deload para 90 × 8', () => {
    const resultado = calcularProxima(estado(100, 10, 2), { cargaKg: 100, reps: [9, 9, 9] }, HALTER);
    expect(resultado).toEqual({ estado: estado(90, 8), evento: 'deload' });
  });

  it('peso corporal, meta 12, fez 12/12/12 → 0 × 13', () => {
    const pesoCorporal = { ...HALTER, incrementoKg: 0 };
    const resultado = calcularProxima(estado(0, 12), { cargaKg: 0, reps: [12, 12, 12] }, pesoCorporal);
    expect(resultado).toEqual({ estado: estado(0, 13), evento: 'aumento_reps' });
  });

  it('halter 2 kg, 3ª falha → fica 2 × 8 (piso de um incremento)', () => {
    const resultado = calcularProxima(estado(2, 10, 2), { cargaKg: 2, reps: [9, 9, 9] }, HALTER);
    expect(resultado).toEqual({ estado: estado(2, 8), evento: 'deload' });
  });
});

describe('calcularProxima: outros casos', () => {
  it('primeiro registro abaixo do início da faixa: meta fica em repsMin, com 1 falha', () => {
    const resultado = calcularProxima(null, { cargaKg: 20, reps: [6, 6, 6] }, HALTER);
    expect(resultado).toEqual({ estado: estado(20, 8, 1), evento: 'manteve' });
  });

  it('séries além de seriesAlvo não contam, nem para ajudar nem para atrapalhar', () => {
    const resultado = calcularProxima(estado(10, 9), { cargaKg: 10, reps: [9, 9, 9, 3] }, HALTER);
    expect(resultado).toEqual({ estado: estado(10, 10), evento: 'aumento_reps' });
  });

  it('a pior série decide: 12/12/11 não sobe a carga', () => {
    const resultado = calcularProxima(estado(10, 11), { cargaKg: 10, reps: [12, 12, 11] }, HALTER);
    expect(resultado).toEqual({ estado: estado(10, 12), evento: 'aumento_reps' });
  });

  it('nenhuma série registrada conta como não bateu', () => {
    const resultado = calcularProxima(estado(10, 9), { cargaKg: 10, reps: [] }, HALTER);
    expect(resultado).toEqual({ estado: estado(10, 9, 1), evento: 'manteve' });
  });

  it('peso corporal nunca faz deload: as falhas só acumulam', () => {
    const pesoCorporal = { ...HALTER, incrementoKg: 0 };
    const resultado = calcularProxima(estado(0, 15, 5), { cargaKg: 0, reps: [10, 10, 10] }, pesoCorporal);
    expect(resultado).toEqual({ estado: estado(0, 15, 6), evento: 'manteve' });
  });

  it('se a faixa mudou e a meta ficou abaixo do novo repsMin, a próxima volta para dentro da faixa', () => {
    const resultado = calcularProxima(estado(10, 6), { cargaKg: 10, reps: [6, 6, 6] }, HALTER);
    expect(resultado.estado.repsAlvo).toBe(8);
  });

  it('respeita limiteFalhas diferente do padrão', () => {
    const resultado = calcularProxima(estado(20, 8, 1), { cargaKg: 20, reps: [7, 7, 7] }, {
      ...HALTER,
      limiteFalhas: 2,
    });
    expect(resultado.evento).toBe('deload');
  });

  it('carga com casas decimais não acumula erro de ponto flutuante', () => {
    const polia = { ...HALTER, incrementoKg: 3.5 };
    const resultado = calcularProxima(estado(17.5, 12), { cargaKg: 17.5, reps: [12, 12, 12] }, polia);
    expect(resultado.estado.cargaKg).toBe(21);
  });

  it('pular sem ter meta é bug de quem chama', () => {
    expect(() => calcularProxima(null, 'PULOU', HALTER)).toThrow();
  });
});

describe('arredondarKg', () => {
  it('corta o resto do ponto flutuante', () => {
    expect(arredondarKg(0.1 + 0.2)).toBe(0.3);
    expect(arredondarKg(12.5)).toBe(12.5);
  });
});

describe('arredondarParaBaixo', () => {
  it.each([
    [10, 2, 10],
    [3.5, 5, 0],
    [11.5, 2.5, 10],
    [7, 3.5, 7],
    [1.2, 2, 0],
  ])('maior múltiplo de %d com passo %d é %d', (x, passo, esperado) => {
    expect(arredondarParaBaixo(x, passo)).toBe(esperado);
  });
});

describe('resultadoDoEvento', () => {
  it.each([
    ['aumento_reps', 'bateu'],
    ['aumento_carga', 'bateu'],
    ['manteve', 'nao_bateu'],
    ['deload', 'nao_bateu'],
    ['sem_mudanca', 'pulou'],
  ] as const)('%s → %s', (evento, resultado) => {
    expect(resultadoDoEvento(evento)).toBe(resultado);
  });
});

describe('descreverMudanca', () => {
  it('guarda a meta de antes e a nova', () => {
    const antes = estado(10, 11);
    const proxima = calcularProxima(antes, { cargaKg: 10, reps: [12, 12, 12] }, HALTER);
    expect(descreverMudanca(antes, proxima)).toEqual({
      tipo: 'aumento_carga',
      cargaDe: 10,
      cargaPara: 12,
      repsDe: 11,
      repsPara: 8,
    });
  });

  it('no primeiro registro, a meta de antes é null', () => {
    const proxima = calcularProxima(null, { cargaKg: 10, reps: [8, 8, 8] }, HALTER);
    expect(descreverMudanca(null, proxima)).toMatchObject({ cargaDe: null, repsDe: null, cargaPara: 10, repsPara: 9 });
  });
});
