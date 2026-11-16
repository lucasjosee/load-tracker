import {
  colunasParaRestaurar,
  lerBackup,
  montarBackup,
  nomeDoArquivoDeBackup,
  resumoDoBackup,
  TABELAS_DO_BACKUP,
} from './backup';

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

describe('lerBackup', () => {
  const tabelasVazias = Object.fromEntries(TABELAS_DO_BACKUP.map((tabela) => [tabela, []]));
  const valido = {
    formato: 'load-tracker-backup',
    versaoDoBanco: 3,
    exportadoEm: '2026-11-14T18:30:00.000Z',
    tabelas: {
      ...tabelasVazias,
      exercicio: [{ id: 'e1', nome: 'Supino reto', incremento_kg: 2.5, carga_por_lado: 1 }],
      registro: [{ id: 'r1', sessao_id: null, exercicio_id: 'e1', carga_kg: 22.5 }],
    },
  };
  const ler = (dados: unknown, versaoDoApp = 3) => lerBackup(JSON.stringify(dados), versaoDoApp);

  it('aceita um backup do próprio app, vindo do exportar', () => {
    const exportado = montarBackup(valido.tabelas, 3, valido.exportadoEm);
    const leitura = ler(exportado);
    expect(leitura).toMatchObject({ ok: true, valor: { versaoDoBanco: 3, exportadoEm: valido.exportadoEm } });
    if (leitura.ok) {
      expect(leitura.valor.tabelas.exercicio).toEqual(valido.tabelas.exercicio);
      expect(Object.keys(leitura.valor.tabelas)).toEqual([...TABELAS_DO_BACKUP]);
    }
  });

  it('aceita backup de versão mais antiga do banco', () => {
    expect(ler({ ...valido, versaoDoBanco: 2 }).ok).toBe(true);
  });

  it('recusa backup de versão mais nova que o app', () => {
    expect(ler({ ...valido, versaoDoBanco: 4 })).toEqual({
      ok: false,
      erro: 'Este backup foi feito por uma versão mais nova do app. Atualize o app para restaurar.',
    });
  });

  it('recusa o que não é JSON', () => {
    expect(lerBackup('isto não é json', 3)).toEqual({ ok: false, erro: 'O arquivo não é um JSON válido.' });
  });

  it.each([
    ['outro JSON qualquer', { nome: 'lista de compras' }],
    ['formato errado', { ...valido, formato: 'outro-app' }],
    ['uma lista', [valido]],
    ['null', null],
  ])('recusa %s', (_caso, dados) => {
    expect(ler(dados)).toEqual({ ok: false, erro: 'Este arquivo não é um backup do Load Tracker.' });
  });

  it('recusa versão ausente, quebrada ou menor que 1', () => {
    for (const versaoDoBanco of [undefined, '3', 2.5, 0]) {
      expect(ler({ ...valido, versaoDoBanco }).ok).toBe(false);
    }
  });

  it('recusa backup sem uma das tabelas', () => {
    const semSerie = Object.fromEntries(Object.entries(valido.tabelas).filter(([tabela]) => tabela !== 'serie'));
    expect(ler({ ...valido, tabelas: semSerie })).toMatchObject({ ok: false, erro: expect.stringContaining('"serie"') });
  });

  it('recusa linha que não é objeto simples ou que tem valor que o banco não guarda', () => {
    const com = (linhas: unknown) => ler({ ...valido, tabelas: { ...valido.tabelas, treino: linhas } });
    expect(com('texto').ok).toBe(false);
    expect(com([['id', 't1']]).ok).toBe(false);
    expect(com([{ id: 't1', nome: { aninhado: true } }]).ok).toBe(false);
    expect(com([{ id: 't1', ativo: true }]).ok).toBe(false);
    expect(com([{ id: 't1', nome: 'Push', criado_em: null }]).ok).toBe(true);
  });
});

describe('colunasParaRestaurar', () => {
  const colunasDoBanco = ['id', 'nome', 'incremento_kg', 'carga_por_lado'];

  it('fica com as colunas que o banco tem, na ordem do banco', () => {
    expect(colunasParaRestaurar({ carga_por_lado: 1, nome: 'Supino', id: 'e1', incremento_kg: 2.5 }, colunasDoBanco)).toEqual(
      colunasDoBanco,
    );
  });

  it('backup antigo: a coluna que ele não tem fica de fora (o banco usa o padrão)', () => {
    expect(colunasParaRestaurar({ id: 'e1', nome: 'Supino', incremento_kg: 5 }, colunasDoBanco)).toEqual([
      'id',
      'nome',
      'incremento_kg',
    ]);
  });

  it('coluna que o banco não conhece é ignorada, mesmo com nome malicioso', () => {
    const linha = { id: 'e1', 'nome); DROP TABLE treino; --': 'x', coluna_inventada: 1 };
    expect(colunasParaRestaurar(linha, colunasDoBanco)).toEqual(['id']);
  });
});

describe('resumoDoBackup', () => {
  it('conta exercícios e registros e mostra o dia da exportação', () => {
    const tabelas = Object.fromEntries(TABELAS_DO_BACKUP.map((tabela) => [tabela, []]));
    const leitura = lerBackup(
      JSON.stringify({
        formato: 'load-tracker-backup',
        versaoDoBanco: 3,
        exportadoEm: '2026-11-14T18:30:00.000Z',
        tabelas: { ...tabelas, exercicio: [{ id: 'e1' }], registro: [{ id: 'r1' }, { id: 'r2' }] },
      }),
      3,
    );
    expect(leitura.ok && resumoDoBackup(leitura.valor)).toBe('1 exercício e 2 registros, exportado em 14/11/2026');
  });
});
