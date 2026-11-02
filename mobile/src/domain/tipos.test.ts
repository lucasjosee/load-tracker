import {
  configPadrao,
  ehEquipamento,
  ehGrupoMuscular,
  EQUIPAMENTOS,
  GRUPOS_MUSCULARES,
  INCREMENTO_PADRAO_KG,
} from './tipos';

describe('configPadrao', () => {
  it('usa faixa 8–12, 3 séries e limite de 3 falhas (§5.1)', () => {
    expect(configPadrao('halter')).toEqual({
      repsMin: 8,
      repsMax: 12,
      seriesAlvo: 3,
      incrementoKg: 2,
      limiteFalhas: 3,
    });
  });

  it.each([
    ['halter', 2],
    ['barra', 2],
    ['maquina', 5],
    ['polia', 5],
    ['peso_corporal', 0],
    ['outro', 2],
  ] as const)('%s começa com incremento de %d kg (§5.2)', (equipamento, incremento) => {
    expect(configPadrao(equipamento).incrementoKg).toBe(incremento);
  });

  it('tem incremento padrão para todos os equipamentos', () => {
    for (const equipamento of EQUIPAMENTOS) {
      expect(INCREMENTO_PADRAO_KG[equipamento]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('ehGrupoMuscular', () => {
  it('aceita todos os grupos da §7', () => {
    for (const grupo of GRUPOS_MUSCULARES) {
      expect(ehGrupoMuscular(grupo)).toBe(true);
    }
  });

  it('recusa valor fora da lista, inclusive com acento ou maiúscula', () => {
    expect(ehGrupoMuscular('bíceps')).toBe(false);
    expect(ehGrupoMuscular('Peito')).toBe(false);
    expect(ehGrupoMuscular('')).toBe(false);
  });
});

describe('ehEquipamento', () => {
  it('aceita todos os equipamentos da §7', () => {
    for (const equipamento of EQUIPAMENTOS) {
      expect(ehEquipamento(equipamento)).toBe(true);
    }
  });

  it('recusa valor fora da lista', () => {
    expect(ehEquipamento('kettlebell')).toBe(false);
    expect(ehEquipamento('peso corporal')).toBe(false);
  });
});
