import { Stack } from 'expo-router';
import { useState } from 'react';

import type { Rascunho } from '@/api/contrato';
import { ContextoDoRascunho } from '@/hooks/onboarding';

// Passos do primeiro uso (§3.1): boas-vindas → conversa → revisão → permissão.
// O rascunho fica aqui, no layout, para a conversa e a revisão verem o mesmo.
export default function LayoutOnboarding() {
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);

  return (
    <ContextoDoRascunho.Provider value={{ rascunho, setRascunho }}>
      <Stack screenOptions={{ headerBackTitle: 'Voltar' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="conversa" options={{ title: 'Sua divisão' }} />
        <Stack.Screen name="revisao" options={{ title: 'Revisão' }} />
        <Stack.Screen name="permissao" options={{ headerShown: false }} />
      </Stack>
    </ContextoDoRascunho.Provider>
  );
}
