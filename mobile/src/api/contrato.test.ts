import { EQUIPAMENTOS, GRUPOS_MUSCULARES } from '@/domain/tipos';

import { equipamento, grupoMuscular } from './contrato';

// O contrato não importa o domínio (ele é copiado igual para o servidor),
// então as listas são repetidas lá. Este teste garante que continuam iguais.
describe('contrato espelha o domínio', () => {
  it('grupos musculares', () => {
    expect(grupoMuscular.options).toEqual([...GRUPOS_MUSCULARES]);
  });

  it('equipamentos', () => {
    expect(equipamento.options).toEqual([...EQUIPAMENTOS]);
  });
});
