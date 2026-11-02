import { montarBackup, nomeDoArquivoDeBackup } from './backup';

describe('montarBackup', () => {
  it('guarda as tabelas com o formato, a versão do banco e a data', () => {
    const tabelas = { treino: [{ id: 't1', nome: 'Push', criado_em: '2026-11-02T10:00:00.000Z' }] };
    expect(montarBackup(tabelas, 1, '2026-11-02T12:00:00.000Z')).toEqual({
      formato: 'load-tracker-backup',
      versaoDoBanco: 1,
      exportadoEm: '2026-11-02T12:00:00.000Z',
      tabelas,
    });
  });

  it('o resultado vira JSON e volta igual', () => {
    const backup = montarBackup({ config: [{ chave: 'a', valor: 'b' }] }, 1, '2026-11-02T12:00:00.000Z');
    expect(JSON.parse(JSON.stringify(backup))).toEqual(backup);
  });
});

describe('nomeDoArquivoDeBackup', () => {
  it('usa a data no nome', () => {
    expect(nomeDoArquivoDeBackup('2026-11-02')).toBe('load-tracker-2026-11-02.json');
  });
});
