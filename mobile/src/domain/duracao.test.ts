import {
  duracaoTipica,
  formatarCronometro,
  pausadoAoRetomar,
  segundosDeTreino,
  textoDuracao,
  textoPrevisaoDoTreino,
  type TemposDaSessao,
} from './duracao';

const ms = (iso: string) => new Date(iso).getTime();
const SESSAO: TemposDaSessao = { iniciadaEm: '2026-11-16T18:00:00.000Z', finalizadaEm: null, pausadaEm: null, pausadoS: 0 };

describe('segundosDeTreino', () => {
  it('em andamento: conta os segundos inteiros desde o início', () => {
    expect(segundosDeTreino(SESSAO, ms('2026-11-16T18:00:00.000Z'))).toBe(0);
    expect(segundosDeTreino(SESSAO, ms('2026-11-16T18:12:05.900Z'))).toBe(725);
  });

  it('pausada: o relógio fica parado no começo da pausa', () => {
    const pausada = { ...SESSAO, pausadaEm: '2026-11-16T18:10:00.000Z' };
    expect(segundosDeTreino(pausada, ms('2026-11-16T18:10:00.000Z'))).toBe(600);
    expect(segundosDeTreino(pausada, ms('2026-11-16T18:40:00.000Z'))).toBe(600);
  });

  it('desconta as pausas que já terminaram', () => {
    expect(segundosDeTreino({ ...SESSAO, pausadoS: 120 }, ms('2026-11-16T18:12:00.000Z'))).toBe(600);
  });

  it('encerrada: vale do início ao fim, seja qual for o agora', () => {
    const encerrada = { ...SESSAO, finalizadaEm: '2026-11-16T18:52:00.000Z', pausadoS: 120 };
    expect(segundosDeTreino(encerrada, ms('2026-11-17T09:00:00.000Z'))).toBe(50 * 60);
  });

  it('relógio atrasado no meio do treino: zero, nunca negativo', () => {
    expect(segundosDeTreino(SESSAO, ms('2026-11-16T17:59:00.000Z'))).toBe(0);
  });
});

describe('pausadoAoRetomar', () => {
  it('soma a pausa que termina agora ao que já havia', () => {
    const pausada = { ...SESSAO, pausadaEm: '2026-11-16T18:10:00.000Z', pausadoS: 30 };
    expect(pausadoAoRetomar(pausada, ms('2026-11-16T18:13:00.000Z'))).toBe(210);
  });

  it('treino encerrado e retomado: o intervalo parado não conta como treino', () => {
    const encerrada = { ...SESSAO, finalizadaEm: '2026-11-16T18:30:00.000Z' };
    const agora = ms('2026-11-16T19:00:00.000Z');
    const pausadoS = pausadoAoRetomar(encerrada, agora);
    expect(pausadoS).toBe(1800);
    // Retomada: sem fim, com a parada descontada. O tempo segue dos 30 min.
    expect(segundosDeTreino({ ...encerrada, finalizadaEm: null, pausadoS }, agora)).toBe(1800);
  });

  it('se não estava parada, não muda', () => {
    expect(pausadoAoRetomar({ ...SESSAO, pausadoS: 45 }, ms('2026-11-16T18:13:00.000Z'))).toBe(45);
  });
});

describe('formatarCronometro', () => {
  it('minutos e segundos, com hora só quando passa de uma', () => {
    expect(formatarCronometro(0)).toBe('0:00');
    expect(formatarCronometro(65)).toBe('1:05');
    expect(formatarCronometro(725)).toBe('12:05');
    expect(formatarCronometro(3725)).toBe('1:02:05');
  });
});

describe('textoDuracao', () => {
  it('em minutos, e em horas e minutos depois de uma hora', () => {
    expect(textoDuracao(52 * 60 + 40)).toBe('52 min');
    expect(textoDuracao(65 * 60)).toBe('1 h 05 min');
    expect(textoDuracao(60 * 60)).toBe('1 h 00 min');
  });

  it('menos de um minuto não vale mostrar', () => {
    expect(textoDuracao(59)).toBeNull();
  });
});

describe('duracaoTipica', () => {
  const min = (m: number) => m * 60;

  it('é a mediana, então um dia atípico não puxa a previsão', () => {
    expect(duracaoTipica([min(50), min(55), min(120)])).toBe(min(55));
    expect(duracaoTipica([min(50), min(60)])).toBe(min(55));
  });

  it('usa só as 5 sessões mais recentes', () => {
    expect(duracaoTipica([min(60), min(60), min(60), min(60), min(60), min(10), min(10), min(10)])).toBe(min(60));
  });

  it('ignora sessão curta demais para ser treino', () => {
    expect(duracaoTipica([0, min(2), min(48)])).toBe(min(48));
    expect(duracaoTipica([0, min(4)])).toBeNull();
    expect(duracaoTipica([])).toBeNull();
  });
});

describe('textoPrevisaoDoTreino', () => {
  it('arredonda a previsão de 5 em 5 minutos', () => {
    expect(textoPrevisaoDoTreino(6, 53 * 60)).toBe('6 exercícios · cerca de 55 min');
    expect(textoPrevisaoDoTreino(1, 62 * 60)).toBe('1 exercício · cerca de 1 h 00 min');
  });

  it('sem histórico, só a quantidade de exercícios', () => {
    expect(textoPrevisaoDoTreino(6, null)).toBe('6 exercícios');
  });
});
