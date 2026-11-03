import {
  formatarKg,
  formatarNumero,
  formatarPercentual,
  fraseAumentosDoMes,
  fraseVariacaoDoGrupo,
  lerNumero,
  motivoDaMeta,
  seloDaMeta,
  textoEstagnacao,
  textoDoDia,
  textoDoEvento,
  textoDoGrupo,
  textoMeta,
  textoProximoTreino,
  textoRealizado,
  textoResumoDaSemana,
  textoResumoDaSessao,
  textoTreinoPerdido,
  textoSeries,
} from './textos';
import type { ConfigExercicio, MudancaDeMeta } from './tipos';

const HALTER: ConfigExercicio = { repsMin: 8, repsMax: 12, seriesAlvo: 3, incrementoKg: 2, limiteFalhas: 3 };

function mudanca(
  tipo: MudancaDeMeta['tipo'],
  de: [number, number] | null,
  para: [number, number],
): MudancaDeMeta {
  return {
    tipo,
    cargaDe: de?.[0] ?? null,
    repsDe: de?.[1] ?? null,
    cargaPara: para[0],
    repsPara: para[1],
  };
}

describe('formatarNumero e formatarKg', () => {
  it('usa vírgula e não mostra zeros sobrando', () => {
    expect(formatarKg(12.5)).toBe('12,5');
    expect(formatarKg(10)).toBe('10');
    expect(formatarKg(0.1 + 0.2)).toBe('0,3');
  });

  it('respeita o máximo de casas', () => {
    expect(formatarNumero(12.666, 1)).toBe('12,7');
  });
});

describe('formatarPercentual', () => {
  it('mostra sinal e arredonda para inteiro', () => {
    expect(formatarPercentual(0.08)).toBe('+8%');
    expect(formatarPercentual(-0.031)).toBe('−3%');
    expect(formatarPercentual(0.004)).toBe('0%');
  });
});

describe('lerNumero', () => {
  it('aceita vírgula ou ponto e espaços em volta', () => {
    expect(lerNumero('12,5')).toBe(12.5);
    expect(lerNumero(' 12.5 ')).toBe(12.5);
    expect(lerNumero('20')).toBe(20);
  });

  it('recusa vazio, negativo e texto', () => {
    expect(lerNumero('')).toBeNull();
    expect(lerNumero('-5')).toBeNull();
    expect(lerNumero('12kg')).toBeNull();
    expect(lerNumero('1,2,3')).toBeNull();
  });
});

describe('textoMeta e textoSeries', () => {
  it('mostra carga × reps', () => {
    expect(textoMeta({ cargaKg: 12.5, repsAlvo: 8 })).toBe('12,5 kg × 8');
  });

  it('peso corporal mostra só as reps', () => {
    expect(textoMeta({ cargaKg: 0, repsAlvo: 13 })).toBe('13 reps');
  });

  it('textoRealizado lista as reps de cada série', () => {
    expect(textoRealizado(22.5, [9, 9, 8])).toBe('22,5 kg × 9, 9, 8');
    expect(textoRealizado(0, [12, 12, 10])).toBe('12, 12, 10 reps');
    expect(textoRealizado(20, [])).toBe('nenhuma série');
  });

  it('séries no singular e no plural', () => {
    expect(textoSeries(1)).toBe('1 série');
    expect(textoSeries(4)).toBe('4 séries');
  });
});

describe('motivoDaMeta (§5.5)', () => {
  it('aumento_reps', () => {
    const texto = motivoDaMeta(
      { cargaKg: 10, repsAlvo: 10, falhas: 0 },
      mudanca('aumento_reps', [10, 9], [10, 10]),
      HALTER,
    );
    expect(texto).toBe('Você fez 9 reps. Hoje: tente 10.');
  });

  it('aumento_carga', () => {
    const texto = motivoDaMeta(
      { cargaKg: 12, repsAlvo: 8, falhas: 0 },
      mudanca('aumento_carga', [10, 11], [12, 8]),
      HALTER,
    );
    expect(texto).toBe('Você chegou a 12 reps. Hora de subir +2 kg.');
  });

  it('manteve, com o contador de falhas', () => {
    const texto = motivoDaMeta(
      { cargaKg: 12, repsAlvo: 8, falhas: 1 },
      mudanca('manteve', [12, 8], [12, 8]),
      HALTER,
    );
    expect(texto).toBe('Ainda faltou bater 8 em todas as séries. Mesma meta (1/3).');
  });

  it('manteve em peso corporal não mostra contador (não existe deload)', () => {
    const texto = motivoDaMeta(
      { cargaKg: 0, repsAlvo: 15, falhas: 4 },
      mudanca('manteve', [0, 15], [0, 15]),
      { ...HALTER, incrementoKg: 0 },
    );
    expect(texto).toBe('Ainda faltou bater 15 em todas as séries. Mesma meta.');
  });

  it('deload', () => {
    const texto = motivoDaMeta(
      { cargaKg: 10, repsAlvo: 8, falhas: 0 },
      mudanca('deload', [12, 8], [10, 8]),
      HALTER,
    );
    expect(texto).toBe('3 treinos sem progredir. Recuo de 2 kg pra retomar o ritmo.');
  });

  it('primeira meta', () => {
    const estado = { cargaKg: 10, repsAlvo: 9, falhas: 0 };
    const esperado = 'Ponto de partida: 10 kg × 9.';
    expect(motivoDaMeta(estado, mudanca('aumento_reps', null, [10, 9]), HALTER)).toBe(esperado);
    expect(motivoDaMeta(estado, null, HALTER)).toBe(esperado);
  });
});

describe('seloDaMeta (§3.2)', () => {
  it.each([
    ['aumento de reps', mudanca('aumento_reps', [10, 9], [10, 10]), '↑ +1 rep', 'sobe'],
    ['vários reps', mudanca('aumento_reps', [10, 9], [10, 12]), '↑ +3 reps', 'sobe'],
    ['aumento de carga', mudanca('aumento_carga', [10, 12], [12, 8]), '↑ +2 kg', 'sobe'],
    ['deload', mudanca('deload', [12, 8], [10, 8]), '↓ deload', 'desce'],
    ['manteve', mudanca('manteve', [12, 8], [12, 8]), '= mantém', 'mantem'],
    ['carga menor por conta própria', mudanca('aumento_reps', [14, 9], [12, 9]), '↓ −2 kg', 'desce'],
    ['primeira meta', mudanca('aumento_reps', null, [10, 9]), 'início', 'inicio'],
  ] as const)('%s', (_caso, entrada, texto, direcao) => {
    expect(seloDaMeta(entrada)).toEqual({ texto, direcao });
  });

  it('sem histórico é início', () => {
    expect(seloDaMeta(null)).toEqual({ texto: 'início', direcao: 'inicio' });
  });
});

describe('textoEstagnacao (§7)', () => {
  it('por falta de aumento', () => {
    expect(textoEstagnacao('Supino inclinado', { motivo: 'sem_aumento', sessoes: 3 })).toBe(
      'Supino inclinado sem evolução há 3 treinos',
    );
  });

  it('por falhas seguidas', () => {
    expect(textoEstagnacao('Supino reto', { motivo: 'falhas', falhas: 2 })).toBe(
      'Supino reto: 2 treinos seguidos sem bater a meta',
    );
  });
});

describe('frases de feedback (§7)', () => {
  it('variação do grupo', () => {
    expect(fraseVariacaoDoGrupo('peito', 0.08)).toBe('Peito: +8% de força em 4 semanas');
    expect(fraseVariacaoDoGrupo('biceps', -0.02)).toBe('Bíceps: −2% de força em 4 semanas');
  });

  it('aumentos do mês, no singular e no plural', () => {
    expect(fraseAumentosDoMes(6)).toBe('Este mês: 6 aumentos de carga');
    expect(fraseAumentosDoMes(1)).toBe('Este mês: 1 aumento de carga');
  });
});

describe('textos da aba Hoje', () => {
  it('textoDoDia', () => {
    expect(textoDoDia('2026-11-02')).toBe('Segunda, 02/11');
  });

  it('textoProximoTreino diz "Amanhã" ou o dia da semana', () => {
    expect(textoProximoTreino({ data: '2026-11-06', diaSemana: 5, nome: 'Upper', emDias: 1 })).toBe('Amanhã: Upper');
    expect(textoProximoTreino({ data: '2026-11-09', diaSemana: 1, nome: 'Push', emDias: 4 })).toBe('Segunda: Push');
  });

  it('textoResumoDaSemana', () => {
    expect(textoResumoDaSemana(3, 72)).toBe('Esta semana: 3 treinos · 72 séries');
    expect(textoResumoDaSemana(1, 1)).toBe('Esta semana: 1 treino · 1 série');
    expect(textoResumoDaSemana(0, 0)).toBe('Nenhum treino registrado esta semana.');
  });
});

describe('textoResumoDaSessao', () => {
  it('conta progressões, mantidos, deloads e pulados', () => {
    expect(textoResumoDaSessao(['aumento_reps', 'aumento_carga', 'aumento_reps', 'manteve', 'manteve'])).toBe(
      '3 progressões, 2 mantidos',
    );
    expect(textoResumoDaSessao(['aumento_reps', 'deload', 'sem_mudanca'])).toBe('1 progressão, 1 deload, 1 pulado');
  });

  it('sessão vazia', () => {
    expect(textoResumoDaSessao([])).toBe('Nenhum exercício registrado.');
  });
});

describe('textoTreinoPerdido', () => {
  it('segue a §3.5', () => {
    expect(textoTreinoPerdido('Peito')).toBe('Você não registrou Peito ontem. Fazer hoje?');
  });
});

describe('textoDoGrupo', () => {
  it('variação e séries da semana', () => {
    expect(textoDoGrupo(0.08, 14)).toBe('+8% em 4 semanas · 14 séries esta semana');
    expect(textoDoGrupo(null, 1)).toBe('Sem histórico ainda · 1 série esta semana');
  });
});

describe('textoDoEvento', () => {
  it.each([
    [mudanca('aumento_carga', [10, 12], [12, 8]), '↑ carga: 12 kg × 8'],
    [mudanca('aumento_reps', [10, 9], [10, 10]), '↑ reps: 10 kg × 10'],
    [mudanca('manteve', [12, 8], [12, 8]), '= mantém: 12 kg × 8'],
    [mudanca('deload', [12, 8], [10, 8]), '↓ deload: 10 kg × 8'],
    [mudanca('aumento_reps', null, [10, 9]), 'Início: 10 kg × 9'],
  ] as const)('%#: %s', (entrada, esperado) => {
    expect(textoDoEvento(entrada)).toBe(esperado);
  });
});
