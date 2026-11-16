import { EQUIPAMENTOS, GRUPOS_MUSCULARES, OBJETIVOS, TEMPOS_DE_TREINO } from '@/domain/tipos';

import { equipamento, grupoMuscular, objetivo, tempoDeTreino } from './contrato';

// O contrato não importa o domínio (ele é copiado igual para o servidor),
// então as listas são repetidas lá. Este teste garante que continuam iguais.
describe('contrato espelha o domínio', () => {
  it('grupos musculares', () => {
    expect(grupoMuscular.options).toEqual([...GRUPOS_MUSCULARES]);
  });

  it('equipamentos', () => {
    expect(equipamento.options).toEqual([...EQUIPAMENTOS]);
  });

  it('objetivos e tempos de treino', () => {
    expect(objetivo.options).toEqual([...OBJETIVOS]);
    expect(tempoDeTreino.options).toEqual([...TEMPOS_DE_TREINO]);
  });
});
