import { Stack } from 'expo-router';

// A Stack raiz fica por fora das abas para que, nas próximas tarefas, telas
// como o detalhe do exercício e o modal de registro abram por cima da barra
// de abas, em vez de dentro dela.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
