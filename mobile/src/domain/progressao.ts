// Motor de progressão: dupla progressão com falhas e deload (§5.3).
// Função pura: a mesma entrada dá sempre a mesma saída, sem banco, data ou rede.

import type { ConfigExercicio, EstadoProgressao, Evento, Realizado } from './tipos';

export interface Proxima {
  estado: EstadoProgressao;
  evento: Evento;
}

// Cargas são `number` com casas decimais (12,5 kg). Somas como 0,1 + 0,2 em
// ponto flutuante dão 0,30000000000000004; arredondar em centésimos depois de
// cada conta impede que esse resto se acumule e apareça na tela.
export function arredondarKg(kg: number): number {
  return Math.round(kg * 100) / 100;
}

// Maior múltiplo de `passo` que é ≤ `x` (§5.3). O 1e-9 protege divisões que
// deveriam dar inteiro e dão 2,9999999999 por causa do ponto flutuante.
export function arredondarParaBaixo(x: number, passo: number): number {
  return arredondarKg(Math.floor(x / passo + 1e-9) * passo);
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo);
}

export function calcularProxima(
  estado: EstadoProgressao | null,
  realizado: Realizado,
  config: ConfigExercicio,
): Proxima {
  // Passo 1: "Pulei" não muda nada.
  if (realizado === 'PULOU') {
    if (estado === null) {
      // A tela só oferece "Pulei" para exercício com meta; chegar aqui é bug.
      throw new Error('Não dá para pular um exercício que ainda não tem meta.');
    }
    return { estado, evento: 'sem_mudanca' };
  }

  const cargaFeita = arredondarKg(realizado.cargaKg);

  // Passo 2: primeiro registro do exercício. A carga feita vira a meta e as
  // reps começam no início da faixa.
  const atual = estado ?? { cargaKg: cargaFeita, repsAlvo: config.repsMin, falhas: 0 };

  // Passo 3: se a pessoa usou outra carga por conta própria, essa carga vira a
  // nova base e a contagem recomeça do início da faixa.
  const mudouCarga = cargaFeita !== atual.cargaKg;
  const base = mudouCarga ? cargaFeita : atual.cargaKg;
  const falhasAntes = mudouCarga ? 0 : atual.falhas;
  const repsReferencia = mudouCarga ? config.repsMin : atual.repsAlvo;

  // Passo 4: só contam as primeiras `seriesAlvo` séries. Séries extras não
  // ajudam a bater a meta; séries a menos fazem perder.
  const seriesQueContam = realizado.reps.slice(0, config.seriesAlvo);
  const minReps = Math.min(...seriesQueContam);
  const bateu = seriesQueContam.length >= config.seriesAlvo && minReps >= repsReferencia;

  // Passo 5: bateu a meta.
  if (bateu) {
    if (config.incrementoKg === 0) {
      // Peso corporal: sem carga para subir, progride só em reps.
      return { estado: { cargaKg: base, repsAlvo: minReps + 1, falhas: 0 }, evento: 'aumento_reps' };
    }
    if (minReps >= config.repsMax) {
      // Chegou no topo da faixa em todas as séries: sobe a carga e as reps voltam ao início.
      return {
        estado: { cargaKg: arredondarKg(base + config.incrementoKg), repsAlvo: config.repsMin, falhas: 0 },
        evento: 'aumento_carga',
      };
    }
    return {
      estado: { cargaKg: base, repsAlvo: limitar(minReps + 1, config.repsMin, config.repsMax), falhas: 0 },
      evento: 'aumento_reps',
    };
  }

  // Passo 6: não bateu.
  const falhas = falhasAntes + 1;
  if (config.incrementoKg > 0 && falhas >= config.limiteFalhas) {
    // Deload: recua ~10% da carga, nunca menos que um incremento, e nunca
    // abaixo de um incremento (o halter mais leve continua sendo um halter).
    // `base / 10` em vez de `base * 0.1`: 35 * 0.1 dá 3.5000000000000004,
    // enquanto a divisão por 10 sai exata sempre que o resultado cabe no número.
    const reducao = Math.max(config.incrementoKg, arredondarParaBaixo(base / 10, config.incrementoKg));
    return {
      estado: {
        cargaKg: arredondarKg(Math.max(config.incrementoKg, base - reducao)),
        repsAlvo: config.repsMin,
        falhas: 0,
      },
      evento: 'deload',
    };
  }
  return { estado: { cargaKg: base, repsAlvo: repsReferencia, falhas }, evento: 'manteve' };
}
