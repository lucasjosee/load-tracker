// Formato do arquivo de backup (F12). TS puro: a leitura das tabelas e a
// gravação do arquivo ficam fora do domínio (src/db/backup.ts).

export const FORMATO_DO_BACKUP = 'load-tracker-backup';

export interface Backup {
  formato: typeof FORMATO_DO_BACKUP;
  versaoDoBanco: number; // PRAGMA user_version: diz como ler as tabelas
  exportadoEm: string; // ISO 8601
  tabelas: Record<string, unknown[]>;
}

export function montarBackup(
  tabelas: Record<string, unknown[]>,
  versaoDoBanco: number,
  exportadoEm: string,
): Backup {
  return { formato: FORMATO_DO_BACKUP, versaoDoBanco, exportadoEm, tabelas };
}

// 'load-tracker-2026-11-02.json': a data no nome ajuda a achar o mais recente.
export function nomeDoArquivoDeBackup(data: string): string {
  return `load-tracker-${data}.json`;
}

// ---------- Restaurar (tarefa 7.7) ----------

// Todas as tabelas do schema (src/db/migracoes.ts), com os pais antes dos
// filhos: é a ordem de inserir. Para apagar, a ordem é a inversa, por causa
// das chaves estrangeiras.
export const TABELAS_DO_BACKUP = [
  'treino',
  'treino_dia',
  'exercicio',
  'treino_exercicio',
  'estado_progressao',
  'sessao',
  'registro',
  'serie',
  'evento',
  'config',
] as const;
export type TabelaDoBackup = (typeof TABELAS_DO_BACKUP)[number];

// O SQLite só devolve texto, número ou nulo nas colunas deste schema.
export type ValorDeCelula = string | number | null;
export type LinhaDoBackup = Record<string, ValorDeCelula>;

export interface BackupLido {
  versaoDoBanco: number;
  exportadoEm: string;
  tabelas: Record<TabelaDoBackup, LinhaDoBackup[]>;
}

type Leitura = { ok: true; valor: BackupLido } | { ok: false; erro: string };

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function ehLinha(valor: unknown): valor is LinhaDoBackup {
  return (
    ehObjeto(valor) &&
    Object.values(valor).every((celula) => celula === null || typeof celula === 'string' || typeof celula === 'number')
  );
}

// Confere um arquivo antes de ele chegar perto do banco. O arquivo vem de
// fora do app (pode ser outro JSON qualquer, ou um backup editado à mão),
// então nada nele é confiável até passar por aqui.
//
// `versaoDoApp` é a versão do schema que este app conhece. Backup mais antigo
// é aceito: as colunas que ele não tem ficam com o valor padrão do banco.
// Backup mais novo é recusado, porque pode ter colunas e regras que este app
// não entende.
export function lerBackup(texto: string, versaoDoApp: number): Leitura {
  const erro = (mensagem: string): Leitura => ({ ok: false, erro: mensagem });

  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    return erro('O arquivo não é um JSON válido.');
  }
  if (!ehObjeto(dados) || dados.formato !== FORMATO_DO_BACKUP) {
    return erro('Este arquivo não é um backup do Load Tracker.');
  }
  const { versaoDoBanco, exportadoEm, tabelas } = dados;
  if (typeof versaoDoBanco !== 'number' || !Number.isInteger(versaoDoBanco) || versaoDoBanco < 1) {
    return erro('O backup não diz de qual versão do banco ele é.');
  }
  if (versaoDoBanco > versaoDoApp) {
    return erro('Este backup foi feito por uma versão mais nova do app. Atualize o app para restaurar.');
  }
  if (typeof exportadoEm !== 'string' || !ehObjeto(tabelas)) {
    return erro('O backup está incompleto.');
  }

  const lidas = {} as Record<TabelaDoBackup, LinhaDoBackup[]>;
  for (const tabela of TABELAS_DO_BACKUP) {
    const linhas = tabelas[tabela];
    if (!Array.isArray(linhas) || !linhas.every(ehLinha)) {
      return erro(`O backup está incompleto: a tabela "${tabela}" está faltando ou com formato errado.`);
    }
    lidas[tabela] = linhas;
  }
  return { ok: true, valor: { versaoDoBanco, exportadoEm, tabelas: lidas } };
}

// As colunas de uma linha do backup que existem no banco de hoje, na ordem
// do banco. Coluna que o backup tem e o banco não conhece é ignorada; assim
// um nome de coluna vindo do arquivo nunca entra no SQL.
export function colunasParaRestaurar(linha: LinhaDoBackup, colunasDoBanco: readonly string[]): string[] {
  return colunasDoBanco.filter((coluna) => coluna in linha);
}

// "12 exercícios e 87 registros, exportado em 14/11/2026": o que a tela
// mostra antes de pedir a confirmação.
export function resumoDoBackup(backup: BackupLido): string {
  const exercicios = backup.tabelas.exercicio.length;
  const registros = backup.tabelas.registro.length;
  const [ano, mes, dia] = backup.exportadoEm.slice(0, 10).split('-');
  const quando = ano && mes && dia ? `${dia}/${mes}/${ano}` : 'data desconhecida';
  return `${exercicios} ${exercicios === 1 ? 'exercício' : 'exercícios'} e ${registros} ${registros === 1 ? 'registro' : 'registros'}, exportado em ${quando}`;
}
