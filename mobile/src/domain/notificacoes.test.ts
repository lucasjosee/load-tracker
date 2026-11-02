import { planejarNotificacoes, textoDoAvisoDeTreino, type Planejamento, type TreinoDoAviso } from './notificacoes';

const PUSH: TreinoDoAviso = {
  nome: 'Push',
  itens: [
    { nome: 'Crucifixo', estado: { cargaKg: 14, repsAlvo: 11 }, mudanca: { tipo: 'aumento_reps', cargaDe: 14, cargaPara: 14, repsDe: 10, repsPara: 11 } },
    { nome: 'Supino inclinado', estado: { cargaKg: 12, repsAlvo: 8 }, mudanca: { tipo: 'aumento_carga', cargaDe: 10, cargaPara: 12, repsDe: 12, repsPara: 8 } },
    { nome: 'Desenvolvimento', estado: { cargaKg: 14, repsAlvo: 9 }, mudanca: null },
    { nome: 'Tríceps corda', estado: { cargaKg: 17.5, repsAlvo: 9 }, mudanca: null },
    { nome: 'Tríceps testa', estado: { cargaKg: 10, repsAlvo: 9 }, mudanca: null },
  ],
};

describe('textoDoAvisoDeTreino (§6)', () => {
  it('título com o treino; corpo com 2 exercícios, mudança de carga primeiro, e o resto', () => {
    expect(textoDoAvisoDeTreino(PUSH)).toEqual({
      titulo: 'Hoje: Push',
      corpo: 'Supino inclinado 12 kg × 8 (↑ +2 kg) · Crucifixo 14 kg × 11 · e mais 3',
    });
  });

  it('sem "e mais" quando cabe tudo', () => {
    const curto = { nome: 'Legs', itens: PUSH.itens.slice(2, 3) };
    expect(textoDoAvisoDeTreino(curto).corpo).toBe('Desenvolvimento 14 kg × 9');
  });

  it('treino sem exercícios', () => {
    expect(textoDoAvisoDeTreino({ nome: 'Legs', itens: [] })).toEqual({ titulo: 'Hoje: Legs', corpo: 'Bom treino!' });
  });
});

describe('planejarNotificacoes', () => {
  // Segunda 02/11. Treina segunda, quarta e sexta.
  const base: Planejamento = {
    hoje: '2026-11-02',
    agora: { hora: 6, minuto: 0 },
    horarioDoAviso: { hora: 7, minuto: 0 },
    treinoDoDia: (dia) => ([1, 3, 5].includes(dia) ? PUSH : null),
    treinoDeHojeFinalizado: false,
  };

  it('agenda aviso e lembrete em cada dia de treino dos próximos 7 dias', () => {
    const plano = planejarNotificacoes(base);
    expect(plano.map((n) => n.id)).toEqual([
      'treino-2026-11-02',
      'lembrete-2026-11-02',
      'treino-2026-11-04',
      'lembrete-2026-11-04',
      'treino-2026-11-06',
      'lembrete-2026-11-06',
    ]);
    expect(plano[1]).toMatchObject({ horario: { hora: 21, minuto: 0 }, titulo: 'Registrou o treino de hoje?' });
  });

  it('a próxima segunda (daqui a 7 dias) fica para o próximo reagendamento', () => {
    expect(planejarNotificacoes(base).some((n) => n.data === '2026-11-09')).toBe(false);
  });

  it('hoje, não agenda o que já passou', () => {
    const plano = planejarNotificacoes({ ...base, agora: { hora: 12, minuto: 0 } });
    expect(plano[0].id).toBe('lembrete-2026-11-02');
    const anoite = planejarNotificacoes({ ...base, agora: { hora: 21, minuto: 30 } });
    expect(anoite[0].id).toBe('treino-2026-11-04');
  });

  it('treino de hoje finalizado: nada mais hoje, nem o lembrete', () => {
    const plano = planejarNotificacoes({ ...base, agora: { hora: 19, minuto: 0 }, treinoDeHojeFinalizado: true });
    expect(plano.some((n) => n.data === '2026-11-02')).toBe(false);
    expect(plano).toHaveLength(4);
  });

  it('treino todo dia não passa de 14 notificações', () => {
    expect(planejarNotificacoes({ ...base, treinoDoDia: () => PUSH })).toHaveLength(14);
  });

  it('sem divisão, nada é agendado', () => {
    expect(planejarNotificacoes({ ...base, treinoDoDia: () => null })).toEqual([]);
  });
});
