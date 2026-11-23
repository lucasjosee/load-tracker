import { DIVISAO_SEED } from './seed';

// O banco também barra boa parte disto (CHECK no schema), mas lá o erro só
// aparece no iPhone, ao abrir o app. Aqui ele aparece no `npm run check`.
const exercicios = DIVISAO_SEED.flatMap((treino) => treino.exercicios);

describe('DIVISAO_SEED', () => {
  it('tem no máximo um treino por dia, entre 0 (domingo) e 6 (sábado)', () => {
    const dias = DIVISAO_SEED.flatMap((treino) => treino.dias);
    expect(new Set(dias).size).toBe(dias.length);
    for (const dia of dias) {
      expect(Number.isInteger(dia) && dia >= 0 && dia <= 6).toBe(true);
    }
  });

  it('todo treino cai em pelo menos um dia', () => {
    for (const treino of DIVISAO_SEED) {
      expect(treino.dias.length).toBeGreaterThan(0);
    }
  });

  it.each(exercicios.map((e) => [e.nome, e] as const))('%s tem faixa, séries e incremento válidos', (_nome, exercicio) => {
    expect(exercicio.repsMin).toBeGreaterThanOrEqual(1);
    expect(exercicio.repsMin).toBeLessThanOrEqual(exercicio.repsMax);
    expect(exercicio.seriesAlvo).toBeGreaterThanOrEqual(1);
    expect(exercicio.incrementoKg).toBeGreaterThanOrEqual(0);
  });

  it('peso corporal não tem incremento nem carga por lado (§5.2)', () => {
    for (const exercicio of exercicios.filter((e) => e.equipamento === 'peso_corporal')) {
      expect(exercicio.incrementoKg).toBe(0);
      expect(exercicio.porLado).toBe(false);
    }
  });

  it('o mesmo exercício não aparece duas vezes no mesmo treino', () => {
    for (const treino of DIVISAO_SEED) {
      const nomes = treino.exercicios.map((e) => e.nome);
      expect(new Set(nomes).size).toBe(nomes.length);
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

  it('panturrilha e abdômen entram nos dias de Push e de Legs', () => {
    for (const nome of ['Push', 'Legs']) {
      const grupos = DIVISAO_SEED.find((treino) => treino.nome === nome)?.exercicios.map((e) => e.grupoMuscular);
      expect(grupos).toContain('panturrilha');
      expect(grupos).toContain('abdomen');
    }
  });
});
