import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { inicializarBanco, NOME_DO_BANCO } from '@/db/banco';
import { AoAbrirOApp } from '@/notificacoes/AoAbrirOApp';

// O SQLiteProvider abre o banco e roda `inicializarBanco` (migrações e seed)
// antes de mostrar qualquer tela; as telas pegam a conexão com useSQLiteContext().
//
// A Stack raiz fica por fora das abas para que as outras telas (treino,
// exercício, registro) abram por cima da barra de abas, em vez de dentro dela.
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={NOME_DO_BANCO} onInit={inicializarBanco}>
      <AoAbrirOApp />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="treino/novo" options={{ title: 'Novo treino', presentation: 'modal' }} />
        <Stack.Screen name="treino/[id]" options={{ title: 'Treino', headerBackTitle: 'Divisão' }} />
        <Stack.Screen name="exercicio/novo" options={{ title: 'Novo exercício', presentation: 'modal' }} />
        <Stack.Screen name="exercicio/[id]" options={{ title: 'Exercício' }} />
        <Stack.Screen name="permissao" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </SQLiteProvider>
  );
}
