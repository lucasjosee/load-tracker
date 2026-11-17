import { formatarCronometro, segundosDeTreino, textoDuracao } from './duracao';

describe('segundosDeTreino', () => {
  const inicio = '2026-11-16T18:00:00.000Z';
  const ms = (iso: string) => new Date(iso).getTime();

  it('conta os segundos inteiros desde o início', () => {
    expect(segundosDeTreino(inicio, ms('2026-11-16T18:00:00.000Z'))).toBe(0);
    expect(segundosDeTreino(inicio, ms('2026-11-16T18:12:05.900Z'))).toBe(725);
  });

  it('relógio atrasado no meio do treino: zero, nunca negativo', () => {
    expect(segundosDeTreino(inicio, ms('2026-11-16T17:59:00.000Z'))).toBe(0);
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
