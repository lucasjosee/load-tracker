import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

// Configuração que vale por conexão, não por arquivo: toda conexão nova
// precisa recebê-la. Sem `foreign_keys = ON`, o SQLite ignora os REFERENCES e
// os ON DELETE CASCADE do schema. `busy_timeout` faz uma escrita esperar até
// 3 s por outra que esteja em andamento, em vez de falhar na hora com
// "database is locked".
export const PRAGMAS_DA_CONEXAO = 'PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;';

// Roda `tarefa` numa transação: ou tudo é gravado, ou nada (regra 7).
//
// Por que não usar `db.withExclusiveTransactionAsync()`: ele abre uma conexão
// nova para a transação, e nessa conexão as chaves estrangeiras vêm desligadas.
// Aqui fazemos o mesmo (conexão própria, para que nenhuma consulta de outra
// tela caia no meio da transação), mas ligando os PRAGMAs antes do BEGIN,
// porque dentro de uma transação o SQLite ignora `foreign_keys`.
//
// Dentro de `tarefa`, use só o `txn` recebido, nunca o `db` de fora.
export async function emTransacao<T>(
  db: SQLiteDatabase,
  tarefa: (txn: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const corte = db.databasePath.lastIndexOf('/');
  const txn = await openDatabaseAsync(
    db.databasePath.slice(corte + 1),
    { useNewConnection: true },
    db.databasePath.slice(0, corte),
  );
  try {
    await txn.execAsync(PRAGMAS_DA_CONEXAO);
    // IMMEDIATE reserva a escrita já no início; com o BEGIN comum, duas
    // transações poderiam ler juntas e só brigar na hora de gravar.
    await txn.execAsync('BEGIN IMMEDIATE');
    try {
      const resultado = await tarefa(txn);
      await txn.execAsync('COMMIT');
      return resultado;
    } catch (erro) {
      // Se o SQLite já desfez a transação sozinho, o ROLLBACK também falha;
      // o erro que interessa é o original.
      await txn.execAsync('ROLLBACK').catch(() => undefined);
      throw erro;
    }
  } finally {
    await txn.closeAsync();
  }
}
