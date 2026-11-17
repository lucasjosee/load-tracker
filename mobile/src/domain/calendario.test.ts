import {
  melhorMes,
  montarCalendario,
  nivelDoTreino,
  textoDoCalendario,
  textoMelhorMes,
  type RegistrosDoDia,
} from './calendario';

// 16/11/2026 é uma segunda. Divisão: seg, ter, qua, sex e sáb.
const HOJE = '2026-11-16';
const DIVISAO = [1, 2, 3, 5, 6];
const treino = (data: string, batidas = 6, total = 6): RegistrosDoDia => ({ data, total, batidas });
const dia = (calendario: ReturnType<typeof montarCalendario>, data: string) =>
  calendario.semanas.flat().find((d) => d.data === data);

describe('nivelDoTreino', () => {
  it('todas as metas, pelo menos metade, ou menos', () => {
    expect(nivelDoTreino(6, 6)).toBe(2);
    expect(nivelDoTreino(3, 6)).toBe(1);
    expect(nivelDoTreino(2, 6)).toBe(0);
    expect(nivelDoTreino(0, 4)).toBe(0);
  });
});

describe('montarCalendario', () => {
  it('monta as semanas de segunda a domingo, terminando na semana de hoje', () => {
    const calendario = montarCalendario(HOJE, DIVISAO, [], 3);
    expect(calendario.semanas).toHaveLength(3);
    expect(calendario.semanas[0]?.[0]?.data).toBe('2026-11-02');
    expect(calendario.semanas[2]?.map((d) => d.data)).toEqual([
      '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22',
    ]);
  });

  it('classifica cada dia', () => {
    const calendario = montarCalendario(HOJE, DIVISAO, [treino('2026-11-09'), treino('2026-11-10', 3)], 3);
    expect(dia(calendario, '2026-11-03')?.situacao).toBe('antes'); // antes do primeiro treino
    expect(dia(calendario, '2026-11-09')).toMatchObject({ situacao: 'treinou', nivel: 2 });
    expect(dia(calendario, '2026-11-10')).toMatchObject({ situacao: 'treinou', nivel: 1 });
    expect(dia(calendario, '2026-11-11')?.situacao).toBe('faltou'); // quarta, dia de treino
    expect(dia(calendario, '2026-11-12')?.situacao).toBe('descanso'); // quinta
    expect(dia(calendario, '2026-11-16')?.situacao).toBe('hoje');
    expect(dia(calendario, '2026-11-17')?.situacao).toBe('futuro');
  });

  it('treino em dia de descanso conta como treino, e dia só com pulados não', () => {
    const calendario = montarCalendario(HOJE, DIVISAO, [treino('2026-11-09'), treino('2026-11-12'), treino('2026-11-13', 0, 0)], 2);
    expect(dia(calendario, '2026-11-12')?.situacao).toBe('treinou');
    expect(dia(calendario, '2026-11-13')?.situacao).toBe('faltou');
    expect(calendario.treinos).toBe(2);
  });

  it('sem nenhum registro, não há falta: a pessoa ainda não começou', () => {
    const calendario = montarCalendario(HOJE, DIVISAO, [], 2);
    expect(calendario.semanas.flat().some((d) => d.situacao === 'faltou')).toBe(false);
    expect(dia(calendario, '2026-11-16')?.situacao).toBe('hoje');
    expect(calendario).toMatchObject({ treinos: 0, sequenciaAtual: 0, maiorSequencia: 0 });
  });

  it('marca a semana em que um mês começa', () => {
    const calendario = montarCalendario(HOJE, DIVISAO, [], 4);
    // Semanas de 26/10, 02/11, 09/11 e 16/11: o dia 1º de novembro cai na primeira.
    expect(calendario.rotulos).toEqual([11, null, null, null]);
  });

  describe('sequência de semanas', () => {
    const semanaCheia = (segunda: string) => {
      const dias = [0, 1, 2, 4, 5]; // seg, ter, qua, sex, sáb
      const base = new Date(`${segunda}T00:00:00Z`).getTime();
      return dias.map((d) => treino(new Date(base + d * 86400000).toISOString().slice(0, 10)));
    };

    it('conta as semanas sem falta, e a semana atual sem nada não quebra', () => {
      const registros = [...semanaCheia('2026-11-02'), ...semanaCheia('2026-11-09')];
      expect(montarCalendario(HOJE, DIVISAO, registros, 4)).toMatchObject({ sequenciaAtual: 2, maiorSequencia: 2 });
    });

    it('uma falta zera a sequência atual, mas a maior fica', () => {
      const registros = [...semanaCheia('2026-10-26'), ...semanaCheia('2026-11-02'), treino('2026-11-09')];
      expect(montarCalendario(HOJE, DIVISAO, registros, 4)).toMatchObject({ sequenciaAtual: 0, maiorSequencia: 2 });
    });

    it('treinar hoje já soma a semana atual', () => {
      const registros = [...semanaCheia('2026-11-09'), treino(HOJE)];
      expect(montarCalendario(HOJE, DIVISAO, registros, 4).sequenciaAtual).toBe(2);
    });
  });

  it('soma os treinos dos últimos 12 meses, do mais antigo para o atual', () => {
    const calendario = montarCalendario(HOJE, DIVISAO, [treino('2025-12-10'), treino('2026-11-09'), treino('2026-11-10')]);
    expect(calendario.porMes).toHaveLength(12);
    expect(calendario.porMes[0]).toEqual({ mes: 12, treinos: 1 });
    expect(calendario.porMes[11]).toEqual({ mes: 11, treinos: 2 });
  });
});

describe('melhorMes e textoMelhorMes', () => {
  it('o mês com mais treinos; no empate, o mais recente', () => {
    const porMes = [{ mes: 9, treinos: 20 }, { mes: 10, treinos: 22 }, { mes: 11, treinos: 22 }];
    expect(melhorMes(porMes)).toEqual({ mes: 11, treinos: 22 });
    expect(textoMelhorMes(porMes)).toBe('Seu melhor mês foi novembro, com 22 treinos.');
    expect(textoMelhorMes([{ mes: 3, treinos: 1 }])).toBe('Seu melhor mês foi março, com 1 treino.');
  });

  it('sem treino nenhum, não há melhor mês', () => {
    expect(textoMelhorMes([{ mes: 11, treinos: 0 }])).toBeNull();
  });
});

describe('textoDoCalendario', () => {
  it('resume em palavras, para o leitor de tela', () => {
    const calendario = montarCalendario(HOJE, DIVISAO, [treino('2026-11-09')], 2);
    expect(textoDoCalendario(calendario)).toBe('1 treino nos últimos 12 meses, 0 semanas seguidas');
  });
});
