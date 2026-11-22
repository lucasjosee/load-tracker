import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { OPCOES_DE_NAVEGACAO } from '@/components/navegacao';
import { fonte } from '@/components/tema';
import { inicializarBanco, NOME_DO_BANCO } from '@/db/banco';
import { precisaDeOnboarding } from '@/db/operacoes';
import { ContextoFimDoOnboarding } from '@/hooks/onboarding';
import { AoAbrirOApp } from '@/notificacoes/AoAbrirOApp';

// O splash fica na tela até a fonte carregar. Sem isto, a primeira tela
// apareceria um instante na fonte do sistema e depois "pularia" para a Saira.
SplashScreen.preventAutoHideAsync();

// Cada família lista um arquivo por peso. No iOS o `weight` daqui não é
// usado: o sistema lê o peso de dentro do arquivo. Fica escrito para quem lê.
const FONTES = [
  {
    fontFamily: fonte.normal,
    fontDefinitions: [
      { path: require('../assets/fonte/Saira-Regular.ttf'), weight: 400 },
      { path: require('../assets/fonte/Saira-Medium.ttf'), weight: 500 },
      { path: require('../assets/fonte/Saira-SemiBold.ttf'), weight: 600 },
      { path: require('../assets/fonte/Saira-Bold.ttf'), weight: 700 },
      { path: require('../assets/fonte/Saira-ExtraBold.ttf'), weight: 800 },
    ],
  },
  {
    fontFamily: fonte.larga,
    fontDefinitions: [
      { path: require('../assets/fonte/SairaLarga-Bold.ttf'), weight: 700 },
      { path: require('../assets/fonte/SairaLarga-ExtraBold.ttf'), weight: 800 },
    ],
  },
];

// O SQLiteProvider abre o banco e roda `inicializarBanco` (migrações e seed)
// antes de mostrar qualquer tela; as telas pegam a conexão com useSQLiteContext().
export default function RootLayout() {
  const [fontesProntas, erroNasFontes] = useFonts(FONTES);
  // Se a fonte falhar, o app abre mesmo assim, na fonte do sistema: feio,
  // mas usável. Ficar preso no splash seria pior.
  const podeMostrar = fontesProntas || erroNasFontes !== null;

  useEffect(() => {
    if (podeMostrar) {
      SplashScreen.hide();
    }
  }, [podeMostrar]);

  if (!podeMostrar) {
    return null;
  }

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
    <ContextoFimDoOnboarding.Provider
      value={{ concluir: () => setEmOnboarding(false), refazer: () => setEmOnboarding(true) }}
    >
      <Stack screenOptions={OPCOES_DE_NAVEGACAO}>
        <Stack.Protected guard={!emOnboarding}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* O treino em andamento: por cima das abas, com a seta de voltar de sempre. */}
          <Stack.Screen name="sessao" options={{ title: 'Treino', headerBackTitle: 'Hoje' }} />
          <Stack.Screen name="treino/novo" options={{ title: 'Novo treino', presentation: 'modal' }} />
          <Stack.Screen name="treino/[id]" options={{ title: 'Treino', headerBackTitle: 'Divisão' }} />
          <Stack.Screen name="exercicio/novo" options={{ title: 'Novo exercício', presentation: 'modal' }} />
          <Stack.Screen name="exercicio/[id]" options={{ title: 'Exercício' }} />
          <Stack.Screen name="grupo/[grupo]" options={{ title: 'Grupo', headerBackTitle: 'Evolução' }} />
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
