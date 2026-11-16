import type { SQLiteDatabase } from 'expo-sqlite';

import { ehObjetivo, type Objetivo } from '@/domain/tipos';

// Convenções: ver o comentário no topo de treinos.ts.
//
// Tabela chave → valor para preferências soltas (§9). Os valores são texto;
// quem lê converte. Todas as chaves usadas pelo app ficam listadas aqui.
export type ChaveDeConfig =
  | 'horario_notificacao' // 'HH:MM' do aviso do treino
  | 'onboarding_concluido' // '1' depois do onboarding
  | 'descanso_segundos' // duração do cronômetro de descanso (domain/descanso.ts)
  | 'seed_dispensado' // '1' = o seed de desenvolvimento não regrava a divisão (dadosFicticios.ts)
  // Perfil do onboarding (§3.1). Cada chave só existe se a pessoa informou.
  | 'nome'
  | 'objetivo' // 'forca' | 'hipertrofia': escolhe a faixa de reps padrão (§5.1)
  | 'tempo_de_treino'; // registrado, ainda sem uso

export async function obterConfig(db: SQLiteDatabase, chave: ChaveDeConfig): Promise<string | null> {
  const linha = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM config WHERE chave = ?', chave);
  return linha?.valor ?? null;
}

// O objetivo guardado, ou null se a pessoa não informou (vale a faixa 8–12).
export async function obterObjetivo(db: SQLiteDatabase): Promise<Objetivo | null> {
  const valor = await obterConfig(db, 'objetivo');
  return valor !== null && ehObjetivo(valor) ? valor : null;
}

export async function salvarConfig(db: SQLiteDatabase, chave: ChaveDeConfig, valor: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO config (chave, valor) VALUES (?, ?)
     ON CONFLICT (chave) DO UPDATE SET valor = excluded.valor`,
    chave,
    valor,
  );
}
