import { File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Share } from 'react-native';

import { montarBackup, nomeDoArquivoDeBackup } from '@/domain/backup';

// Todas as tabelas do schema (migracoes.ts). Os nomes entram no SQL por
// interpolação porque SQLite não aceita `?` no lugar de nome de tabela; é
// seguro porque a lista é nossa, fixa no código.
const TABELAS = [
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
