import { formatarHorario, horarioDoAviso, lerHorario, somarMinutos } from './horario';

describe('lerHorario', () => {
  it('lê HH:MM e H:MM', () => {
    expect(lerHorario('07:30')).toEqual({ hora: 7, minuto: 30 });
    expect(lerHorario('7:05')).toEqual({ hora: 7, minuto: 5 });
  });

  it('recusa o que não é horário', () => {
    expect(lerHorario('24:00')).toBeNull();
    expect(lerHorario('12:60')).toBeNull();
    expect(lerHorario('18h')).toBeNull();
    expect(lerHorario('')).toBeNull();
  });
});

describe('formatarHorario', () => {
  it('completa com zero à esquerda', () => {
    expect(formatarHorario({ hora: 7, minuto: 5 })).toBe('07:05');
  });
});

describe('somarMinutos', () => {
  it('soma e subtrai dentro do dia', () => {
    expect(somarMinutos({ hora: 18, minuto: 0 }, -30)).toEqual({ hora: 17, minuto: 30 });
    expect(somarMinutos({ hora: 7, minuto: 45 }, 15)).toEqual({ hora: 8, minuto: 0 });
  });

  it('dá a volta na meia-noite nos dois sentidos', () => {
    expect(somarMinutos({ hora: 23, minuto: 45 }, 30)).toEqual({ hora: 0, minuto: 15 });
    expect(somarMinutos({ hora: 0, minuto: 10 }, -30)).toEqual({ hora: 23, minuto: 40 });
  });
});

describe('horarioDoAviso', () => {
  it('é 30 min antes do treino (§6)', () => {
    expect(horarioDoAviso({ hora: 18, minuto: 0 })).toEqual({ hora: 17, minuto: 30 });
  });
});
