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
