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

  it('a v2 só acrescenta a coluna meta_falhas, sem recriar tabela (o histórico do iPhone fica)', () => {
    const v2 = MIGRACOES.find((m) => m.versao === 2);
    expect(v2?.sql).toContain('ALTER TABLE registro ADD COLUMN meta_falhas INTEGER');
    expect(v2?.sql).not.toMatch(/DROP|DELETE|CREATE TABLE/i);
  });

  it('a v3 cria a coluna carga_por_lado e esvazia o banco, sem derrubar tabela', () => {
    const v3 = MIGRACOES.find((m) => m.versao === 3);
    expect(v3?.sql).toContain('ALTER TABLE exercicio ADD COLUMN carga_por_lado INTEGER NOT NULL DEFAULT 0');
    expect(v3?.sql).not.toMatch(/DROP|CREATE TABLE/i);
    // Filhos antes dos pais: apagar `exercicio` antes de `registro` violaria a chave estrangeira.
    const posicao = (tabela: string) => v3?.sql.indexOf(`DELETE FROM ${tabela};`) ?? -1;
    for (const tabela of ['evento', 'serie', 'registro', 'sessao', 'estado_progressao', 'treino_exercicio', 'treino_dia', 'exercicio', 'treino', 'config']) {
      expect(posicao(tabela)).toBeGreaterThan(-1);
    }
    expect(posicao('evento')).toBeLessThan(posicao('registro'));
    expect(posicao('registro')).toBeLessThan(posicao('exercicio'));
    expect(posicao('registro')).toBeLessThan(posicao('sessao'));
    expect(posicao('treino_exercicio')).toBeLessThan(posicao('exercicio'));
    expect(posicao('exercicio')).toBeLessThan(posicao('treino'));
  });

  it('a v4 só acrescenta a coluna nota (o histórico do iPhone fica)', () => {
    const v4 = MIGRACOES.find((m) => m.versao === 4);
    expect(v4?.sql).toContain('ALTER TABLE exercicio ADD COLUMN nota TEXT');
    expect(v4?.sql).not.toMatch(/DROP|DELETE|CREATE TABLE/i);
  });

  it('a lista real do app está bem numerada', () => {
    expect(() => migracoesPendentes(0, MIGRACOES)).not.toThrow();
  });
});
