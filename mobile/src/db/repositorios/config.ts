import type { SQLiteDatabase } from 'expo-sqlite';

// Convenções: ver o comentário no topo de treinos.ts.
//
// Tabela chave → valor para preferências soltas (§9). Os valores são texto;
// quem lê converte. Todas as chaves usadas pelo app ficam listadas aqui.
export type ChaveDeConfig =
  | 'horario_notificacao' // 'HH:MM' do aviso do treino
  | 'onboarding_concluido'; // '1' depois do onboarding

export async function obterConfig(db: SQLiteDatabase, chave: ChaveDeConfig): Promise<string | null> {
  const linha = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM config WHERE chave = ?', chave);
  return linha?.valor ?? null;
}

export async function salvarConfig(db: SQLiteDatabase, chave: ChaveDeConfig, valor: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO config (chave, valor) VALUES (?, ?)
     ON CONFLICT (chave) DO UPDATE SET valor = excluded.valor`,
    chave,
    valor,
  );
}
