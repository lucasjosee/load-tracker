import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { inicializarBanco, NOME_DO_BANCO } from '@/db/banco';
import { precisaDeOnboarding } from '@/db/operacoes';
import { ContextoFimDoOnboarding } from '@/hooks/onboarding';
import { AoAbrirOApp } from '@/notificacoes/AoAbrirOApp';

// O SQLiteProvider abre o banco e roda `inicializarBanco` (migrações e seed)
// antes de mostrar qualquer tela; as telas pegam a conexão com useSQLiteContext().
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName={NOME_DO_BANCO} onInit={inicializarBanco}>
      <AoAbrirOApp />
      <Navegacao />
    </SQLiteProvider>
  );
}

// A Stack raiz fica por fora das abas para que as outras telas (treino,
// exercício, registro) abram por cima da barra de abas, em vez de dentro dela.
//
// Stack.Protected esconde as rotas quando `guard` é falso: no primeiro uso só
// o onboarding existe; depois dele, só o resto do app. Quando a guarda muda,
// o Expo Router leva sozinho para a primeira tela liberada (a aba Hoje).
function Navegacao() {
  const db = useSQLiteContext();
  const [emOnboarding, setEmOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    precisaDeOnboarding(db).then(setEmOnboarding);
  }, [db]);

  if (emOnboarding === null) {
    return null; // um instante, enquanto lê o banco
  }

  return (
    <ContextoFimDoOnboarding.Provider value={() => setEmOnboarding(false)}>
      <Stack>
        <Stack.Protected guard={!emOnboarding}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="treino/novo" options={{ title: 'Novo treino', presentation: 'modal' }} />
          <Stack.Screen name="treino/[id]" options={{ title: 'Treino', headerBackTitle: 'Divisão' }} />
          <Stack.Screen name="exercicio/novo" options={{ title: 'Novo exercício', presentation: 'modal' }} />
          <Stack.Screen name="exercicio/[id]" options={{ title: 'Exercício' }} />
          <Stack.Screen name="permissao" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="registro" options={{ title: 'Registro rápido', presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={emOnboarding}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ContextoFimDoOnboarding.Provider>
  );
}
