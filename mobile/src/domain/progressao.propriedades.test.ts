// Testes de propriedade (§5.3): em vez de casos escolhidos a dedo, geram
// milhares de situações aleatórias e conferem regras que valem para todas.
//
// O gerador é "pseudoaleatório com semente": a mesma semente produz sempre a
// mesma sequência. Se um teste falhar, ele falha igual na próxima execução,
// o que permite investigar (com Math.random, o caso sumiria).

import { calcularProxima, recalcularEstado } from './progressao';
import type { ConfigExercicio, EstadoProgressao, Realizado } from './tipos';

const RODADAS = 2000;

// mulberry32: gerador pequeno e conhecido; devolve números em [0, 1).
function criarGerador(semente: number): () => number {
  let a = semente;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Caso {
  config: ConfigExercicio;
  estado: EstadoProgressao;
  realizado: Realizado;
}

function criarSorteios(semente: number) {
  const aleatorio = criarGerador(semente);
  const inteiro = (min: number, max: number) => min + Math.floor(aleatorio() * (max - min + 1));
  const umDe = <T>(opcoes: readonly T[]): T => opcoes[inteiro(0, opcoes.length - 1)];

  function config(): ConfigExercicio {
    const repsMin = inteiro(4, 10);
    return {
      repsMin,
      repsMax: repsMin + inteiro(2, 6),
      seriesAlvo: inteiro(1, 5),
      incrementoKg: umDe([0, 1, 2, 2.5, 3.5, 5]),
      limiteFalhas: inteiro(2, 4),
    };
  }

  // Estado que o app pode ter salvo: carga em múltiplos do incremento (a
  // partir de um incremento) e reps dentro da faixa.
  function estado(c: ConfigExercicio): EstadoProgressao {
    return {
      cargaKg: c.incrementoKg === 0 ? 0 : c.incrementoKg * inteiro(1, 60),
      repsAlvo: inteiro(c.repsMin, c.repsMax),
      falhas: inteiro(0, c.limiteFalhas - 1),
    };
  }

  function realizado(c: ConfigExercicio, e: EstadoProgressao): Realizado {
    const sorteio = aleatorio();
    if (sorteio < 0.15) {
      return 'PULOU';
    }
    // 15% das vezes a pessoa usa outra carga por conta própria.
    const cargaKg =
      sorteio < 0.3 && c.incrementoKg > 0
        ? Math.max(c.incrementoKg, e.cargaKg + c.incrementoKg * inteiro(-1, 3))
        : e.cargaKg;
    const quantasSeries = Math.max(0, c.seriesAlvo + inteiro(-1, 1));
    const reps = Array.from({ length: quantasSeries }, () =>
      Math.max(0, inteiro(e.repsAlvo - 3, c.repsMax + 2)),
    );
    return { cargaKg, reps };
  }

  function caso(): Caso {
    const c = config();
    const e = estado(c);
    return { config: c, estado: e, realizado: realizado(c, e) };
  }

  return { caso, config, estado, realizado, inteiro };
}

// Executa `verificar` em RODADAS casos diferentes. Cada propriedade tem a sua
// semente, então mudar uma não muda os casos das outras.
function paraCadaCaso(semente: number, verificar: (caso: Caso) => void): void {
  const sorteios = criarSorteios(semente);
  for (let i = 0; i < RODADAS; i++) {
    verificar(sorteios.caso());
  }
}

function minimoDasSeriesAlvo(reps: number[], seriesAlvo: number): number {
  return Math.min(...reps.slice(0, seriesAlvo));
}

describe('calcularProxima: propriedades da §5.3', () => {
  it('a carga só sobe se a pessoa fez repsMax em todas as séries alvo', () => {
    paraCadaCaso(1, ({ config, estado, realizado }) => {
      if (realizado === 'PULOU') {
        return;
      }
      const { estado: novo } = calcularProxima(estado, realizado, config);
      if (novo.cargaKg > realizado.cargaKg) {
        expect(realizado.reps.length).toBeGreaterThanOrEqual(config.seriesAlvo);
        expect(minimoDasSeriesAlvo(realizado.reps, config.seriesAlvo)).toBeGreaterThanOrEqual(
          config.repsMax,
        );
      }
    });
  });

  it('"Pulei" nunca altera nada', () => {
    paraCadaCaso(2, ({ config, estado }) => {
      expect(calcularProxima(estado, 'PULOU', config)).toEqual({ estado, evento: 'sem_mudanca' });
    });
  });

  it('mantida a carga, toda carga nova = anterior ± múltiplos do incremento', () => {
    paraCadaCaso(3, ({ config, estado, realizado }) => {
      if (realizado === 'PULOU' || realizado.cargaKg !== estado.cargaKg) {
        return;
      }
      const { estado: novo } = calcularProxima(estado, realizado, config);
      if (config.incrementoKg === 0) {
        expect(novo.cargaKg).toBe(estado.cargaKg);
      } else {
        const passos = (novo.cargaKg - estado.cargaKg) / config.incrementoKg;
        expect(Math.abs(passos - Math.round(passos))).toBeLessThan(1e-9);
      }
    });
  });

  it('a carga nunca fica abaixo de um incremento', () => {
    paraCadaCaso(4, ({ config, estado, realizado }) => {
      if (realizado !== 'PULOU' && realizado.cargaKg >= config.incrementoKg) {
        const { estado: novo } = calcularProxima(estado, realizado, config);
        expect(novo.cargaKg).toBeGreaterThanOrEqual(config.incrementoKg);
      }
    });
  });

  it('é pura: mesma entrada, mesma saída, e não altera o que recebeu', () => {
    paraCadaCaso(5, ({ config, estado, realizado }) => {
      const copias = JSON.parse(JSON.stringify({ config, estado, realizado }));
      const primeira = calcularProxima(estado, realizado, config);
      const segunda = calcularProxima(estado, realizado, config);
      expect(segunda).toEqual(primeira);
      expect({ config, estado, realizado }).toEqual(copias);
    });
  });

  it('as reps alvo ficam dentro da faixa quando há carga para progredir', () => {
    paraCadaCaso(6, ({ config, estado, realizado }) => {
      if (config.incrementoKg === 0) {
        return; // peso corporal sobe reps sem teto (§5.3, passo 5a)
      }
      const { estado: novo } = calcularProxima(estado, realizado, config);
      expect(novo.repsAlvo).toBeGreaterThanOrEqual(config.repsMin);
      expect(novo.repsAlvo).toBeLessThanOrEqual(config.repsMax);
    });
  });

  it('as falhas nunca chegam ao limite em exercício com carga (o deload zera antes)', () => {
    paraCadaCaso(7, ({ config, estado, realizado }) => {
      if (config.incrementoKg > 0) {
        const { estado: novo } = calcularProxima(estado, realizado, config);
        expect(novo.falhas).toBeLessThan(config.limiteFalhas);
      }
    });
  });
});

describe('recalcularEstado', () => {
  const HALTER: ConfigExercicio = {
    repsMin: 8,
    repsMax: 12,
    seriesAlvo: 3,
    incrementoKg: 2,
    limiteFalhas: 3,
  };

  it('sem registros, não há estado', () => {
    expect(recalcularEstado([], HALTER)).toBeNull();
  });

  it('só com "Pulei", continua sem estado', () => {
    expect(recalcularEstado(['PULOU', 'PULOU'], HALTER)).toBeNull();
  });

  it('reconstrói o fim do exemplo da §5.4', () => {
    const historico: Realizado[] = [
      { cargaKg: 10, reps: [8, 8, 8] },
      { cargaKg: 10, reps: [9, 9, 9] },
      { cargaKg: 10, reps: [11, 10, 10] },
      'PULOU',
      { cargaKg: 10, reps: [12, 12, 12] },
      { cargaKg: 12, reps: [8, 7, 6] },
      { cargaKg: 12, reps: [8, 8, 7] },
      { cargaKg: 12, reps: [7, 7, 6] },
      { cargaKg: 10, reps: [9, 9, 8] },
    ];
    expect(recalcularEstado(historico, HALTER)).toEqual({ cargaKg: 10, repsAlvo: 9, falhas: 0 });
  });

  it('aplicar o motor registro a registro chega no mesmo estado que recalcular do zero', () => {
    // Simula o app: a cada check-in, o motor roda sobre o estado salvo e o
    // resultado é salvo de novo. No fim, o recálculo tem que bater.
    const sorteios = criarSorteios(8);
    for (let historicoN = 0; historicoN < 200; historicoN++) {
      const config = sorteios.config();
      const primeira: Realizado = {
        cargaKg: config.incrementoKg * sorteios.inteiro(1, 40),
        reps: Array.from({ length: config.seriesAlvo }, () => sorteios.inteiro(1, config.repsMax)),
      };
      const historico: Realizado[] = [primeira];
      let salvo = calcularProxima(null, primeira, config).estado;

      const sessoes = sorteios.inteiro(1, 40);
      for (let sessao = 0; sessao < sessoes; sessao++) {
        const realizado = sorteios.realizado(config, salvo);
        historico.push(realizado);
        salvo = calcularProxima(salvo, realizado, config).estado;
      }

      expect(recalcularEstado(historico, config)).toEqual(salvo);
    }
  });
});
