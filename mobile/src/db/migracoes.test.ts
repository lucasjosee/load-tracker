import { MIGRACOES, migracoesPendentes, type Migracao } from './migracoes';

const tres: Migracao[] = [
  { versao: 1, sql: 'v1' },
  { versao: 2, sql: 'v2' },
  { versao: 3, sql: 'v3' },
];

describe('migracoesPendentes', () => {
  it('banco novo (versão 0) recebe todas, na ordem', () => {
    expect(migracoesPendentes(0, tres).map((m) => m.versao)).toEqual([1, 2, 3]);
  });

  it('banco na versão 1 recebe só as seguintes', () => {
    expect(migracoesPendentes(1, tres).map((m) => m.versao)).toEqual([2, 3]);
  });

  it('banco já atualizado não recebe nenhuma', () => {
    expect(migracoesPendentes(3, tres)).toEqual([]);
  });

  it('banco de uma versão mais nova do app não recebe nenhuma', () => {
    expect(migracoesPendentes(5, tres)).toEqual([]);
  });

  it('acusa lista com buraco na numeração', () => {
    const comBuraco = [tres[0], tres[2]];
    expect(() => migracoesPendentes(0, comBuraco)).toThrow('esperado 2');
  });

  it('acusa lista fora de ordem', () => {
    const foraDeOrdem = [tres[1], tres[0]];
    expect(() => migracoesPendentes(0, foraDeOrdem)).toThrow('esperado 1');
  });

  it('a lista real do app está bem numerada', () => {
    expect(() => migracoesPendentes(0, MIGRACOES)).not.toThrow();
  });
});
