import { DIVISAO_SEED } from './seed';

// O banco também barra boa parte disto (CHECK no schema), mas lá o erro só
// aparece no iPhone, ao abrir o app. Aqui ele aparece no `npm run check`.
const exercicios = DIVISAO_SEED.flatMap((treino) => treino.exercicios);

describe('DIVISAO_SEED', () => {
  it('tem no máximo um treino por dia, entre 0 (domingo) e 6 (sábado)', () => {
    const dias = DIVISAO_SEED.map((treino) => treino.diaSemana);
    expect(new Set(dias).size).toBe(dias.length);
    for (const dia of dias) {
      expect(Number.isInteger(dia) && dia >= 0 && dia <= 6).toBe(true);
    }
  });

  it.each(exercicios.map((e) => [e.nome, e] as const))(
    '%s começa com reps dentro da faixa e valores válidos',
    (_nome, exercicio) => {
      expect(exercicio.repsMin).toBeLessThanOrEqual(exercicio.repsAtuais);
      expect(exercicio.repsAtuais).toBeLessThanOrEqual(exercicio.repsMax);
      expect(exercicio.seriesAlvo).toBeGreaterThanOrEqual(1);
      expect(exercicio.cargaKg).toBeGreaterThanOrEqual(0);
      expect(exercicio.incrementoKg).toBeGreaterThanOrEqual(0);
    },
  );

  it('peso corporal começa com carga 0 e incremento 0 (§5.2)', () => {
    for (const exercicio of exercicios.filter((e) => e.equipamento === 'peso_corporal')) {
      expect(exercicio.cargaKg).toBe(0);
      expect(exercicio.incrementoKg).toBe(0);
    }
  });

  it('exercício repetido em dois treinos tem a mesma configuração nos dois', () => {
    // O seed grava o primeiro e reaproveita nos demais; uma configuração
    // diferente na repetição seria descartada sem aviso.
    const primeiroPorNome = new Map<string, (typeof exercicios)[number]>();
    for (const exercicio of exercicios) {
      const primeiro = primeiroPorNome.get(exercicio.nome);
      if (primeiro === undefined) {
        primeiroPorNome.set(exercicio.nome, exercicio);
      } else {
        expect(exercicio).toEqual(primeiro);
      }
    }
  });
});
