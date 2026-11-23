import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Share } from 'react-native';

import {
  colunasParaRestaurar,
  montarBackup,
  nomeDoArquivoDeBackup,
  TABELAS_DO_BACKUP,
  type BackupLido,
} from '@/domain/backup';

import { MIGRACOES } from './migracoes';
import { salvarConfig } from './repositorios/config';
import { emTransacao } from './transacao';

// Os nomes das tabelas entram no SQL por interpolação porque SQLite não
// aceita `?` no lugar de nome de tabela; é seguro porque a lista é nossa,
// fixa no código (TABELAS_DO_BACKUP, no domínio).
const TABELAS = TABELAS_DO_BACKUP;

// A versão do schema que este app conhece: a da última migração.
export const VERSAO_DO_BANCO = MIGRACOES.length;

// Copia o banco inteiro, linha por linha, como está gravado (snake_case).
// Guardar as linhas cruas, e não os tipos do app, faz o backup servir para
// restaurar o banco mesmo depois que o código mudar.
export async function exportarBackup(db: SQLiteDatabase, hoje: string): Promise<void> {
  const tabelas: Record<string, unknown[]> = {};
  for (const tabela of TABELAS) {
    tabelas[tabela] = await db.getAllAsync(`SELECT * FROM ${tabela}`);
  }
  const versao = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
  const backup = montarBackup(tabelas, versao, new Date().toISOString());

  // O arquivo vai para o cache: o iOS pode apagá-lo depois, e tudo bem,
  // porque a cópia que importa é a que a pessoa salvar pelo compartilhar.
  const arquivo = new File(Paths.cache, nomeDoArquivoDeBackup(hoje));
  arquivo.create({ overwrite: true });
  await arquivo.write(JSON.stringify(backup, null, 2));

  // No iOS, compartilhar uma URL de arquivo abre o menu com "Salvar em
  // Arquivos", AirDrop, e-mail etc.
  await Share.share({ url: arquivo.uri });
}

// Abre o seletor de arquivos do iOS e devolve o texto do arquivo escolhido,
// ou null se a pessoa cancelou. `copyToCacheDirectory` copia o arquivo para
// dentro do app, que é onde ele tem permissão de ler.
export async function escolherArquivoDeBackup(): Promise<string | null> {
  const escolha = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  const arquivo = escolha.canceled ? undefined : escolha.assets[0];
  if (arquivo === undefined) {
    return null;
  }
  return new File(arquivo.uri).text();
}

// Troca TUDO o que está no banco pelo conteúdo do backup, já conferido por
// `lerBackup` (domínio). Uma transação só: se uma linha for recusada pelo
// banco (CHECK ou chave estrangeira), nada muda e os dados de antes ficam.
//
// No fim, a marca `seed_aplicado`: um backup antigo não a tem, e sem ela o
// seed de desenvolvimento (banco.ts) apagaria os dados restaurados na
// próxima abertura do app.
export async function restaurarBackup(db: SQLiteDatabase, backup: BackupLido): Promise<void> {
  await emTransacao(db, async (txn) => {
    // Apaga dos filhos para os pais; insere dos pais para os filhos.
    for (const tabela of [...TABELAS].reverse()) {
      await txn.execAsync(`DELETE FROM ${tabela}`);
    }
    for (const tabela of TABELAS) {
      // Os nomes de coluna que entram no SQL vêm do próprio banco, nunca do
      // arquivo; os valores vão sempre por parâmetro (`?`).
      const colunasDoBanco = (await txn.getAllAsync<{ name: string }>(`PRAGMA table_info(${tabela})`)).map((c) => c.name);
      for (const linha of backup.tabelas[tabela]) {
        const colunas = colunasParaRestaurar(linha, colunasDoBanco);
        if (colunas.length === 0) {
          continue;
        }
        await txn.runAsync(
          `INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES (${colunas.map(() => '?').join(', ')})`,
          colunas.map((coluna) => linha[coluna] ?? null),
        );
      }
    }
    await salvarConfig(txn, 'seed_aplicado', '1');
  });
}
