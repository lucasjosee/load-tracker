import {
  diaDaSemana,
  diasEntre,
  formatarDiaMes,
  inicioDaSemana,
  listarDiasPorExtenso,
  ordenarDias,
  paraDataLocal,
  somarDias,
} from './datas';

describe('paraDataLocal', () => {
  it('usa o dia do fuso do aparelho, não o de UTC', () => {
    // Construído com componentes locais: 23h30 de 2 de novembro é dia 2 em
    // qualquer fuso, mesmo que em UTC já seja dia 3.
    expect(paraDataLocal(new Date(2026, 10, 2, 23, 30))).toBe('2026-11-02');
  });

  it('completa mês e dia com zero à esquerda', () => {
    expect(paraDataLocal(new Date(2026, 0, 5, 8, 0))).toBe('2026-01-05');
  });
});

describe('somarDias', () => {
  it('soma e subtrai dias', () => {
    expect(somarDias('2026-11-02', 1)).toBe('2026-11-03');
    expect(somarDias('2026-11-02', -2)).toBe('2026-10-31');
  });

  it('atravessa fim de ano e 29 de fevereiro', () => {
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('diaDaSemana', () => {
  it('segue a convenção de Date.getDay(): 0 = domingo', () => {
    expect(diaDaSemana('2026-11-01')).toBe(0); // domingo
    expect(diaDaSemana('2026-11-02')).toBe(1); // segunda
    expect(diaDaSemana('2026-11-07')).toBe(6); // sábado
  });
});

describe('inicioDaSemana', () => {
  it('devolve a segunda-feira da semana', () => {
    expect(inicioDaSemana('2026-11-02')).toBe('2026-11-02'); // segunda
    expect(inicioDaSemana('2026-11-05')).toBe('2026-11-02'); // quinta
  });

  it('domingo pertence à semana que começou na segunda anterior', () => {
    expect(inicioDaSemana('2026-11-08')).toBe('2026-11-02');
  });
});

describe('diasEntre', () => {
  it('conta dias de calendário nos dois sentidos', () => {
    expect(diasEntre('2026-11-02', '2026-11-30')).toBe(28);
    expect(diasEntre('2026-11-30', '2026-11-02')).toBe(-28);
    expect(diasEntre('2026-11-02', '2026-11-02')).toBe(0);
  });
});

describe('formatarDiaMes', () => {
  it('mostra dia/mês', () => {
    expect(formatarDiaMes('2026-11-12')).toBe('12/11');
  });
});

describe('ordenarDias', () => {
  it('põe a segunda primeiro e o domingo por último', () => {
    expect(ordenarDias([0, 3, 1, 6])).toEqual([1, 3, 6, 0]);
  });
});

describe('listarDiasPorExtenso', () => {
  it('junta com vírgula e "e", na ordem da semana', () => {
    expect(listarDiasPorExtenso([5, 1, 3])).toBe('Segunda, quarta e sexta');
    expect(listarDiasPorExtenso([0, 4])).toBe('Quinta e domingo');
    expect(listarDiasPorExtenso([2])).toBe('Terça');
    expect(listarDiasPorExtenso([])).toBe('');
  });
});
